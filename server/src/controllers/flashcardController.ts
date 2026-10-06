import { Response } from 'express';
import { db } from '../config/db.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { AppError, asyncHandler } from '../middleware/error.ts';
import { generateFlashcardsWithAI, GeneratedFlashcardItem } from '../services/aiService.ts';

// 1. GET ALL DECKS (with search, filter, sort, pagination)
export const getDecks = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!._id;
  const { q, subject, topic, sourceType, sortBy = 'newest', page = 1, limit = 20 } = req.query;

  const filter: Record<string, any> = { user: userId };
  if (subject && String(subject) !== 'All') {
    filter.subject = String(subject);
  }
  if (topic && String(topic) !== 'All') {
    filter.topic = String(topic);
  }
  if (sourceType && String(sourceType) !== 'All') {
    filter.sourceType = String(sourceType);
  }

  let decks = await db.flashcardDecks.find(filter);

  // Text search on title/description/topic
  if (q && String(q).trim()) {
    const term = String(q).trim().toLowerCase();
    decks = decks.filter(
      (d) =>
        d.title.toLowerCase().includes(term) ||
        (d.description && d.description.toLowerCase().includes(term)) ||
        (d.topic && d.topic.toLowerCase().includes(term)) ||
        d.subject.toLowerCase().includes(term)
    );
  }

  // Get user cards to compute live metrics per deck
  const allUserCards = await db.flashcards.find({ user: userId });
  const now = Date.now();

  const enrichedDecks = decks.map((deck) => {
    const deckCards = allUserCards.filter((c) => String(c.deck) === String(deck._id));
    const dueCount = deckCards.filter((c) => new Date(c.dueAt).getTime() <= now).length;
    const masteredCount = deckCards.filter((c) => c.status === 'mastered').length;
    return {
      ...deck,
      cardCount: deckCards.length,
      dueCount,
      masteredCount,
      masteryPercentage: deckCards.length > 0 ? Math.round((masteredCount / deckCards.length) * 100) : 0,
    };
  });

  // Sort
  if (sortBy === 'recentlyStudied') {
    enrichedDecks.sort((a, b) => new Date(b.lastStudiedAt || 0).getTime() - new Date(a.lastStudiedAt || 0).getTime());
  } else if (sortBy === 'due') {
    enrichedDecks.sort((a, b) => b.dueCount - a.dueCount);
  } else if (sortBy === 'cards') {
    enrichedDecks.sort((a, b) => b.cardCount - a.cardCount);
  } else if (sortBy === 'title') {
    enrichedDecks.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    // default: newest
    enrichedDecks.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  const startIndex = (p - 1) * l;
  const paginated = enrichedDecks.slice(startIndex, startIndex + l);

  res.json({
    success: true,
    decks: paginated,
    totalCount: enrichedDecks.length,
    page: p,
    limit: l,
  });
});

// 2. CREATE DECK MANUALLY
export const createDeck = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!._id;
  const { title, description, subject, topic, sourceType = 'manual', sourceId = '', initialCards = [] } = req.body;

  if (!title || String(title).trim().length < 2) {
    throw new AppError('Please provide a deck title (at least 2 characters).', 400);
  }
  if (!subject || !String(subject).trim()) {
    throw new AppError('Please specify a subject for this flashcard deck.', 400);
  }

  const deck = await db.flashcardDecks.create({
    user: userId,
    title: String(title).trim(),
    description: description ? String(description).trim() : '',
    subject: String(subject).trim(),
    topic: topic ? String(topic).trim() : '',
    sourceType,
    sourceId: String(sourceId || ''),
    cardCount: 0,
    masteredCount: 0,
    dueCount: 0,
    lastStudiedAt: '',
  });

  // If initial cards were provided
  let addedCards = [];
  if (Array.isArray(initialCards) && initialCards.length > 0) {
    const cardDocs = initialCards
      .filter((c: any) => c && c.front && c.back)
      .map((c: any) => ({
        deck: String(deck._id),
        user: userId,
        front: String(c.front).trim(),
        back: String(c.back).trim(),
        hint: c.hint ? String(c.hint).trim() : '',
        explanation: c.explanation ? String(c.explanation).trim() : '',
        difficulty: ['Easy', 'Medium', 'Hard'].includes(c.difficulty) ? c.difficulty : 'Medium',
        status: 'new',
        reviewCount: 0,
        correctCount: 0,
        incorrectCount: 0,
        easeFactor: 2.5,
        interval: 0,
        dueAt: new Date().toISOString(),
      }));
    if (cardDocs.length > 0) {
      addedCards = await db.flashcards.insertMany(cardDocs);
      await db.flashcardDecks.updateById(String(deck._id), {
        cardCount: addedCards.length,
        dueCount: addedCards.length,
      });
    }
  }

  await db.activities.create({
    user: userId,
    activityType: 'flashcard_deck_created',
    title: `Created Flashcard Deck: ${deck.title}`,
    subject: deck.subject,
    topic: deck.topic,
    referenceId: String(deck._id),
  });

  res.status(201).json({
    success: true,
    deck: {
      ...deck,
      cardCount: addedCards.length,
      dueCount: addedCards.length,
      masteredCount: 0,
    },
    cards: addedCards,
  });
});

