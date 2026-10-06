import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { env, isRealMongoUri } from './env.ts';
import {
  UserModel,
  SubjectModel,
  TopicModel,
  LearningGoalModel,
  StudyPlanModel,
  StudyTaskModel,
  ProgressModel,
  StudySessionModel,
  LearningActivityModel,
  AIConversationModel,
  AIMessageModel,
  NoteModel,
  QuizModel,
  QuizAttemptModel,
  DocumentModel,
  DocumentChunkModel,
  RecommendationModel,
  FlashcardDeckModel,
  FlashcardModel,
} from '../models/index.ts';

export type CollectionName =
  | 'users'
  | 'subjects'
  | 'topics'
  | 'goals'
  | 'studyPlans'
  | 'studyTasks'
  | 'progress'
  | 'studySessions'
  | 'activities'
  | 'conversations'
  | 'messages'
  | 'notes'
  | 'quizzes'
  | 'quizAttempts'
  | 'documents'
  | 'documentChunks'
  | 'recommendations'
  | 'flashcardDecks'
  | 'flashcards';

type StoreData = Record<CollectionName, any[]>;

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const DB_FILE = path.join(DATA_DIR, 'lumina_db.json');

let mongoConnected = false;
let memoryStore: StoreData = {
  users: [],
  subjects: [],
  topics: [],
  goals: [],
  studyPlans: [],
  studyTasks: [],
  progress: [],
  studySessions: [],
  activities: [],
  conversations: [],
  messages: [],
  notes: [],
  quizzes: [],
  quizAttempts: [],
  documents: [],
  documentChunks: [],
  recommendations: [],
  flashcardDecks: [],
  flashcards: [],
};

function loadLocalStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      memoryStore = { ...memoryStore, ...parsed };
    }
  } catch (err) {
    console.error('Failed to load local DB file, starting fresh:', err);
  }
}

let saveTimer: NodeJS.Timeout | null = null;
function persistLocalStore() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    flushLocalStoreSync();
  }, 50);
}

export function flushLocalStoreSync() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(memoryStore, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('Failed to sync local DB file:', err);
  }
}

let listenersRegistered = false;

export async function connectDB(): Promise<{ mode: 'mongodb' | 'local-json' }> {
  loadLocalStore();
  if (isRealMongoUri(env.MONGODB_URI)) {
    try {
      if (!listenersRegistered) {
        listenersRegistered = true;
        mongoose.connection.on('disconnected', () => {
          mongoConnected = false;
          if (env.NODE_ENV !== 'test') {
            console.warn('[DB]: MongoDB connection disconnected.');
          }
        });
        mongoose.connection.on('reconnected', () => {
          mongoConnected = true;
          if (env.NODE_ENV !== 'test') {
            console.log('[DB]: MongoDB connection re-established.');
          }
        });
        mongoose.connection.on('error', (err) => {
          console.error('[DB]: MongoDB runtime error:', err instanceof Error ? err.message : 'Connection error');
        });
      }

      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 4000,
        connectTimeoutMS: 4000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        autoIndex: env.NODE_ENV !== 'production',
      });
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
      }
      mongoConnected = true;
      console.log(`✅ [DB]: Connected to MongoDB via Mongoose (env: ${env.NODE_ENV})`);
      return { mode: 'mongodb' };
    } catch (err) {
      try {
        await mongoose.disconnect();
      } catch {}
      const safeReason = err instanceof Error ? err.message.replace(/mongodb(\+srv)?:\/\/[^\s]+/gi, '[REDACTED_URI]') : 'Unreachable';
      console.warn(`⚠️ [DB]: MongoDB unreachable (${safeReason}). Using persistent local JSON store.`);
      mongoConnected = false;
      return { mode: 'local-json' };
    }
  } else {
    if (env.NODE_ENV === 'production') {
      console.warn('⚠️ [DB]: MONGODB_URI not configured. Running in local-json persistence mode.');
    }
    return { mode: 'local-json' };
  }
}

export async function disconnectDB(): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  flushLocalStoreSync();
  if (mongoConnected || mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.close();
      mongoConnected = false;
      console.log('🛑 [DB]: MongoDB connection closed cleanly.');
    } catch (err) {
      console.error('[DB]: Error closing MongoDB connection:', err instanceof Error ? err.message : 'Unknown error');
    }
  }
}

