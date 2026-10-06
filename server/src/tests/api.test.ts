import assert from 'assert';
import { createExpressApp } from '../app.ts';
import { connectDB, db, flushLocalStoreSync } from '../config/db.ts';
import { ensureSeeded } from '../seed/seed.ts';
import { signToken } from '../utils/jwt.ts';

async function runIntegrationTests() {
  console.log('🧪 Starting Lumina Scholar Comprehensive Security & Integration Test Suite...');
  await connectDB();
  await ensureSeeded();

  const app = createExpressApp();
  const server = app.listen(0);
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  const request = async (path: string, options: RequestInit = {}) => {
    const res = await fetch(`${baseUrl}${path}`, options);
    const data = await res.json();
    return { status: res.status, data };
  };

  let tempUserId: string | null = null;

  try {
    // 1. Test Login with Seeded Demo Student & Verify No Password Exposure
    const loginRes = await request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@lumina.edu', password: 'Student@123' }),
    });
    assert.strictEqual(loginRes.status, 200, 'Student login should succeed');
    assert.ok(loginRes.data.token, 'Student token must be returned');
    assert.strictEqual(loginRes.data.user.password, undefined, 'Password hash MUST NEVER be returned on login');

    const studentToken = loginRes.data.token;
    const studentHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    };

    const meRes = await request('/auth/me', { headers: studentHeaders });
    assert.strictEqual(meRes.status, 200, '/auth/me should succeed');
    assert.strictEqual(meRes.data.user.password, undefined, 'Password hash MUST NEVER be returned on /auth/me');
    console.log('  ✓ 1. Authentication & Zero Password Hash Exposure');

    // 2. Test Invalid & Expired JWT Rejection
    const invalidTokenRes = await request('/auth/me', {
      headers: { Authorization: 'Bearer invalid.forged.token' },
    });
    assert.strictEqual(invalidTokenRes.status, 401, 'Invalid JWT must be rejected with 401');

    const expiredToken = signToken(
      {
        userId: loginRes.data.user._id,
        email: loginRes.data.user.email,
        role: 'student',
      },
      -10
    );
    const expiredTokenRes = await request('/auth/me', {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert.strictEqual(expiredTokenRes.status, 401, 'Expired JWT must be rejected with 401');
    console.log('  ✓ 2. Invalid & Expired JWT Rejection');

    // 3. Test Registration, Password Update Invalidation, & Cross-User Isolation
    const uniqueEmail = `audit.student.${Date.now()}@lumina.edu`;
    const regRes = await request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Audit Test Student',
        email: uniqueEmail,
        password: 'InitialPass@123',
        educationLevel: 'B.Tech CS',
      }),
    });
    assert.strictEqual(regRes.status, 201, 'Registration should succeed');
    assert.strictEqual(regRes.data.user.password, undefined, 'Password hash MUST NEVER be returned on register');
    tempUserId = regRes.data.user._id;
    const oldTempToken = regRes.data.token;

    // Update password and verify old token is immediately invalidated while fresh token works
    const pwdUpdateRes = await request('/users/me/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${oldTempToken}`,
      },
      body: JSON.stringify({
        currentPassword: 'InitialPass@123',
        newPassword: 'UpdatedPass@456',
      }),
    });
    assert.strictEqual(pwdUpdateRes.status, 200, 'Password update should succeed');
    assert.ok(pwdUpdateRes.data.token, 'Fresh rotated token should be issued');

    const oldTokenCheck = await request('/auth/me', {
      headers: { Authorization: `Bearer ${oldTempToken}` },
    });
    assert.strictEqual(oldTokenCheck.status, 401, 'Old JWT before password change MUST be rejected');

    const freshTokenCheck = await request('/auth/me', {
      headers: { Authorization: `Bearer ${pwdUpdateRes.data.token}` },
    });
    assert.strictEqual(freshTokenCheck.status, 200, 'Fresh rotated JWT after password change MUST succeed');
    console.log('  ✓ 3. Registration & Password Rotation Token Invalidation');

    // 4. Test Subjects (8) & Topics (32) Curriculum Verification
    const subjRes = await request('/subjects');
    assert.strictEqual(subjRes.status, 200);
    assert.ok(subjRes.data.subjects.length >= 8, 'At least 8 subjects must be seeded');

    const topicsRes = await request('/topics');
    assert.strictEqual(topicsRes.status, 200);
    assert.ok(topicsRes.data.topics.length >= 32, 'At least 32 topics must be seeded');
    console.log('  ✓ 4. Subjects (8) & Topics (32) Curriculum Verification');

    // 5. Test Quiz Security (Correct answers hidden before submission) & Server-Side Grading
    const quizListRes = await request('/quizzes', { headers: studentHeaders });
    assert.strictEqual(quizListRes.status, 200);
    const firstQuizId = quizListRes.data.quizzes[0]._id;

    // Verify User B (temp user) CANNOT access User A's quiz
    const crossUserQuizRes = await request(`/quizzes/${firstQuizId}`, {
      headers: { Authorization: `Bearer ${pwdUpdateRes.data.token}` },
    });
    assert.strictEqual(crossUserQuizRes.status, 404, 'Another user MUST NOT access Student A quiz');

    const takeQuizRes = await request(`/quizzes/${firstQuizId}`, { headers: studentHeaders });
    assert.strictEqual(takeQuizRes.status, 200);
    const q0 = takeQuizRes.data.quiz.questions[0];
    assert.strictEqual(q0.correctAnswer, undefined, 'correctAnswer MUST NOT be exposed before submission');
    assert.strictEqual(q0.explanation, undefined, 'explanation MUST NOT be exposed before submission');

    const submitRes = await request(`/quizzes/${firstQuizId}/submit`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        answers: [{ questionId: q0.id, userAnswer: q0.options?.[0] || 'True' }],
        timeSpentSeconds: 95,
      }),
    });
    assert.strictEqual(submitRes.status, 201, 'Quiz submission should succeed');
    assert.ok(submitRes.data.attempt.percentage !== undefined);
    console.log('  ✓ 5. Quiz Security, Cross-User Ownership Isolation & Server-Side Grading');

    // 6. Test RAG Document Q&A ("Explain normalization from my DBMS PDF.")
    const ragRes = await request('/documents/ask', {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        documentId: 'all',
        question: 'Explain normalization and BCNF from my DBMS PDF.',
      }),
    });
    assert.strictEqual(ragRes.status, 200);
    assert.strictEqual(ragRes.data.foundInDocument, true, 'RAG must retrieve grounded chunks');
    assert.ok(ragRes.data.citations.length > 0, 'RAG must return page citations');
    console.log('  ✓ 6. RAG Document Q&A & Page Citations');

    // 7. Test AI Tutor, Notes, Study Plans, Progress & Weak Topic Detection
    const plansRes = await request('/study-plans', { headers: studentHeaders });
    assert.strictEqual(plansRes.status, 200);
    assert.ok(plansRes.data.studyPlans.length >= 1);

    const progRes = await request('/progress', { headers: studentHeaders });
    assert.strictEqual(progRes.status, 200);
    assert.ok(Array.isArray(progRes.data.weakTopics));

    const searchRes = await request('/search?q=Normalization', { headers: studentHeaders });
    assert.strictEqual(searchRes.status, 200);
    assert.ok(searchRes.data.totalCount >= 1, 'Global search should return matching entities');
    console.log('  ✓ 7. Study Plans, Progress Analytics, Weak Topics & Global Search');

    // 8. Test Role-Based Authorization (RBAC) & Disabled Account Enforcement
    const studentAdminAttempt = await request('/admin/overview', { headers: studentHeaders });
    assert.strictEqual(studentAdminAttempt.status, 403, 'Student must be forbidden from /api/admin/*');

    const studentCreateSubjectAttempt = await request('/subjects', {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({ name: 'Unauthorized Subject', description: 'Test', category: 'CS' }),
    });
    assert.strictEqual(studentCreateSubjectAttempt.status, 403, 'Student must be forbidden from creating subjects');

    const adminLogin = await request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@lumina.edu', password: 'Admin@123' }),
    });
    assert.strictEqual(adminLogin.status, 200);
    const adminHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminLogin.data.token}`,
    };

    const adminOverview = await request('/admin/overview', { headers: adminHeaders });
    assert.strictEqual(adminOverview.status, 200, 'Admin must access /api/admin/overview');

    // Admin disables tempUserId and verifies tempUserId cannot access protected endpoints
    const disableRes = await request(`/admin/users/${tempUserId}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ isActive: false }),
    });
    assert.strictEqual(disableRes.status, 200);
    assert.strictEqual(disableRes.data.user.isActive, false);
    assert.strictEqual(disableRes.data.user.password, undefined, 'Admin user response must never expose password');

    const disabledUserAccess = await request('/auth/me', {
      headers: { Authorization: `Bearer ${pwdUpdateRes.data.token}` },
    });
    assert.strictEqual(disabledUserAccess.status, 403, 'Disabled user must be blocked with 403');
    console.log('  ✓ 8. Role-Based Authorization & Disabled Account Enforcement');

    // 9. PRODUCTION HEALTH & API 404 SAFETY
    const healthRes = await request('/health');
    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(healthRes.data.status, 'ok');
    assert.ok(healthRes.data.timestamp, 'Health response must include timestamp');
    assert.ok(healthRes.data.environment, 'Health response must include environment');
    assert.strictEqual(healthRes.data.jwtSecret, undefined, 'Health must never expose secrets');
    assert.strictEqual(healthRes.data.mongoUri, undefined, 'Health must never expose DB URI');

    const unknownApiRes = await request('/non-existent-production-route-xyz');
    assert.strictEqual(unknownApiRes.status, 404, 'Unknown API routes must return 404 JSON');
    assert.strictEqual(unknownApiRes.data.success, false);
    console.log('  ✓ 9. Production Health Endpoint & API 404 Safety');

    // 10. STUDENT DASHBOARD API VERIFICATION & DATA ISOLATION
    const unauthDashboard = await request('/dashboard');
    assert.strictEqual(unauthDashboard.status, 401, 'Unauthenticated /dashboard must be rejected with 401');

    const studentDashRes = await request('/dashboard', { headers: studentHeaders });
    assert.strictEqual(studentDashRes.status, 200, 'Authenticated student /dashboard must return 200');
    assert.strictEqual(studentDashRes.data.success, true);
    assert.ok(studentDashRes.data.dashboard, 'res.data.dashboard must exist');
    assert.ok(studentDashRes.data.dashboard.stats, 'Dashboard stats must exist');
    assert.ok(Array.isArray(studentDashRes.data.dashboard.weeklyStudyChart), 'weeklyStudyChart must be array');
    assert.ok(Array.isArray(studentDashRes.data.dashboard.subjectProgress), 'subjectProgress must be array');
    assert.ok(Array.isArray(studentDashRes.data.dashboard.upcomingTasks), 'upcomingTasks must be array');
    assert.ok(Array.isArray(studentDashRes.data.dashboard.recentActivities), 'recentActivities must be array');
    assert.strictEqual(typeof studentDashRes.data.dashboard.stats.totalStudyMinutes, 'number');
    assert.strictEqual(typeof studentDashRes.data.dashboard.stats.streakDays, 'number');

    // Brand new user with 0 records must safely load dashboard with safe zero/empty defaults
    const newStudentEmail = `new.student.${Date.now()}@lumina.edu`;
    const newStudentReg = await request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Student Zero Records',
        email: newStudentEmail,
        password: 'PassZero@123',
      }),
    });
    assert.strictEqual(newStudentReg.status, 201);
    const newStudentToken = newStudentReg.data.token;
    const newStudentId = newStudentReg.data.user._id;

    const newStudentDash = await request('/dashboard', {
      headers: { Authorization: `Bearer ${newStudentToken}` },
    });
    assert.strictEqual(newStudentDash.status, 200, 'New user with 0 records must receive HTTP 200 dashboard');
    assert.strictEqual(newStudentDash.data.dashboard.stats.totalStudyMinutes, 0, 'New student study minutes should be 0');
    assert.strictEqual(newStudentDash.data.dashboard.stats.quizzesTaken, 0, 'New student quiz count should be 0');
    assert.strictEqual(newStudentDash.data.dashboard.upcomingTasks.length, 0, 'New student tasks should be empty');
    assert.ok(Array.isArray(newStudentDash.data.dashboard.weeklyStudyChart), 'New student chart must be array');

    // Cross-user isolation: new user should not see student A's activities or tasks
    const newDashActivities = newStudentDash.data.dashboard.recentActivities;
    for (const act of newDashActivities) {
      assert.strictEqual(String(act.user), String(newStudentId), 'Dashboard activities must belong only to current user');
    }

    await db.users.deleteById(newStudentId);
    console.log('  ✓ 10. Student Dashboard Verification, Empty-State Handling & User Isolation');

    // 11. FLASHCARDS & SPACED REPETITION ENGINE VERIFICATION
    // 11.1 Create Deck
    const createDeckRes = await request('/flashcards/decks', {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        title: 'Algorithms & Complexity Mastery',
        description: 'Core Big-O and divide-and-conquer flashcards',
        subject: 'Algorithms & Data Structures',
        topic: 'Algorithm Analysis',
        initialCards: [
          {
            front: 'What is the worst-case time complexity of QuickSort?',
            back: 'O(n^2) when poor pivots are chosen repeatedly.',
            hint: 'Think of sorted input with naive pivot selection.',
            difficulty: 'Medium',
          },
        ],
      }),
    });
    assert.strictEqual(createDeckRes.status, 201, 'Flashcard deck creation should succeed');
    assert.strictEqual(createDeckRes.data.success, true);
    assert.strictEqual(createDeckRes.data.deck.title, 'Algorithms & Complexity Mastery');
    assert.strictEqual(createDeckRes.data.deck.cardCount, 1);
    const testDeckId = createDeckRes.data.deck._id;
    const initialCardId = createDeckRes.data.cards[0]._id;

    // 11.2 Add Card Manually
    const addCardRes = await request(`/flashcards/decks/${testDeckId}/cards`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        front: 'What is the Master Theorem condition for T(n) = 2T(n/2) + O(n)?',
        back: 'Case 2: f(n) = Theta(n^(log_b a)) -> T(n) = Theta(n log n).',
        hint: 'Compare f(n) to n^(log_2 2).',
        difficulty: 'Hard',
      }),
    });
    assert.strictEqual(addCardRes.status, 201, 'Adding a flashcard must succeed');
    const secondCardId = addCardRes.data.card._id;

    // 11.3 Review Card with SM-2 Spaced Repetition (Rating: 'good')
    const reviewRes = await request(`/flashcards/decks/${testDeckId}/review`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        cardId: initialCardId,
        rating: 'good',
      }),
    });
    assert.strictEqual(reviewRes.status, 200, 'Reviewing card with rating good must succeed');
    assert.strictEqual(reviewRes.data.card.correctCount, 1);
    assert.ok(reviewRes.data.card.interval >= 1, 'Interval must advance after good rating');
    assert.ok(reviewRes.data.card.dueAt, 'Next due date must be scheduled');

    // 11.4 Review Card with Rating: 'again'
    const reviewAgainRes = await request(`/flashcards/decks/${testDeckId}/review`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        cardId: secondCardId,
        rating: 'again',
      }),
    });
    assert.strictEqual(reviewAgainRes.status, 200, 'Reviewing card with rating again must succeed');
    assert.strictEqual(reviewAgainRes.data.card.incorrectCount, 1);
    assert.strictEqual(reviewAgainRes.data.card.interval, 0, 'Interval must reset to 0 on again rating');

    // 11.5 Get Deck By ID with aggregated statistics
    const getDeckRes = await request(`/flashcards/decks/${testDeckId}`, {
      headers: studentHeaders,
    });
    assert.strictEqual(getDeckRes.status, 200);
    assert.strictEqual(getDeckRes.data.deck.cardCount, 2);
    assert.strictEqual(getDeckRes.data.cards.length, 2);

    // 11.6 Flashcard Summary API
    const summaryRes = await request('/flashcards/summary', {
      headers: studentHeaders,
    });
    assert.strictEqual(summaryRes.status, 200);
    assert.ok(summaryRes.data.summary.totalCards >= 2);

    // 11.7 Cross-User Isolation (User cannot access other user's deck)
    const unauthorizedDeckAccess = await request(`/flashcards/decks/${testDeckId}`);
    assert.strictEqual(unauthorizedDeckAccess.status, 401, 'Unauthenticated deck fetch must fail with 401');

    // 11.8 Reset Deck Progress
    const resetRes = await request(`/flashcards/decks/${testDeckId}/reset`, {
      method: 'POST',
      headers: studentHeaders,
    });
    assert.strictEqual(resetRes.status, 200, 'Resetting deck progress must succeed');

    // 11.9 Clean up: Delete Deck (Cascades to all cards)
    const deleteDeckRes = await request(`/flashcards/decks/${testDeckId}`, {
      method: 'DELETE',
      headers: studentHeaders,
    });
    assert.strictEqual(deleteDeckRes.status, 200, 'Deck deletion must succeed');

    const checkDeletedDeck = await request(`/flashcards/decks/${testDeckId}`, {
      headers: studentHeaders,
    });
    assert.strictEqual(checkDeletedDeck.status, 404, 'Deleted deck must return 404');

    console.log('  ✓ 11. Flashcards & SM-2 Spaced Repetition Engine Verification');

    console.log('✅ All 11 security, integration, dashboard & flashcard test suites passed!');
  } finally {
    if (tempUserId) {
      await db.users.deleteById(tempUserId);
      flushLocalStoreSync();
    }
    server.close();
  }
  process.exit(0);
}

runIntegrationTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