// 3. GET DECK BY ID (with full cards and live stats)
export const getDeckById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!._id;
  const { id } = req.params;

  const deck = await db.flashcardDecks.findById(id);
  if (!deck || String(deck.user) !== userId) {
    throw new AppError('Flashcard deck not found.', 404);
  }

  const cards = await db.flashcards.find({ deck: id, user: userId }, { sort: { createdAt: 1 } });
  const now = Date.now();

  const dueCards = cards.filter((c) => new Date(c.dueAt).getTime() <= now);
  const masteredCards = cards.filter((c) => c.status === 'mastered');
  const learningCards = cards.filter((c) => c.status === 'learning' || c.status === 'new');

  const totalReviews = cards.reduce((acc, c) => acc + (c.reviewCount || 0), 0);
  const totalCorrect = cards.reduce((acc, c) => acc + (c.correctCount || 0), 0);
  const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;

  res.json({
    success: true,
    deck: {
      ...deck,
      cardCount: cards.length,
      dueCount: dueCards.length,
      masteredCount: masteredCards.length,
      learningCount: learningCards.length,
      masteryPercentage: cards.length > 0 ? Math.round((masteredCards.length / cards.length) * 100) : 0,
      accuracy,
      totalReviews,
    },
    cards,
  });
});

// 4. UPDATE DECK
export const updateDeck = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!._id;
  const { id } = req.params;
  const { title, description, subject, topic } = req.body;

  const existing = await db.flashcardDecks.findById(id);
  if (!existing || String(existing.user) !== userId) {
    throw new AppError('Flashcard deck not found.', 404);
  }

  const updates: Record<string, any> = {};
  if (title !== undefined) {
    if (String(title).trim().length < 2) {
      throw new AppError('Title must be at least 2 characters long.', 400);
    }
    updates.title = String(title).trim();
  }
  if (description !== undefined) updates.description = String(description).trim();
  if (subject !== undefined) updates.subject = String(subject).trim();
  if (topic !== undefined) updates.topic = String(topic).trim();

  const updated = await db.flashcardDecks.updateById(id, updates);
  res.json({ success: true, deck: updated });
});

// 5. DELETE DECK (Cascades to all cards in deck)
export const deleteDeck = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!._id;
  const { id } = req.params;

  const existing = await db.flashcardDecks.findById(id);
  if (!existing || String(existing.user) !== userId) {
    throw new AppError('Flashcard deck not found.', 404);
  }

  await db.flashcardDecks.deleteById(id);
  await db.flashcards.deleteMany({ deck: id, user: userId });

  res.json({ success: true, message: 'Flashcard deck and cards deleted.' });
});

// 6. ADD CARD TO DECK
export const addCard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!._id;
  const { id } = req.params; // deckId
  const { front, back, hint = '', explanation = '', difficulty = 'Medium', sourcePage } = req.body;

  const deck = await db.flashcardDecks.findById(id);
  if (!deck || String(deck.user) !== userId) {
    throw new AppError('Flashcard deck not found.', 404);
  }

  if (!front || String(front).trim().length < 2) {
    throw new AppError('Card question/front text is required (at least 2 characters).', 400);
  }
  if (!back || String(back).trim().length < 1) {
    throw new AppError('Card answer/back text is required.', 400);
  }

  const card = await db.flashcards.create({
    deck: id,
    user: userId,
    front: String(front).trim().slice(0, 500),
    back: String(back).trim().slice(0, 1000),
    hint: hint ? String(hint).trim().slice(0, 250) : '',
    explanation: explanation ? String(explanation).trim().slice(0, 500) : '',
    difficulty: ['Easy', 'Medium', 'Hard'].includes(difficulty) ? difficulty : 'Medium',
    status: 'new',
    reviewCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    easeFactor: 2.5,
    interval: 0,
    dueAt: new Date().toISOString(),
    sourcePage: typeof sourcePage === 'number' ? sourcePage : undefined,
  });

  const allCards = await db.flashcards.find({ deck: id, user: userId });
  await db.flashcardDecks.updateById(id, { cardCount: allCards.length });

  res.status(201).json({ success: true, card });
});