export function isMongoConnected(): boolean {
  return mongoConnected;
}

function matchesFilter(item: any, filter: Record<string, any> = {}): boolean {
  for (const [key, cond] of Object.entries(filter)) {
    if (cond === undefined) continue;
    if (key === '$or' && Array.isArray(cond)) {
      const anyMatch = cond.some((subFilter) => matchesFilter(item, subFilter));
      if (!anyMatch) return false;
      continue;
    }
    const val = item[key];
    if (cond && typeof cond === 'object' && !(cond instanceof RegExp) && !Array.isArray(cond)) {
      if ('$regex' in cond) {
        const flags = cond.$options || 'i';
        const re = cond.$regex instanceof RegExp ? cond.$regex : new RegExp(String(cond.$regex), flags);
        if (!re.test(String(val ?? ''))) return false;
        continue;
      }
      if ('$in' in cond && Array.isArray(cond.$in)) {
        if (Array.isArray(val)) {
          if (!val.some((v) => cond.$in.includes(v))) return false;
        } else if (!cond.$in.includes(val)) {
          return false;
        }
        continue;
      }
      if ('$gte' in cond && !(val >= cond.$gte)) return false;
      if ('$lte' in cond && !(val <= cond.$lte)) return false;
      if ('$ne' in cond && val === cond.$ne) return false;
    } else if (cond instanceof RegExp) {
      if (!cond.test(String(val ?? ''))) return false;
    } else {
      if (Array.isArray(val)) {
        if (!val.includes(cond)) return false;
      } else if (String(val) !== String(cond)) {
        return false;
      }
    }
  }
  return true;
}

class CollectionAdapter<T = any> {
  private collection: CollectionName;
  private model: mongoose.Model<any>;

  constructor(collection: CollectionName, model: mongoose.Model<any>) {
    this.collection = collection;
    this.model = model;
  }

  async find(
    filter: Record<string, any> = {},
    options?: { sort?: Record<string, 1 | -1>; limit?: number; skip?: number }
  ): Promise<T[]> {
    if (mongoConnected) {
      let query = this.model.find(filter);
      if (options?.sort) query = query.sort(options.sort);
      if (options?.skip) query = query.skip(options.skip);
      if (options?.limit) query = query.limit(options.limit);
      const docs = await query.lean();
      return docs.map((d: any) => ({ ...d, _id: String(d._id) })) as T[];
    }

    let items = memoryStore[this.collection].filter((item) => matchesFilter(item, filter));
    if (options?.sort) {
      const sortEntries = Object.entries(options.sort);
      items = [...items].sort((a, b) => {
        for (const [field, dir] of sortEntries) {
          const va = a[field] ?? '';
          const vb = b[field] ?? '';
          if (va < vb) return dir === 1 ? -1 : 1;
          if (va > vb) return dir === 1 ? 1 : -1;
        }
        return 0;
      });
    }
    if (options?.skip) {
      items = items.slice(options.skip);
    }
    if (options?.limit) {
      items = items.slice(0, options.limit);
    }
    return items.map((x) => ({ ...x }));
  }

  async findOne(filter: Record<string, any>): Promise<T | null> {
    if (mongoConnected) {
      const doc = await this.model.findOne(filter).lean();
      return doc ? ({ ...doc, _id: String((doc as any)._id) } as T) : null;
    }
    const found = memoryStore[this.collection].find((item) => matchesFilter(item, filter));
    return found ? { ...found } : null;
  }

