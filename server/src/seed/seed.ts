import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { connectDB, db, flushLocalStoreSync } from '../config/db.ts';
import { INITIAL_SUBJECTS, INITIAL_TOPICS, SAMPLE_DBMS_DOCUMENT_TEXT } from './seedData.ts';
import { computeDeterministicEmbedding, chunkDocumentText } from '../utils/vectorMath.ts';
import { generateUserRecommendations } from '../services/analyticsService.ts';

export async function ensureSeeded(): Promise<void> {
  const existingSubjects = await db.subjects.count();
  if (existingSubjects === 0) {
    console.log('🌱 Seeding initial subjects and topics...');
    for (const subj of INITIAL_SUBJECTS) {
      await db.subjects.create(subj);
    }
    for (const topic of INITIAL_TOPICS) {
      await db.topics.create(topic);
    }
  }

  // Ensure Demo Student & Demo Admin exist
  const adminExists = await db.users.findOne({ email: 'admin@lumina.edu' });
  if (!adminExists) {
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    await db.users.create({
      _id: 'user-admin-1',
      name: 'Dr. Elena Rostova',
      email: 'admin@lumina.edu',
      password: adminPassword,
      role: 'admin',
      isActive: true,
      educationLevel: 'Ph.D. Computer Science',
      college: 'Lumina Institute of Technology',
      subjects: ['DBMS', 'Artificial Intelligence', 'Operating Systems'],
      learningGoals: ['Platform Curriculum Excellence', 'Student Mastery Analytics'],
      preferredStudyHours: 4,
      streakDays: 14,
      lastStudyDate: new Date().toISOString().split('T')[0],
    });
  }

  const studentExists = await db.users.findOne({ email: 'student@lumina.edu' });
  if (!studentExists) {
    const studentPassword = await bcrypt.hash('Student@123', 10);
    const demoStudent = await db.users.create({
      _id: 'user-student-1',
      name: 'Aarav Sharma (Demo Student)',
      email: 'student@lumina.edu',
      password: studentPassword,
      role: 'student',
      isActive: true,
      educationLevel: 'B.Tech Computer Science — 3rd Year',
      college: 'National Institute of Technology',
      subjects: ['DBMS', 'Data Structures & Algorithms', 'Operating Systems', 'Java', 'Artificial Intelligence'],
      learningGoals: [
        'Master DBMS Normalization & Indexing before Midterms',
        'Solve 50 Graph & Dynamic Programming problems',
        'Build a production RAG pipeline',
      ],
      preferredStudyHours: 3,
      streakDays: 6,
      lastStudyDate: new Date().toISOString().split('T')[0],
    });

    const userId = String(demoStudent._id);

    // Create sample uploaded document for RAG testing ("Explain normalization from my DBMS PDF")
    const uploadDir = path.resolve(process.cwd(), 'server', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const sampleFilePath = path.join(uploadDir, 'DBMS_Normalization_and_Indexing_Guide.txt');
    if (!fs.existsSync(sampleFilePath)) {
      fs.writeFileSync(sampleFilePath, SAMPLE_DBMS_DOCUMENT_TEXT, 'utf-8');
    }

    const pages = [
      {
        pageNumber: 1,
        text: SAMPLE_DBMS_DOCUMENT_TEXT.split('[Page 2]')[0].replace('[Page 1]', '').trim(),
      },
      {
        pageNumber: 2,
        text: SAMPLE_DBMS_DOCUMENT_TEXT.split('[Page 2]')[1].split('[Page 3]')[0].trim(),
      },
      {
        pageNumber: 3,
        text: SAMPLE_DBMS_DOCUMENT_TEXT.split('[Page 3]')[1].trim(),
      },
    ];

    const rawChunks = chunkDocumentText(pages, 700, 100);
    const docRecord = await db.documents.create({
      _id: 'doc-dbms-1',
      user: userId,
      subject: 'DBMS',
      originalName: 'DBMS_Normalization_and_Indexing_Guide.pdf',
      fileName: 'DBMS_Normalization_and_Indexing_Guide.txt',
      filePath: sampleFilePath,
      fileType: 'application/pdf',
      fileSize: Buffer.byteLength(SAMPLE_DBMS_DOCUMENT_TEXT, 'utf-8'),
      status: 'ready',
      extractedText: SAMPLE_DBMS_DOCUMENT_TEXT,
      pageCount: 3,
      chunkCount: rawChunks.length,
      summary:
        'Comprehensive lecture reference covering Insertion/Update/Deletion anomalies, Functional Dependencies, 1NF, 2NF, 3NF, BCNF, Lossless-Join Decomposition, and B+ Tree Indexing.',
    });

    for (const chunk of rawChunks) {
      await db.documentChunks.create({
        document: String(docRecord._id),
        user: userId,
        content: chunk.content,
        pageNumber: chunk.pageNumber,
        chunkIndex: chunk.chunkIndex,
        embedding: computeDeterministicEmbedding(chunk.content),
        metadata: {
          documentName: docRecord.originalName,
          pageNumber: chunk.pageNumber,
        },
      });
    }

    // Seed Demo Note
    await db.notes.create({
      _id: 'note-demo-1',
      user: userId,
      subject: 'DBMS',
      topic: 'Database Normalization (1NF, 2NF, 3NF, BCNF)',
      title: 'Complete Guide to Database Normalization (1NF to BCNF)',
      difficulty: 'Intermediate',
      length: 'Standard',
      structuredSections: {
        overview:
          'Database normalization refines relational schemas using functional dependencies to eliminate redundancy and prevent insertion, update, and deletion anomalies.',
        definitions: [
          'Functional Dependency (X -> Y): Value of X uniquely determines value of Y.',
          '2NF: 1NF + No partial dependency of non-prime attributes on any candidate key.',
          '3NF: 2NF + No transitive dependency of non-prime attributes on any candidate key.',
          'BCNF: For every non-trivial FD X -> Y, X must be a superkey.',
        ],
        keyConcepts: [
          'Armstrong Axioms & Attribute Closure (X+)',
          'Lossless-Join vs Dependency-Preserving Decomposition',
          'Trade-off between BCNF strictness and join overhead',
        ],
        detailedExplanation:
          'When designing a relational schema, storing unrelated attributes in a single universal table causes severe duplication. Normalization decomposes tables step-by-step using candidate keys and determinants.',
        examples: [
          '2NF Violation: In Enrollment(StudentID, CourseID, CourseInstructor), CourseInstructor depends only on CourseID (partial key).',
          '3NF Violation: In Employee(EmpID, DeptID, DeptLocation), DeptLocation depends on DeptID transitively.',
        ],
        advantages: ['Eliminates update anomalies', 'Reduces storage footprint', 'Enforces data integrity'],
        disadvantages: ['Requires additional SQL JOIN operations for complex reads'],
        commonMistakes: [
          'Stopping at 3NF without checking if overlapping candidate keys violate BCNF',
          'Performing a lossy decomposition that produces spurious tuples on NATURAL JOIN',
        ],
        importantPoints: [
          'Every binary (2-attribute) relation is automatically in BCNF.',
          'Always compute attribute closure X+ to verify candidate keys.',
        ],
        quickRevision: [
          '1NF = Atomic values',
          '2NF = Full dependency on whole key',
          '3NF = Whole key and nothing but the key',
          'BCNF = Every determinant is a superkey',
        ],
        examQuestions: [
          'Given R(A,B,C,D) with FDs {AB -> C, C -> D, D -> A}, find all candidate keys and determine the highest normal form.',
          'Prove why BCNF guarantees lossless decomposition when splitting along a violating functional dependency X -> Y.',
        ],
      },
      content: `# Database Normalization (1NF, 2NF, 3NF, BCNF) — DBMS\n\n## 1. Overview\nDatabase normalization refines relational schemas using functional dependencies to eliminate redundancy and prevent insertion, update, and deletion anomalies.\n\n## 2. Key Rules\n- **1NF:** Atomic attribute values only.\n- **2NF:** No partial dependencies on composite candidate keys.\n- **3NF:** For every X -> A, X is a superkey or A is a prime attribute.\n- **BCNF:** For every non-trivial X -> Y, X must be a superkey.`,
    });

    // Seed Demo Quiz & Quiz Attempts (including a weak topic in Operating Systems so Weak Topic Detection demonstrates real data!)
    const demoQuiz = await db.quizzes.create({
      _id: 'quiz-demo-1',
      user: userId,
      subject: 'Operating Systems',
      topic: 'Virtual Memory, Paging & Page Replacement',
      title: 'Virtual Memory & Page Replacement Diagnostic Quiz',
      difficulty: 'Advanced',
      questionType: 'MCQ',
      timeLimitMinutes: 10,
      questions: [
        {
          id: 'q-os-1',
          type: 'MCQ',
          question: 'Which page replacement algorithm can suffer from Belady’s Anomaly (more frames causing more page faults)?',
          options: ['FIFO (First-In, First-Out)', 'LRU (Least Recently Used)', 'Optimal Page Replacement', 'LFU Stack Algorithm'],
          correctAnswer: 'FIFO (First-In, First-Out)',
          explanation: 'FIFO is not a stack algorithm and can exhibit Belady’s Anomaly for certain reference strings as frame count increases.',
        },
        {
          id: 'q-os-2',
          type: 'MCQ',
          question: 'What is the primary purpose of the Translation Lookaside Buffer (TLB) in virtual memory hardware?',
          options: [
            'Caching recent virtual-to-physical page frame translations to avoid multi-level page table memory reads',
            'Storing swapped-out disk sectors on NVMe drives',
            'Encrypting kernel system call parameters',
            'Scheduling CPU thread priorities',
          ],
          correctAnswer:
            'Caching recent virtual-to-physical page frame translations to avoid multi-level page table memory reads',
          explanation: 'The TLB is an associative hardware cache inside the MMU that accelerates virtual address translation.',
        },
        {
          id: 'q-os-3',
          type: 'True/False',
          question: 'True or False: Thrashing occurs when a process spends more time paging frames in and out of disk than executing CPU instructions.',
          options: ['True', 'False'],
          correctAnswer: 'True',
          explanation: 'When the sum of working sets exceeds physical frames, constant page faults cause thrashing.',
        },
      ],
    });

    const dbmsQuiz = await db.quizzes.create({
      _id: 'quiz-demo-2',
      user: userId,
      subject: 'DBMS',
      topic: 'Database Normalization (1NF, 2NF, 3NF, BCNF)',
      title: 'DBMS Normalization & Functional Dependencies Quiz',
      difficulty: 'Intermediate',
      questionType: 'MCQ',
      timeLimitMinutes: 10,
      questions: [
        {
          id: 'q-dbms-1',
          type: 'MCQ',
          question: 'Which normal form strictly requires that for EVERY non-trivial functional dependency X -> Y, X must be a superkey?',
          options: ['Boyce-Codd Normal Form (BCNF)', 'Second Normal Form (2NF)', 'First Normal Form (1NF)', 'Third Normal Form (3NF)'],
          correctAnswer: 'Boyce-Codd Normal Form (BCNF)',
          explanation: 'BCNF tightens 3NF by disallowing even prime attributes on the right-hand side unless the determinant X is a superkey.',
        },
        {
          id: 'q-dbms-2',
          type: 'MCQ',
          question: 'In a B+ Tree index, where are all record pointers (or data records) and sequential sibling links stored?',
          options: ['Only in the Leaf Nodes', 'Only in the Root Node', 'Uniformly across internal routing nodes', 'In the transaction redo log'],
          correctAnswer: 'Only in the Leaf Nodes',
          explanation: 'B+ Trees store all data pointers in leaf nodes linked sequentially for fast range scans.',
        },
      ],
    });

    // Record 2 attempts: 1 strong in DBMS (100%), 1 weak in OS Virtual Memory (33%)
    await db.quizAttempts.create({
      _id: 'attempt-demo-1',
      user: userId,
      quiz: String(demoQuiz._id),
      subject: 'Operating Systems',
      topic: 'Virtual Memory, Paging & Page Replacement',
      answers: [
        {
          questionId: 'q-os-1',
          userAnswer: 'LRU (Least Recently Used)',
          isCorrect: false,
          correctAnswer: 'FIFO (First-In, First-Out)',
          explanation: 'FIFO is not a stack algorithm and can exhibit Belady’s Anomaly.',
        },
        {
          questionId: 'q-os-2',
          userAnswer: 'Storing swapped-out disk sectors on NVMe drives',
          isCorrect: false,
          correctAnswer:
            'Caching recent virtual-to-physical page frame translations to avoid multi-level page table memory reads',
          explanation: 'The TLB caches virtual-to-physical page table translations.',
        },
        {
          questionId: 'q-os-3',
          userAnswer: 'True',
          isCorrect: true,
          correctAnswer: 'True',
          explanation: 'Thrashing happens when paging overhead dominates CPU execution.',
        },
      ],
      score: 1,
      totalQuestions: 3,
      percentage: 33,
      timeSpentSeconds: 210,
      performanceAnalysis:
        'Needs review on TLBEffective Access Time calculations and Belady’s Anomaly in FIFO vs stack-based LRU replacement.',
      completedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    });

    await db.quizAttempts.create({
      _id: 'attempt-demo-2',
      user: userId,
      quiz: String(dbmsQuiz._id),
      subject: 'DBMS',
      topic: 'Database Normalization (1NF, 2NF, 3NF, BCNF)',
      answers: [
        {
          questionId: 'q-dbms-1',
          userAnswer: 'Boyce-Codd Normal Form (BCNF)',
          isCorrect: true,
          correctAnswer: 'Boyce-Codd Normal Form (BCNF)',
          explanation: 'BCNF requires every determinant to be a superkey.',
        },
        {
          questionId: 'q-dbms-2',
          userAnswer: 'Only in the Leaf Nodes',
          isCorrect: true,
          correctAnswer: 'Only in the Leaf Nodes',
          explanation: 'Leaf nodes hold all data pointers and sequential sibling links.',
        },
      ],
      score: 2,
      totalQuestions: 2,
      percentage: 100,
      timeSpentSeconds: 125,
      performanceAnalysis: 'Excellent command of BCNF invariants and B+ Tree leaf indexing.',
      completedAt: new Date(Date.now() - 86400000).toISOString(),
    });

    // Seed Demo Progress records (explicitly tied to Demo Student)
    await db.progress.insertMany([
      {
        user: userId,
        subject: 'DBMS',
        topic: 'Database Normalization (1NF, 2NF, 3NF, BCNF)',
        completionPercentage: 88,
        studyTime: 115,
        tasksCompleted: 4,
        tasksTotal: 5,
        quizAttempts: 1,
        averageScore: 100,
        incorrectCount: 0,
        lastStudiedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        user: userId,
        subject: 'Operating Systems',
        topic: 'Virtual Memory, Paging & Page Replacement',
        completionPercentage: 30,
        studyTime: 40,
        tasksCompleted: 1,
        tasksTotal: 4,
        quizAttempts: 1,
        averageScore: 33,
        incorrectCount: 2,
        lastStudiedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      },
      {
        user: userId,
        subject: 'Data Structures & Algorithms',
        topic: 'Dynamic Programming: Memoization & Tabulation',
        completionPercentage: 35,
        studyTime: 55,
        tasksCompleted: 1,
        tasksTotal: 4,
        quizAttempts: 0,
        averageScore: 52,
        incorrectCount: 2,
        lastStudiedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
      {
        user: userId,
        subject: 'Java',
        topic: 'Java Collections Framework & HashMap Internals',
        completionPercentage: 75,
        studyTime: 90,
        tasksCompleted: 3,
        tasksTotal: 4,
        quizAttempts: 1,
        averageScore: 85,
        incorrectCount: 0,
        lastStudiedAt: new Date().toISOString(),
      },
    ]);

    // Seed Study Sessions across the past 7 days for Demo Student chart visualization
    const sessionTopics = [
      { subject: 'DBMS', topic: 'Database Normalization (1NF, 2NF, 3NF, BCNF)', duration: 55, daysAgo: 6, type: 'reading' },
      { subject: 'Java', topic: 'JVM Architecture & Memory Model', duration: 45, daysAgo: 5, type: 'ai-tutor' },
      { subject: 'Data Structures & Algorithms', topic: 'Trees, Binary Search Trees & AVL Rotations', duration: 65, daysAgo: 4, type: 'practice' },
      { subject: 'Operating Systems', topic: 'Virtual Memory, Paging & Page Replacement', duration: 40, daysAgo: 3, type: 'quiz' },
      { subject: 'DBMS', topic: 'B+ Tree Indexing & Query Execution Plans', duration: 60, daysAgo: 2, type: 'document-review' },
      { subject: 'Data Structures & Algorithms', topic: 'Dynamic Programming: Memoization & Tabulation', duration: 50, daysAgo: 1, type: 'ai-tutor' },
      { subject: 'Java', topic: 'Java Collections Framework & HashMap Internals', duration: 45, daysAgo: 0, type: 'notes' },
    ];

    for (const s of sessionTopics) {
      const end = new Date(Date.now() - s.daysAgo * 86400000);
      const start = new Date(end.getTime() - s.duration * 60000);
      await db.studySessions.create({
        user: userId,
        subject: s.subject,
        topic: s.topic,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        duration: s.duration,
        activityType: s.type,
        notes: `Demo study session on ${s.topic}`,
        createdAt: end.toISOString(),
      });
    }

    // Seed Study Plan & Tasks
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const twoDaysStr = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

    const plan = await db.studyPlans.create({
      _id: 'plan-demo-1',
      user: userId,
      title: 'CS Core Midterm Mastery Plan (DBMS, OS & DSA)',
      description:
        'Personalized 14-day adaptive schedule allocating 3 hours/day across DBMS, Operating Systems, and DSA with extra reinforcement on Virtual Memory & Dynamic Programming.',
      startDate: todayStr,
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      examDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      dailyHours: 3,
      knowledgeLevel: 'Intermediate',
      targetScore: 90,
      subjects: ['DBMS', 'Operating Systems', 'Data Structures & Algorithms'],
      weakSubjects: ['Operating Systems', 'Data Structures & Algorithms'],
      preferredStudyTime: 'Morning',
      goals: ['Raise OS Virtual Memory quiz score above 85%', 'Complete BCNF & B+ Tree practice sets'],
      weeklySummary: [
        { week: 1, focus: 'Weak Topic Remediation: OS Paging, TLB & DSA Dynamic Programming', hoursAllocated: 21 },
        { week: 2, focus: 'DBMS Concurrency, Full-Length Timed Quizzes & Revision', hoursAllocated: 21 },
      ],
      status: 'active',
    });

    await db.studyTasks.insertMany([
      {
        user: userId,
        studyPlan: String(plan._id),
        subject: 'Operating Systems',
        topic: 'Virtual Memory, Paging & Page Replacement',
        title: 'Master TLB Effective Access Time & LRU vs FIFO Replacement',
        description: 'Work through 3 numerical EAT examples and trace FIFO Belady Anomaly with the AI Tutor.',
        taskType: 'study',
        scheduledDate: todayStr,
        estimatedDuration: 60,
        priority: 'high',
        status: 'pending',
      },
      {
        user: userId,
        studyPlan: String(plan._id),
        subject: 'DBMS',
        topic: 'Database Normalization (1NF, 2NF, 3NF, BCNF)',
        title: 'Verify Lossless-Join Decomposition in Uploaded DBMS PDF',
        description: 'Use Document Q&A to review Page 2 & Page 3 of DBMS_Normalization_and_Indexing_Guide.pdf.',
        taskType: 'revision',
        scheduledDate: todayStr,
        estimatedDuration: 45,
        priority: 'medium',
        status: 'completed',
        completedAt: new Date().toISOString(),
      },
      {
        user: userId,
        studyPlan: String(plan._id),
        subject: 'Data Structures & Algorithms',
        topic: 'Dynamic Programming: Memoization & Tabulation',
        title: '0/1 Knapsack & Longest Common Subsequence Tabulation Drill',
        description: 'Derive recurrence relations and space-optimized 1D array transitions.',
        taskType: 'practice',
        scheduledDate: tomorrowStr,
        estimatedDuration: 75,
        priority: 'high',
        status: 'pending',
      },
      {
        user: userId,
        studyPlan: String(plan._id),
        subject: 'Operating Systems',
        topic: 'Process Synchronization, Semaphores & Deadlocks',
        title: 'Banker’s Algorithm Safe Sequence Verification Quiz',
        description: 'Take a 5-question timed quiz on deadlock avoidance and semaphore invariants.',
        taskType: 'quiz',
        scheduledDate: twoDaysStr,
        estimatedDuration: 45,
        priority: 'medium',
        status: 'pending',
      },
    ]);

    // Seed Learning Goals
    await db.goals.insertMany([
      {
        user: userId,
        title: 'Complete 15 Hours of Focused CS Core Study',
        description: 'Weekly deep-work target across DBMS, OS, and DSA.',
        targetDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        targetType: 'hours',
        targetValue: 15,
        currentValue: 6,
        status: 'active',
      },
      {
        user: userId,
        title: 'Achieve 85%+ Average Across 5 Diagnostic Quizzes',
        description: 'Track conceptual mastery through AI-generated assessments.',
        targetDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        targetType: 'quizzes',
        targetValue: 5,
        currentValue: 2,
        status: 'active',
      },
    ]);

    // Seed AI Conversation
    const conv = await db.conversations.create({
      _id: 'conv-demo-1',
      user: userId,
      title: 'BCNF vs 3NF & Dependency Preservation',
      mode: 'Exam Preparation',
      subject: 'DBMS',
      topic: 'Database Normalization (1NF, 2NF, 3NF, BCNF)',
    });

    await db.messages.insertMany([
      {
        conversation: String(conv._id),
        role: 'user',
        content: 'Can you explain the exact difference between 3NF and BCNF for my upcoming DBMS exam, and why we sometimes stop at 3NF?',
      },
      {
        conversation: String(conv._id),
        role: 'assistant',
        content: `### 3NF vs. BCNF (Exam Preparation Guide)

Both **Third Normal Form (3NF)** and **Boyce-Codd Normal Form (BCNF)** eliminate redundancy caused by functional dependencies, but **BCNF is strictly stronger**.

#### 1. Formal Definitions
Let $R$ be a relation and $X \\to A$ be any non-trivial functional dependency (where $A \\notin X$):
- **BCNF Rule:** $X$ **must** be a superkey of $R$. No exceptions.
- **3NF Rule:** Either:
  1. $X$ is a superkey of $R$, **OR**
  2. $A$ is a **prime attribute** (meaning $A$ belongs to *some* candidate key of $R$).

#### 2. Why Do We Sometimes Stop at 3NF?
- **3NF Theorem:** Every relation can *always* be decomposed into **3NF** such that the decomposition is both **Lossless-Join** AND **Dependency-Preserving**.
- **BCNF Trade-off:** While BCNF is always achievable with a **Lossless-Join** decomposition, it is **not always Dependency-Preserving**. Enforcing a lost functional dependency in BCNF requires an expensive cross-table \`JOIN\` on every write.

---
**Quick Practice Check:**
Suppose $R(Student, Course, Instructor)$ has FDs:
1. $\{Student, Course\} \\to Instructor$
2. $Instructor \\to Course$

What are the candidate keys of $R$, and does $Instructor \\to Course$ violate 3NF or BCNF?`,
      },
    ]);

    // Seed Learning Activities
    await db.activities.insertMany([
      {
        user: userId,
        activityType: 'document_uploaded',
        title: 'Uploaded DBMS_Normalization_and_Indexing_Guide.pdf (3 pages, 6 RAG chunks)',
        subject: 'DBMS',
        topic: 'Database Normalization (1NF, 2NF, 3NF, BCNF)',
        referenceId: String(docRecord._id),
      },
      {
        user: userId,
        activityType: 'note_generated',
        title: 'Generated AI Notes: Complete Guide to Database Normalization (1NF to BCNF)',
        subject: 'DBMS',
        topic: 'Database Normalization (1NF, 2NF, 3NF, BCNF)',
        referenceId: '',
      },
      {
        user: userId,
        activityType: 'quiz_completed',
        title: 'Completed Quiz: Virtual Memory & Page Replacement (Score: 33%)',
        subject: 'Operating Systems',
        topic: 'Virtual Memory, Paging & Page Replacement',
        referenceId: String(demoQuiz._id),
      },
      {
        user: userId,
        activityType: 'quiz_completed',
        title: 'Completed Quiz: DBMS Normalization & Functional Dependencies (Score: 100%)',
        subject: 'DBMS',
        topic: 'Database Normalization (1NF, 2NF, 3NF, BCNF)',
        referenceId: String(dbmsQuiz._id),
      },
      {
        user: userId,
        activityType: 'tutor_session',
        title: 'AI Tutor Session: BCNF vs 3NF & Dependency Preservation',
        subject: 'DBMS',
        topic: 'Database Normalization (1NF, 2NF, 3NF, BCNF)',
        referenceId: String(conv._id),
      },
    ]);

    await generateUserRecommendations(userId);
    flushLocalStoreSync();
    console.log('✅ Seeded subjects, 32 topics, demo accounts, and RAG sample document.');
  }
}

// Allow running directly via `npm run seed`
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  connectDB()
    .then(() => ensureSeeded())
    .then(() => {
      flushLocalStoreSync();
      console.log('🌱 Database seed complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