// 7. GET CARDS IN DECK (supports dueOnly filter)
export const getDeckCards = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!._id;
  const { id } = req.params; // deckId
  const { dueOnly, status } = req.query;

  const deck = await db.flashcardDecks.findById(id);
  if (!deck || String(deck.user) !== userId) {
    throw new AppError('Flashcard deck not found.', 404);
  }

  const filter: Record<string, any> = { deck: id, user: userId };
  if (status) filter.status = String(status);

  let cards = await db.flashcards.find(filter, { sort: { dueAt: 1, createdAt: 1 } });

  if (dueOnly === 'true') {
    const now = Date.now();
    cards = cards.filter((c) => new Date(c.dueAt).getTime() <= now);
  }

  res.json({ success: true, cards });
});

// 8. UPDATE CARD
export const updateCard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!._id;
  const { id } = req.params; // cardId
  const { front, back, hint, explanation, difficulty } = req.body;

  const card = await db.flashcards.findById(id);
  if (!card || String(card.user) !== userId) {
    throw new AppError('Flashcard not found.', 404);
  }

  const updates: Record<string, any> = {};
  if (front !== undefined) {
    if (String(front).trim().length < 2) {
      throw new AppError('Front text must be at least 2 characters long.', 400);
    }
    updates.front = String(front).trim().slice(0, 500);
  }
  if (back !== undefined) {
    if (String(back).trim().length < 1) {
      throw new AppError('Back text cannot be empty.', 400);
    }
    updates.back = String(back).trim().slice(0, 1000);
  }
  if (hint !== undefined) updates.hint = String(hint).trim().slice(0, 250);
  if (explanation !== undefined) updates.explanation = String(explanation).trim().slice(0, 500);
  if (difficulty !== undefined && ['Easy', 'Medium', 'Hard'].includes(difficulty)) {
    updates.difficulty = difficulty;
  }

  const updated = await db.flashcards.updateById(id, updates);
  res.json({ success: true, card: updated });
});

// 9. DELETE CARD
export const deleteCard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!._id;
  const { id } = req.params; // cardId

  const card = await db.flashcards.findById(id);
  if (!card || String(card.user) !== userId) {
    throw new AppError('Flashcard not found.', 404);
  }

  await db.flashcards.deleteById(id);

  // Update deck count
  const allCards = await db.flashcards.find({ deck: card.deck, user: userId });
  await db.flashcardDecks.updateById(card.deck, { cardCount: allCards.length });

  res.json({ success: true, message: 'Flashcard deleted.' });
});