  async findById(id: string): Promise<T | null> {
    if (!id) return null;
    if (mongoConnected) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const doc = await this.model.findById(id).lean();
      return doc ? ({ ...doc, _id: String((doc as any)._id) } as T) : null;
    }
    const found = memoryStore[this.collection].find((item) => String(item._id) === String(id));
    return found ? { ...found } : null;
  }

  async create(data: Partial<T> & Record<string, any>): Promise<T> {
    if (mongoConnected) {
      const payload = { ...data };
      if (payload._id && !mongoose.Types.ObjectId.isValid(String(payload._id))) {
        delete payload._id;
      }
      const created = await this.model.create(payload);
      const obj = created.toObject();
      return { ...obj, _id: String(obj._id) } as T;
    }
    const now = new Date().toISOString();
    const newItem: any = {
      _id: data._id ? String(data._id) : crypto.randomBytes(12).toString('hex'),
      ...data,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    memoryStore[this.collection].push(newItem);
    persistLocalStore();
    return { ...newItem };
  }

  async insertMany(items: Array<Partial<T> & Record<string, any>>): Promise<T[]> {
    const results: T[] = [];
    for (const item of items) {
      results.push(await this.create(item));
    }
    return results;
  }

  async updateById(id: string, updates: Record<string, any>): Promise<T | null> {
    if (!id) return null;
    const safeUpdates = { ...updates };
    delete safeUpdates._id;
    delete safeUpdates.user;

    if (mongoConnected) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const updated = await this.model
        .findByIdAndUpdate(
          id,
          { $set: { ...safeUpdates, updatedAt: new Date().toISOString() } },
          { returnDocument: 'after' }
        )
        .lean();
      return updated ? ({ ...updated, _id: String((updated as any)._id) } as T) : null;
    }
    const idx = memoryStore[this.collection].findIndex((item) => String(item._id) === String(id));
    if (idx === -1) return null;
    const updatedItem = {
      ...memoryStore[this.collection][idx],
      ...safeUpdates,
      _id: memoryStore[this.collection][idx]._id,
      updatedAt: new Date().toISOString(),
    };
    memoryStore[this.collection][idx] = updatedItem;
    persistLocalStore();
    return { ...updatedItem };
  }

  async deleteById(id: string): Promise<boolean> {
    if (!id) return false;
    if (mongoConnected) {
      if (!mongoose.Types.ObjectId.isValid(id)) return false;
      const res = await this.model.findByIdAndDelete(id);
      return Boolean(res);
    }
    const prevLen = memoryStore[this.collection].length;
    memoryStore[this.collection] = memoryStore[this.collection].filter((item) => String(item._id) !== String(id));
    const deleted = memoryStore[this.collection].length < prevLen;
    if (deleted) persistLocalStore();
    return deleted;
  }

  async deleteMany(filter: Record<string, any> = {}): Promise<number> {
    if (mongoConnected) {
      const res = await this.model.deleteMany(filter);
      return res.deletedCount || 0;
    }
    const before = memoryStore[this.collection].length;
    if (Object.keys(filter).length === 0) {
      memoryStore[this.collection] = [];
    } else {
      memoryStore[this.collection] = memoryStore[this.collection].filter((item) => !matchesFilter(item, filter));
    }
    const removed = before - memoryStore[this.collection].length;
    if (removed > 0) persistLocalStore();
    return removed;
  }

  async count(filter: Record<string, any> = {}): Promise<number> {
    if (mongoConnected) {
      return this.model.countDocuments(filter);
    }
    return memoryStore[this.collection].filter((item) => matchesFilter(item, filter)).length;
  }
}

export const db = {
  users: new CollectionAdapter('users', UserModel),
  subjects: new CollectionAdapter('subjects', SubjectModel),
  topics: new CollectionAdapter('topics', TopicModel),
  goals: new CollectionAdapter('goals', LearningGoalModel),
  studyPlans: new CollectionAdapter('studyPlans', StudyPlanModel),
  studyTasks: new CollectionAdapter('studyTasks', StudyTaskModel),
  progress: new CollectionAdapter('progress', ProgressModel),
  studySessions: new CollectionAdapter('studySessions', StudySessionModel),
  activities: new CollectionAdapter('activities', LearningActivityModel),
  conversations: new CollectionAdapter('conversations', AIConversationModel),
  messages: new CollectionAdapter('messages', AIMessageModel),
  notes: new CollectionAdapter('notes', NoteModel),
  quizzes: new CollectionAdapter('quizzes', QuizModel),
  quizAttempts: new CollectionAdapter('quizAttempts', QuizAttemptModel),
  documents: new CollectionAdapter('documents', DocumentModel),
  documentChunks: new CollectionAdapter('documentChunks', DocumentChunkModel),
  recommendations: new CollectionAdapter('recommendations', RecommendationModel),
  flashcardDecks: new CollectionAdapter('flashcardDecks', FlashcardDeckModel),
  flashcards: new CollectionAdapter('flashcards', FlashcardModel),
};
