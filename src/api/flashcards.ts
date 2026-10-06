import { apiClient } from './client';

export interface FlashcardDeck {
  _id: string;
  user: string;
  title: string;
  description?: string;
  subject: string;
  topic?: string;
  sourceType: 'manual' | 'ai' | 'note' | 'document' | 'topic';
  sourceId?: string;
  cardCount: number;
  masteredCount: number;
  dueCount: number;
  learningCount?: number;
  masteryPercentage?: number;
  accuracy?: number;
  totalReviews?: number;
  lastStudiedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Flashcard {
  _id: string;
  deck: string;
  user: string;
  front: string;
  back: string;
  hint?: string;
  explanation?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'new' | 'learning' | 'review' | 'mastered';
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
  easeFactor: number;
  interval: number;
  dueAt: string;
  lastReviewedAt?: string;
  sourcePage?: number;
  createdAt: string;
  deckTitle?: string;
  subject?: string;
  topic?: string;
}

export const flashcardsApi = {
  getDecks: async (params?: {
    q?: string;
    subject?: string;
    topic?: string;
    sourceType?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await apiClient.get('/flashcards/decks', { params });
    return data;
  },

  createDeck: async (payload: {
    title: string;
    description?: string;
    subject: string;
    topic?: string;
    sourceType?: string;
    sourceId?: string;
    initialCards?: Array<{
      front: string;
      back: string;
      hint?: string;
      explanation?: string;
      difficulty?: string;
    }>;
  }) => {
    const { data } = await apiClient.post('/flashcards/decks', payload);
    return data;
  },

  getDeckById: async (id: string) => {
    const { data } = await apiClient.get(`/flashcards/decks/${id}`);
    return data;
  },

  updateDeck: async (id: string, payload: {
    title?: string;
    description?: string;
    subject?: string;
    topic?: string;
  }) => {
    const { data } = await apiClient.put(`/flashcards/decks/${id}`, payload);
    return data;
  },

  deleteDeck: async (id: string) => {
    const { data } = await apiClient.delete(`/flashcards/decks/${id}`);
    return data;
  },

  addCard: async (deckId: string, payload: {
    front: string;
    back: string;
    hint?: string;
    explanation?: string;
    difficulty?: string;
    sourcePage?: number;
  }) => {
    const { data } = await apiClient.post(`/flashcards/decks/${deckId}/cards`, payload);
    return data;
  },

  getDeckCards: async (deckId: string, params?: { dueOnly?: boolean | string; status?: string }) => {
    const { data } = await apiClient.get(`/flashcards/decks/${deckId}/cards`, { params });
    return data;
  },

  updateCard: async (cardId: string, payload: {
    front?: string;
    back?: string;
    hint?: string;
    explanation?: string;
    difficulty?: string;
  }) => {
    const { data } = await apiClient.put(`/flashcards/cards/${cardId}`, payload);
    return data;
  },

  deleteCard: async (cardId: string) => {
    const { data } = await apiClient.delete(`/flashcards/cards/${cardId}`);
    return data;
  },

  reviewCard: async (deckId: string, payload: {
    cardId: string;
    rating: 'again' | 'hard' | 'good' | 'easy';
  }) => {
    const { data } = await apiClient.post(`/flashcards/decks/${deckId}/review`, payload);
    return data;
  },

  resetDeck: async (deckId: string) => {
    const { data } = await apiClient.post(`/flashcards/decks/${deckId}/reset`);
    return data;
  },

  generateFlashcards: async (payload: {
    subject: string;
    topic?: string;
    difficulty?: string;
    count?: number;
    noteId?: string;
    documentId?: string;
    saveDeck?: boolean;
    deckTitle?: string;
  }) => {
    const { data } = await apiClient.post('/flashcards/generate', payload);
    return data;
  },

  getReviewToday: async () => {
    const { data } = await apiClient.get('/flashcards/review/today');
    return data;
  },

  getSummary: async () => {
    const { data } = await apiClient.get('/flashcards/summary');
    return data;
  },
};