// 10. REVIEW CARD (Deterministic SM-2 Spaced Repetition Engine)
export const reviewCard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!._id;
  const { id } = req.params; // deckId
  const { cardId, rating } = req.body;

  if (!cardId) {
    throw new AppError('cardId is required.', 400);
  }
  if (!['again', 'hard', 'good', 'easy'].includes(String(rating).toLowerCase())) {
    throw new AppError('Rating must be one of: again, hard, good, easy.', 400);
  }

  const deck = await db.flashcardDecks.findById(id);
  if (!deck || String(deck.user) !== userId) {
    throw new AppError('Flashcard deck not found.', 404);
  }

  const card = await db.flashcards.findById(cardId);
  if (!card || String(card.user) !== userId || String(card.deck) !== id) {
    throw new AppError('Authorized flashcard not found in this deck.', 404);
  }

  const r = String(rating).toLowerCase();
  let easeFactor = Number(card.easeFactor) || 2.5;
  let interval = Number(card.interval) || 0;
  let reviewCount = (card.reviewCount || 0) + 1;
  let correctCount = card.correctCount || 0;
  let incorrectCount = card.incorrectCount || 0;
  let status = card.status || 'new';

  let nextDueMs = Date.now();

  if (r === 'again') {
    interval = 0;
    easeFactor = Math.max(1.3, Number((easeFactor - 0.2).toFixed(2)));
    incorrectCount += 1;
    status = 'learning';
    nextDueMs = Date.now() + 10 * 60 * 1000; // Due in 10 minutes (same study session)
  } else if (r === 'hard') {
    interval = interval === 0 ? 1 : Math.max(1, Math.round(interval * 1.2));
    easeFactor = Math.max(1.3, Number((easeFactor - 0.15).toFixed(2)));
    correctCount += 1;
    status = 'learning';
    nextDueMs = Date.now() + interval * 86400000;
  } else if (r === 'good') {
    interval = interval === 0 ? 1 : interval === 1 ? 3 : Math.round(interval * easeFactor);
    correctCount += 1;
    status = interval >= 14 ? 'mastered' : 'review';
    nextDueMs = Date.now() + interval * 86400000;
  } else if (r === 'easy') {
    interval = interval === 0 ? 2 : interval === 1 ? 5 : Math.round(interval * easeFactor * 1.3);
    easeFactor = Number((easeFactor + 0.15).toFixed(2));
    correctCount += 1;
    status = interval >= 7 ? 'mastered' : 'review';
    nextDueMs = Date.now() + interval * 86400000;
  }

  const dueAt = new Date(nextDueMs).toISOString();
  const lastReviewedAt = new Date().toISOString();

  const updatedCard = await db.flashcards.updateById(cardId, {
    easeFactor,
    interval,
    reviewCount,
    correctCount,
    incorrectCount,
    status,
    dueAt,
    lastReviewedAt,
  });

  // Re-evaluate deck aggregates
  const allCards = await db.flashcards.find({ deck: id, user: userId });
  const now = Date.now();
  const dueCount = allCards.filter((c) => new Date(c.dueAt).getTime() <= now).length;
  const masteredCount = allCards.filter((c) => c.status === 'mastered').length;

  await db.flashcardDecks.updateById(id, {
    cardCount: allCards.length,
    dueCount,
    masteredCount,
    lastStudiedAt: lastReviewedAt,
  });

  // Record student learning activity
  await db.activities.create({
    user: userId,
    activityType: 'flashcard_reviewed',
    title: `Reviewed Card in Deck: ${deck.title} (${r.toUpperCase()})`,
    subject: deck.subject,
    topic: deck.topic,
    referenceId: String(cardId),
  });

  res.json({
    success: true,
    card: updatedCard,
    stats: {
      interval,
      easeFactor,
      status,
      dueAt,
      rating: r,
    },
  });
});

// 11. RESET DECK PROGRESS
export const resetDeckProgress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!._id;
  const { id } = req.params; // deckId

  const deck = await db.flashcardDecks.findById(id);
  if (!deck || String(deck.user) !== userId) {
    throw new AppError('Flashcard deck not found.', 404);
  }

  const cards = await db.flashcards.find({ deck: id, user: userId });
  const nowISO = new Date().toISOString();

  for (const c of cards) {
    await db.flashcards.updateById(String(c._id), {
      status: 'new',
      interval: 0,
      easeFactor: 2.5,
      reviewCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      dueAt: nowISO,
      lastReviewedAt: '',
    });
  }

  await db.flashcardDecks.updateById(id, {
    masteredCount: 0,
    dueCount: cards.length,
    lastStudiedAt: '',
  });

  res.json({
    success: true,
    message: 'Deck progress has been reset. All cards are ready for a fresh study cycle.',
  });
});

// 12. GENERATE FLASHCARDS WITH AI (from Subject/Topic, Note, or Document)
export const generateFlashcards = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!._id;
  const {
    subject,
    topic = '',
    difficulty = 'Medium',
    count = 8,
    noteId,
    documentId,
    saveDeck = true,
    deckTitle,
  } = req.body;

  let targetSubject = subject ? String(subject).trim() : '';
  let targetTopic = topic ? String(topic).trim() : '';
  let sourceText = '';
  let sourceDocumentName = '';
  let sourceType: 'manual' | 'ai' | 'note' | 'document' | 'topic' = 'ai';
  let sourceId = '';

  // 1. If Note provided, verify note ownership & grab text
  if (noteId) {
    const note = await db.notes.findById(noteId);
    if (!note || String(note.user) !== userId) {
      throw new AppError('Authorized study note not found.', 404);
    }
    sourceText = note.content;
    targetSubject = note.subject;
    targetTopic = note.topic;
    sourceType = 'note';
    sourceId = noteId;
  }

  // 2. If Document provided, verify document ownership & grab chunks
  if (documentId) {
    const doc = await db.documents.findById(documentId);
    if (!doc || String(doc.user) !== userId) {
      throw new AppError('Authorized document not found.', 404);
    }
    const chunks = await db.documentChunks.find({ document: documentId, user: userId }, { limit: 12 });
    sourceText = chunks.map((c) => `[Page ${c.pageNumber}] ${c.content}`).join('\n\n');
    targetSubject = doc.subject || targetSubject || 'General';
    sourceDocumentName = doc.originalName;
    sourceType = 'document';
    sourceId = documentId;
  }

  if (!targetSubject) {
    throw new AppError('Subject is required to generate flashcards.', 400);
  }

  const generatedItems = await generateFlashcardsWithAI({
    subject: targetSubject,
    topic: targetTopic,
    count: Math.min(20, Math.max(3, Number(count) || 8)),
    difficulty,
    sourceText: sourceText || undefined,
    sourceDocumentName: sourceDocumentName || undefined,
  });

  if (!generatedItems || generatedItems.length === 0) {
    throw new AppError('Failed to generate flashcards. Please try again.', 500);
  }

  if (saveDeck) {
    const title =
      deckTitle && String(deckTitle).trim()
        ? String(deckTitle).trim()
        : `${targetTopic ? `${targetTopic}` : `${targetSubject}`} — ${difficulty} Deck`;

    const deck = await db.flashcardDecks.create({
      user: userId,
      title,
      description: `AI-generated active recall deck for ${targetSubject}${targetTopic ? ` (${targetTopic})` : ''}.${sourceDocumentName ? ` Grounded in ${sourceDocumentName}.` : ''}`,
      subject: targetSubject,
      topic: targetTopic,
      sourceType,
      sourceId,
      cardCount: generatedItems.length,
      masteredCount: 0,
      dueCount: generatedItems.length,
      lastStudiedAt: '',
    });

    const nowISO = new Date().toISOString();
    const cardDocs = generatedItems.map((item) => ({
      deck: String(deck._id),
      user: userId,
      front: item.front,
      back: item.back,
      hint: item.hint || '',
      explanation: item.explanation || '',
      difficulty: item.difficulty,
      status: 'new',
      reviewCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      easeFactor: 2.5,
      interval: 0,
      dueAt: nowISO,
      sourcePage: item.sourcePage,
    }));

    const createdCards = await db.flashcards.insertMany(cardDocs);

    await db.activities.create({
      user: userId,
      activityType: 'flashcard_deck_created',
      title: `Generated ${createdCards.length} Flashcards: ${deck.title}`,
      subject: deck.subject,
      topic: deck.topic,
      referenceId: String(deck._id),
    });

    return res.status(201).json({
      success: true,
      deck: {
        ...deck,
        cardCount: createdCards.length,
        dueCount: createdCards.length,
        masteredCount: 0,
      },
      cards: createdCards,
    });
  }

  res.json({
    success: true,
    cards: generatedItems,
  });
});

// 13. GET CARDS DUE TODAY ACROSS ALL DECKS
export const getReviewToday = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!._id;
  const now = Date.now();

  const allCards = await db.flashcards.find({ user: userId });
  const dueCards = allCards.filter((c) => new Date(c.dueAt).getTime() <= now);

  const decks = await db.flashcardDecks.find({ user: userId });
  const deckMap = new Map(decks.map((d) => [String(d._id), d]));

  const enrichedDue = dueCards.map((c) => {
    const deck = deckMap.get(String(c.deck));
    return {
      ...c,
      deckTitle: deck?.title || 'Study Deck',
      subject: deck?.subject || 'General',
      topic: deck?.topic || '',
    };
  });

  res.json({
    success: true,
    totalDue: enrichedDue.length,
    dueCards: enrichedDue,
  });
});

// 14. GET FLASHCARDS SUMMARY (Dashboard Widget Data)
export const getFlashcardSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!._id;
  const decks = await db.flashcardDecks.find({ user: userId }, { sort: { lastStudiedAt: -1, createdAt: -1 } });
  const cards = await db.flashcards.find({ user: userId });

  const now = Date.now();
  const dueTodayCount = cards.filter((c) => new Date(c.dueAt).getTime() <= now).length;
  const masteredCount = cards.filter((c) => c.status === 'mastered').length;

  // Count cards reviewed in the last 24 hours
  const past24h = now - 24 * 60 * 60 * 1000;
  const reviewedTodayCount = cards.filter((c) => c.lastReviewedAt && new Date(c.lastReviewedAt).getTime() >= past24h).length;

  res.json({
    success: true,
    summary: {
      totalDecks: decks.length,
      totalCards: cards.length,
      dueTodayCount,
      masteredCount,
      reviewedTodayCount,
      masteryPercentage: cards.length > 0 ? Math.round((masteredCount / cards.length) * 100) : 0,
      recentDeck: decks[0] || null,
    },
  });
});
