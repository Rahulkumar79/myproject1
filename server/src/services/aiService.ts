import {
  getGeminiClient,
  GEMINI_TEXT_MODEL,
  GEMINI_EMBEDDING_MODEL,
  Type,
  withAiTimeout,
  sanitizeProviderError,
} from '../config/gemini.ts';
import { computeDeterministicEmbedding } from '../utils/vectorMath.ts';

export async function generateEmbedding(text: string): Promise<number[]> {
  const ai = getGeminiClient();
  if (ai) {
    try {
      const res = await withAiTimeout(
        ai.models.embedContent({
          model: GEMINI_EMBEDDING_MODEL,
          contents: [text.slice(0, 3000)],
        }),
        8000
      );
      const values = res.embeddings?.[0]?.values;
      if (values && values.length > 0) {
        return values;
      }
    } catch {
      // Fall back to deterministic semantic hash vector
    }
  }
  return computeDeterministicEmbedding(text);
}

const TUTOR_MODE_INSTRUCTIONS: Record<string, string> = {
  Beginner:
    'Explain concepts from first principles using everyday analogies, simple vocabulary, and clear step-by-step breakdowns. Avoid heavy jargon without defining it first.',
  Intermediate:
    'Provide balanced conceptual depth, practical code or architectural examples, trade-offs, and guided practice questions.',
  Advanced:
    'Dive into internal mechanisms, algorithmic complexity, edge cases, formal proofs or system design trade-offs, and production-level nuances.',
  'Interview Preparation':
    'Act as a senior technical interviewer and coach. Frame explanations around common technical interview questions, optimal time/space complexity, follow-up probes, and common pitfalls.',
  'Exam Preparation':
    'Focus on high-yield university exam definitions, structured comparison tables, key theorems/properties, step-by-step numerical or conceptual derivations, and likely exam questions.',
};

export async function generateTutorResponse(params: {
  mode: string;
  subject?: string;
  topic?: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  userMessage: string;
}): Promise<string> {
  const { mode, subject, topic, history, userMessage } = params;
  const modeGuide = TUTOR_MODE_INSTRUCTIONS[mode] || TUTOR_MODE_INSTRUCTIONS.Intermediate;

  const systemInstruction = `You are Learning Companion, a patient, rigorous, and encouraging personal AI tutor for computer science and engineering students.
Current Pedagogical Mode: ${mode}.
${modeGuide}
${subject ? `Active Subject: ${subject}.` : ''}
${topic ? `Active Topic: ${topic}.` : ''}

Pedagogical Rules:
1. Explain concepts clearly with structured headings and concrete examples.
2. Provide step-by-step explanations for complex mechanisms or algorithms.
3. Do not merely dump a final answer to homework problems; teach the underlying reasoning, offer hints when appropriate, and correct misconceptions gently.
4. Conclude your response with 1-2 thought-provoking follow-up or practice questions to check the student's understanding.`;

  const ai = getGeminiClient();
  if (ai) {
    try {
      const conversationContext = history
        .slice(-10)
        .map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
        .join('\n\n');

      const prompt = conversationContext
        ? `Previous Conversation:\n${conversationContext}\n\nStudent's New Message:\n${userMessage}`
        : userMessage;

      const response = await withAiTimeout(
        ai.models.generateContent({
          model: GEMINI_TEXT_MODEL,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.65,
          },
        }),
        15000
      );

      if (response.text) {
        return response.text;
      }
    } catch (err) {
      console.warn('[Gemini Tutor Fallback]:', sanitizeProviderError(err));
    }
  }

  // Deterministic high-value educational fallback when API key is unset or offline
  const cleanTopic = topic || subject || 'this core concept';
  return `### Understanding ${cleanTopic} (${mode} Mode)

Let's break down **${userMessage}** systematically so you can master both the theory and its practical application.

#### 1. Core Intuition & First Principles
At its heart, **${cleanTopic}** solves a fundamental engineering trade-off between **efficiency**, **maintainability**, and **scalability**.
- ** Beginner/Intuitive View:** Think of it as organizing a library with a deterministic catalog index rather than scanning every shelf sequentially.
- **Formal Definition:** In computer science, this mechanism defines a structured contract for how data or control flow transitions between states with predictable complexity bounds.

#### 2. Step-by-Step Mechanism
1. **Initialization & Input Validation:** Verify preconditions and invariants before state mutation.
2. **Core Transformation / Execution:** Apply the primary rule or algorithmic step while preserving system consistency.
3. **Verification & Output:** Ensure post-conditions hold and return the computed result.

#### 3. Concrete Example
\`\`\`
// Conceptual walkthrough for: ${userMessage.slice(0, 60)}
Input State  -->  [Validation & Indexing]  -->  [Deterministic Execution]  -->  Verified Output
\`\`\`

#### 4. Common Pitfalls to Avoid
- **Mistake 1:** Ignoring boundary conditions (empty inputs, null references, or maximum capacity limits).
- **Mistake 2:** Memorizing syntax or formulas without understanding *why* the invariant holds.

---
**Check Your Understanding (Practice Prompt):**
1. How would the behavior change if the input scale increased by $100\\times$?
2. Can you identify one real-world system where this exact pattern is used?`;
}

export async function generateStructuredNotes(params: {
  subject: string;
  topic: string;
  difficulty: string;
  length: string;
}): Promise<{ content: string; structuredSections: Record<string, any> }> {
  const { subject, topic, difficulty, length } = params;
  const ai = getGeminiClient();

  const lengthDirective =
    length === 'Concise'
      ? 'Keep each section tight, high-signal, and bullet-focused (approx 400-600 words total).'
      : length === 'Comprehensive'
      ? 'Provide thorough academic depth, detailed derivations, and multiple concrete examples (approx 1200-1600 words total).'
      : 'Provide balanced academic coverage suitable for lecture study and revision (approx 800-1000 words total).';

  if (ai) {
    try {
      const response = await withAiTimeout(
        ai.models.generateContent({
          model: GEMINI_TEXT_MODEL,
          contents: `Generate comprehensive, structured academic study notes for:
Subject: ${subject}
Topic: ${topic}
Difficulty Level: ${difficulty}
Length Preference: ${length} (${lengthDirective})`,
          config: {
            systemInstruction:
              'You are an expert university professor creating structured study notes. Return valid JSON matching the schema.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                overview: { type: Type.STRING },
                definitions: { type: Type.ARRAY, items: { type: Type.STRING } },
                keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
                detailedExplanation: { type: Type.STRING },
                examples: { type: Type.ARRAY, items: { type: Type.STRING } },
                advantages: { type: Type.ARRAY, items: { type: Type.STRING } },
                disadvantages: { type: Type.ARRAY, items: { type: Type.STRING } },
                commonMistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
                importantPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                quickRevision: { type: Type.ARRAY, items: { type: Type.STRING } },
                examQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: [
                'overview',
                'definitions',
                'keyConcepts',
                'detailedExplanation',
                'examples',
                'advantages',
                'disadvantages',
                'commonMistakes',
                'importantPoints',
                'quickRevision',
                'examQuestions',
              ],
            },
          },
        }),
        15000
      );

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        if (parsed && typeof parsed === 'object' && parsed.overview) {
          const markdown = formatNotesToMarkdown(subject, topic, difficulty, parsed);
          return { content: markdown, structuredSections: parsed };
        }
      }
    } catch (err) {
      console.warn('[Gemini Notes Fallback]:', sanitizeProviderError(err));
    }
  }

  const fallbackSections = {
    overview: `${topic} is a foundational pillar in ${subject}. At the ${difficulty} level, mastering ${topic} requires understanding its theoretical guarantees, architectural trade-offs, and practical implementation patterns.`,
    definitions: [
      `${topic}: The formal mechanism in ${subject} that governs structured state transitions, resource efficiency, and correctness invariants.`,
      `Invariant: A property of ${topic} that remains true before and after every valid operation.`,
      `Throughput & Complexity: The quantitative measure of how ${topic} scales as workload size grows.`,
    ],
    keyConcepts: [
      `Core abstraction layer and separation of concerns in ${topic}`,
      `Time vs. space complexity trade-offs and resource utilization`,
      `Deterministic execution paths and concurrency/boundary safety`,
      `Real-world production patterns in modern ${subject} systems`,
    ],
    detailedExplanation: `In ${subject}, **${topic}** addresses the challenge of maintaining correctness while optimizing performance. When a system processes operations under ${topic}, it first establishes a well-defined structural boundary. Next, transformations are applied atomically or iteratively so that intermediate states never violate domain constraints.\n\nAt a ${difficulty} level, students should pay close attention to how ${topic} interacts with adjacent subsystems—such as memory hierarchy, I/O scheduling, or modular interfaces—and how bottleneck analysis guides optimization.`,
    examples: [
      `Standard Case: Applying ${topic} to a balanced workload where locality of reference reduces overhead by an order of magnitude.`,
      `Edge Case: Handling skewed inputs or high-contention scenarios in ${topic} using fallback safeguards.`,
    ],
    advantages: [
      `Predictable performance characteristics and formal correctness guarantees`,
      `Modular design that simplifies debugging, testing, and maintenance`,
      `Broad industry adoption across enterprise ${subject} architectures`,
    ],
    disadvantages: [
      `Additional implementation complexity compared to naive approaches`,
      `Potential memory or metadata overhead for very small datasets`,
    ],
    commonMistakes: [
      `Applying ${topic} without verifying prerequisite assumptions or input constraints`,
      `Confusing average-case performance with worst-case guarantees during system design`,
      `Neglecting cleanup or boundary validation on edge-case inputs`,
    ],
    importantPoints: [
      `Always state the core invariant of ${topic} before deriving its complexity.`,
      `Compare ${topic} with alternative approaches using concrete workload criteria.`,
      `Remember the trade-off between latency and resource footprint.`,
    ],
    quickRevision: [
      `Core Purpose: Ensures scalable, verifiable behavior in ${subject}.`,
      `Primary Trade-off: Structural overhead vs. long-term execution efficiency.`,
      `Key Takeaway: Always validate preconditions and boundary invariants.`,
    ],
    examQuestions: [
      `Define ${topic} in the context of ${subject} and explain its primary invariants with a diagram or example.`,
      `Compare and contrast ${topic} under best-case and worst-case workloads. When would you choose an alternative design?`,
      `Trace step-by-step how ${topic} handles boundary conditions and error recovery.`,
    ],
  };

  return {
    content: formatNotesToMarkdown(subject, topic, difficulty, fallbackSections),
    structuredSections: fallbackSections,
  };
}

function formatNotesToMarkdown(subject: string, topic: string, difficulty: string, s: any): string {
  return `# ${topic} — ${subject} (${difficulty})

## 1. Overview
${s.overview}

## 2. Formal Definitions
${(s.definitions || []).map((d: string) => `- ${d}`).join('\n')}

## 3. Key Concepts
${(s.keyConcepts || []).map((k: string) => `- ${k}`).join('\n')}

## 4. Detailed Explanation
${s.detailedExplanation}

## 5. Concrete Examples
${(s.examples || []).map((e: string, i: number) => `${i + 1}. ${e}`).join('\n')}

## 6. Advantages & Disadvantages
### Advantages
${(s.advantages || []).map((a: string) => `- ${a}`).join('\n')}

### Disadvantages
${(s.disadvantages || []).map((d: string) => `- ${d}`).join('\n')}

## 7. Common Mistakes
${(s.commonMistakes || []).map((m: string) => `- ${m}`).join('\n')}

## 8. Important Points to Remember
${(s.importantPoints || []).map((p: string) => `- ${p}`).join('\n')}

## 9. Quick Revision Checklist
${(s.quickRevision || []).map((q: string) => `- ${q}`).join('\n')}

## 10. High-Yield Exam Questions
${(s.examQuestions || []).map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}
`;
}

export async function generateQuizQuestions(params: {
  subject: string;
  topic: string;
  difficulty: string;
  questionCount: number;
  questionType: 'MCQ' | 'True/False' | 'Short Answer' | 'Mixed';
}): Promise<
  Array<{
    id: string;
    type: 'MCQ' | 'True/False' | 'Short Answer';
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>
> {
  const { subject, topic, difficulty, questionCount, questionType } = params;
  const count = Math.min(Math.max(Number(questionCount) || 5, 3), 15);
  const ai = getGeminiClient();

  if (ai) {
    try {
      const response = await withAiTimeout(
        ai.models.generateContent({
          model: GEMINI_TEXT_MODEL,
          contents: `Create a ${difficulty}-level academic quiz with exactly ${count} questions on:
Subject: ${subject}
Topic: ${topic}
Question Type: ${questionType}

Rules:
- If type is MCQ, provide exactly 4 distinct options and set correctAnswer to the exact text of the correct option.
- If type is True/False, set options to ["True", "False"] and correctAnswer to either "True" or "False".
- If type is Short Answer, set options to [] and correctAnswer to a concise 1-5 word canonical answer term or phrase.
- Provide a clear educational explanation for every question.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['type', 'question', 'options', 'correctAnswer', 'explanation'],
              },
            },
          },
        }),
        15000
      );

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, count).map((q: any, idx: number) => {
            const normalizedType: 'MCQ' | 'True/False' | 'Short Answer' =
              q.type === 'True/False' || q.type === 'Short Answer' ? q.type : 'MCQ';
            return {
              id: `q-${Date.now()}-${idx + 1}`,
              type: normalizedType,
              question: q.question,
              options:
                normalizedType === 'True/False'
                  ? ['True', 'False']
                  : normalizedType === 'Short Answer'
                  ? []
                  : Array.isArray(q.options) && q.options.length > 0
                  ? q.options
                  : ['Option A', 'Option B', 'Option C', 'Option D'],
              correctAnswer: String(q.correctAnswer || '').trim(),
              explanation: String(q.explanation || 'Review the core principles of this topic.'),
            };
          });
        }
      }
    } catch (err) {
      console.warn('[Gemini Quiz Fallback]:', sanitizeProviderError(err));
    }
  }

  // Fallback question bank tailored to the requested subject, topic, and questionType
  const templates: Array<{
    type: 'MCQ' | 'True/False' | 'Short Answer';
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }> = [
    {
      type: 'MCQ',
      question: `Which of the following best describes the primary design goal of ${topic} in ${subject}?`,
      options: [
        `Ensuring correctness invariants while optimizing execution efficiency`,
        `Eliminating all memory allocation by disabling runtime checks`,
        `Replacing modular interfaces with monolithic global state`,
        `Bypassing validation to maximize raw unverified throughput`,
      ],
      correctAnswer: `Ensuring correctness invariants while optimizing execution efficiency`,
      explanation: `${topic} in ${subject} is specifically designed to maintain structural correctness while balancing time and space complexity.`,
    },
    {
      type: 'MCQ',
      question: `When analyzing ${topic} at an ${difficulty} level, what is the most critical trade-off engineers evaluate?`,
      options: [
        `Time complexity and latency versus memory footprint and structural overhead`,
        `Source code file count versus monitor refresh rate`,
        `Variable identifier length versus compiler version`,
        `Network cable color versus disk sector size`,
      ],
      correctAnswer: `Time complexity and latency versus memory footprint and structural overhead`,
      explanation: `Every core mechanism in ${subject}, especially ${topic}, balances execution speed against memory or coordination overhead.`,
    },
    {
      type: 'True/False',
      question: `True or False: In ${subject}, ${topic} guarantees optimal performance even when input preconditions and boundary invariants are violated.`,
      options: ['True', 'False'],
      correctAnswer: 'False',
      explanation: `Violating preconditions or boundary invariants in ${topic} leads to undefined behavior, performance degradation, or incorrect states.`,
    },
    {
      type: 'MCQ',
      question: `Which edge case must always be tested when implementing ${topic}?`,
      options: [
        `Empty inputs, boundary capacities, and high-contention or skewed workloads`,
        `Only ideal average-case inputs of size 10`,
        `Comments formatting in documentation files`,
        `Static UI theme colors`,
      ],
      correctAnswer: `Empty inputs, boundary capacities, and high-contention or skewed workloads`,
      explanation: `Boundary conditions and skewed distributions expose worst-case behavior in ${topic}.`,
    },
    {
      type: 'Short Answer',
      question: `In one word, what term describes a condition or property in ${topic} that must remain true both before and after every valid operation?`,
      options: [],
      correctAnswer: 'Invariant',
      explanation: `An invariant is a formal property that holds true across all valid state transitions in ${topic}.`,
    },
    {
      type: 'MCQ',
      question: `Why is modular abstraction important when integrating ${topic} into a larger ${subject} architecture?`,
      options: [
        `It isolates internal implementation details so components can evolve independently`,
        `It forces all modules to share mutable global variables`,
        `It prevents automated unit testing`,
        `It doubles CPU clock frequency`,
      ],
      correctAnswer: `It isolates internal implementation details so components can evolve independently`,
      explanation: `Encapsulation and clean interfaces allow ${topic} to be optimized or verified without breaking dependent subsystems.`,
    },
  ];

  const results = [];
  for (let i = 0; i < count; i++) {
    const base = templates[i % templates.length];
    let qType: 'MCQ' | 'True/False' | 'Short Answer' =
      questionType === 'Mixed' ? base.type : questionType;

    if (qType === 'True/False' && base.type !== 'True/False') {
      results.push({
        id: `q-${Date.now()}-${i + 1}`,
        type: 'True/False' as const,
        question: `True or False: Mastering ${topic} in ${subject} requires understanding both average-case and worst-case behavior (Item #${i + 1}).`,
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: `Both average-case and worst-case complexity are essential for reliable engineering in ${subject}.`,
      });
    } else if (qType === 'Short Answer' && base.type !== 'Short Answer') {
      results.push({
        id: `q-${Date.now()}-${i + 1}`,
        type: 'Short Answer' as const,
        question: `What is the primary subject domain that ${topic} belongs to in this quiz?`,
        options: [],
        correctAnswer: subject,
        explanation: `${topic} is a core topic studied within ${subject}.`,
      });
    } else {
      results.push({
        id: `q-${Date.now()}-${i + 1}`,
        type: base.type,
        question: i >= templates.length ? `${base.question} (Scenario ${i + 1})` : base.question,
        options: base.options,
        correctAnswer: base.correctAnswer,
        explanation: base.explanation,
      });
    }
  }

  return results;
}

export async function generateStudyPlanTasks(params: {
  title: string;
  subjects: string[];
  topics: string[];
  weakSubjects: string[];
  dailyHours: number;
  startDate: string;
  examDate: string;
  knowledgeLevel: string;
  preferredStudyTime: string;
}): Promise<{
  description: string;
  weeklySummary: Array<{ week: number; focus: string; hoursAllocated: number }>;
  tasks: Array<{
    subject: string;
    topic: string;
    title: string;
    description: string;
    taskType: 'study' | 'revision' | 'practice' | 'quiz';
    scheduledDate: string;
    estimatedDuration: number;
    priority: 'low' | 'medium' | 'high';
  }>;
}> {
  const {
    subjects,
    topics,
    weakSubjects,
    dailyHours,
    startDate,
    examDate,
    knowledgeLevel,
    preferredStudyTime,
  } = params;

  const safeHours = Math.min(Math.max(Number(dailyHours) || 3, 1), 10);
  const dailyMinutesBudget = safeHours * 60;

  const start = startDate ? new Date(startDate) : new Date();
  const end = examDate ? new Date(examDate) : new Date(Date.now() + 14 * 86400000);
  const diffDays = Math.max(3, Math.min(21, Math.ceil((end.getTime() - start.getTime()) / 86400000)));

  const subjectPool = subjects.length > 0 ? subjects : ['Data Structures & Algorithms', 'DBMS', 'Operating Systems'];
  const topicPool =
    topics.length > 0
      ? topics
      : [
          'Core Architecture & Fundamentals',
          'Algorithmic Problem Solving',
          'Indexing, Normalization & Query Optimization',
          'Concurrency, Scheduling & Memory Management',
          'System Design & Edge-Case Analysis',
          'Mock Assessment & Past Paper Synthesis',
        ];

  const tasks: Array<{
    subject: string;
    topic: string;
    title: string;
    description: string;
    taskType: 'study' | 'revision' | 'practice' | 'quiz';
    scheduledDate: string;
    estimatedDuration: number;
    priority: 'low' | 'medium' | 'high';
  }> = [];

  for (let dayOffset = 0; dayOffset < Math.min(diffDays, 14); dayOffset++) {
    const dateObj = new Date(start.getTime() + dayOffset * 86400000);
    const dateStr = dateObj.toISOString().split('T')[0];

    const primarySubject = subjectPool[dayOffset % subjectPool.length];
    const isWeak = weakSubjects.includes(primarySubject);
    const primaryTopic = topicPool[dayOffset % topicPool.length];

    // Never exceed dailyMinutesBudget! Split into 2 focused blocks per day.
    const block1Minutes = Math.round(dailyMinutesBudget * 0.6);
    const block2Minutes = Math.max(20, dailyMinutesBudget - block1Minutes);

    tasks.push({
      subject: primarySubject,
      topic: primaryTopic,
      title: `${primarySubject}: Deep Dive into ${primaryTopic}`,
      description: `Scheduled for ${preferredStudyTime} session (${knowledgeLevel} level). Focus on core definitions, invariants, and worked examples.`,
      taskType: dayOffset % 4 === 3 ? 'revision' : 'study',
      scheduledDate: dateStr,
      estimatedDuration: block1Minutes,
      priority: isWeak ? 'high' : 'medium',
    });

    tasks.push({
      subject: primarySubject,
      topic: primaryTopic,
      title:
        dayOffset % 3 === 2
          ? `${primarySubject}: Timed Concept Quiz & Error Review`
          : `${primarySubject}: Active Recall & Practice Problems`,
      description: `Consolidate ${primaryTopic} with hands-on problem solving and self-testing within your ${safeHours}h/day budget.`,
      taskType: dayOffset % 3 === 2 ? 'quiz' : 'practice',
      scheduledDate: dateStr,
      estimatedDuration: block2Minutes,
      priority: isWeak ? 'high' : 'medium',
    });
  }

  const weeklySummary = [
    {
      week: 1,
      focus: `Foundational Mastery & Weak Subject Reinforcement (${weakSubjects.join(', ') || subjectPool[0]})`,
      hoursAllocated: safeHours * 7,
    },
    {
      week: 2,
      focus: `Applied Problem Solving, Spaced Revision & Timed Mock Quizzes`,
      hoursAllocated: safeHours * 7,
    },
  ];

  return {
    description: `Personalized ${diffDays}-day adaptive study schedule tailored for ${knowledgeLevel} level (${safeHours} hrs/day, ${preferredStudyTime} preference). Prioritizes weak areas while strictly respecting your daily study capacity.`,
    weeklySummary,
    tasks,
  };
}

export interface GeneratedFlashcardItem {
  front: string;
  back: string;
  hint?: string;
  explanation?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  sourcePage?: number;
}

export async function generateFlashcardsWithAI(params: {
  subject: string;
  topic?: string;
  count?: number;
  difficulty?: string;
  sourceText?: string;
  sourceDocumentName?: string;
}): Promise<GeneratedFlashcardItem[]> {
  const { subject, topic, sourceText, sourceDocumentName } = params;
  const count = Math.min(Math.max(Number(params.count) || 8, 3), 20);
  const difficulty = params.difficulty || 'Medium';

  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `Generate exactly ${count} high-yield academic flashcards for study and spaced-repetition active recall.
Subject: ${subject}
${topic ? `Topic: ${topic}` : ''}
Difficulty target: ${difficulty}
${sourceDocumentName ? `Source Document: ${sourceDocumentName}` : ''}
${sourceText ? `Source Grounding Context (generate cards grounded in this material):\n${sourceText.slice(0, 4000)}` : ''}

Rules:
1. "front" must be an active-recall prompt or conceptual question (not merely a single word). Max 300 characters.
2. "back" must be a concise, authoritative answer or definition with key invariants. Max 600 characters.
3. "hint" is an optional clue to trigger recall without giving away the full answer.
4. "explanation" is an optional brief reason, formula, or trade-off context.
5. "difficulty" must be strictly one of: "Easy", "Medium", "Hard".
6. If the source material mentions pages like [Page 5], extract the number into "sourcePage": 5.
7. Return ONLY a valid JSON array of objects with keys: front, back, hint, explanation, difficulty, sourcePage. No markdown code fence or extra text.`;

      const response = await withAiTimeout(
        ai.models.generateContent({
          model: GEMINI_TEXT_MODEL,
          contents: prompt,
          config: {
            temperature: 0.4,
          },
        }),
        15000
      );

      const rawText = response.text?.trim() || '';
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed) && parsed.length > 0) {
        const validated: GeneratedFlashcardItem[] = [];
        for (const item of parsed) {
          if (item && typeof item.front === 'string' && typeof item.back === 'string') {
            const front = item.front.trim().slice(0, 500);
            const back = item.back.trim().slice(0, 1000);
            if (front.length > 3 && back.length > 1) {
              validated.push({
                front,
                back,
                hint: typeof item.hint === 'string' ? item.hint.trim().slice(0, 250) : undefined,
                explanation: typeof item.explanation === 'string' ? item.explanation.trim().slice(0, 500) : undefined,
                difficulty: ['Easy', 'Medium', 'Hard'].includes(item.difficulty) ? item.difficulty : 'Medium',
                sourcePage: typeof item.sourcePage === 'number' && !isNaN(item.sourcePage) ? item.sourcePage : undefined,
              });
            }
          }
        }
        if (validated.length >= 3) {
          return validated.slice(0, count);
        }
      }
    } catch (err) {
      console.warn('[Gemini Flashcards Fallback]:', sanitizeProviderError(err));
    }
  }

  // Deterministic high-value curriculum fallback
  return getDeterministicFlashcards({ subject, topic: topic || 'Core Fundamentals', count, sourceText });
}

function getDeterministicFlashcards(params: {
  subject: string;
  topic: string;
  count: number;
  sourceText?: string;
}): GeneratedFlashcardItem[] {
  const { subject, topic, count, sourceText } = params;

  if (sourceText && sourceText.length > 80) {
    // Generate cards from sentences in source text
    const sentences = sourceText
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 30 && s.length < 250);

    if (sentences.length >= 3) {
      return sentences.slice(0, count).map((sent, idx) => ({
        front: `What key concept regarding ${topic} is described here: "${sent.slice(0, 90)}..."?`,
        back: sent,
        hint: `Recall the foundational rule for ${topic}.`,
        explanation: `Extracted from uploaded study context for ${subject}.`,
        difficulty: (idx % 3 === 0 ? 'Easy' : idx % 3 === 1 ? 'Medium' : 'Hard') as 'Easy' | 'Medium' | 'Hard',
      }));
    }
  }

  const topicKey = (topic || subject).toLowerCase();

  const curatedBank: Record<string, GeneratedFlashcardItem[]> = {
    sql: [
      { front: 'What are the ACID properties in database transaction management?', back: 'Atomicity, Consistency, Isolation, and Durability.', hint: 'Think of 4 core guarantees.', explanation: 'Essential for ensuring data validity in RDBMS.', difficulty: 'Easy' },
      { front: 'What is the primary difference between clustered and non-clustered indexes?', back: 'A clustered index determines the physical order of rows in the table (1 per table), while a non-clustered index creates a separate search tree pointing to table rows.', hint: 'Physical table order vs separate pointer structure.', difficulty: 'Medium' },
      { front: 'Explain BCNF (Boyce-Codd Normal Form) and how it differs from 3NF.', back: 'In BCNF, every functional dependency X -> Y requires X to be a superkey. 3NF allows prime attributes on the right-hand side even if X is not a superkey.', hint: 'Every determinant must be a candidate/superkey.', difficulty: 'Hard' },
      { front: 'What is the difference between DELETE, TRUNCATE, and DROP?', back: 'DELETE is DML (can rollback, row-by-row); TRUNCATE is DDL (resets identity, deallocates pages, faster); DROP removes the entire schema and data.', hint: 'DML vs DDL and rollback implications.', difficulty: 'Medium' },
    ],
    dsa: [
      { front: 'What is the average and worst-case time complexity of QuickSort?', back: 'Average: O(n log n); Worst-case: O(n²) when the pivot is consistently the minimum or maximum element.', hint: 'Depends on pivot quality.', difficulty: 'Medium' },
      { front: 'How does Dijkstra’s algorithm differ from the Bellman-Ford algorithm?', back: 'Dijkstra runs in O((V + E) log V) with a min-heap but fails with negative edge weights; Bellman-Ford runs in O(V * E) and detects negative weight cycles.', hint: 'Negative edges and cycle detection.', difficulty: 'Hard' },
      { front: 'What are the two key properties of Dynamic Programming problems?', back: '1. Overlapping Subproblems and 2. Optimal Substructure.', hint: 'Reusing past solutions and composing optimal answers.', difficulty: 'Easy' },
      { front: 'What is an AVL Tree and what is its balance condition?', back: 'A self-balancing BST where the height difference (balance factor) between left and right subtrees of any node is at most 1 (-1, 0, or 1).', hint: 'Height invariant <= 1.', difficulty: 'Medium' },
    ],
    os: [
      { front: 'What are the 4 Coffman conditions required for a deadlock to occur?', back: 'Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.', hint: 'All four must hold simultaneously.', difficulty: 'Medium' },
      { front: 'What is the difference between a process and a thread?', back: 'A process is an execution unit with its own virtual address space and resources. A thread is a lightweight execution unit inside a process sharing the same address space and open files.', hint: 'Address space and memory isolation.', difficulty: 'Easy' },
      { front: 'What is Belady’s Anomaly in page replacement algorithms?', back: 'A phenomenon where increasing the number of page frames causes an increase in page faults, typically seen in FIFO.', hint: 'More memory leading to worse performance.', difficulty: 'Hard' },
      { front: 'What is the function of the Translation Lookaside Buffer (TLB)?', back: 'A high-speed hardware memory cache used to speed up virtual-to-physical address translation by storing recent Page Table entries.', hint: 'Hardware MMU cache.', difficulty: 'Medium' },
    ],
    networks: [
      { front: 'Compare the TCP 3-way handshake with the TCP 4-way teardown.', back: 'Handshake: SYN -> SYN-ACK -> ACK. Teardown: FIN -> ACK -> FIN -> ACK (allows half-closed connections).', hint: 'SYN vs FIN sequencing.', difficulty: 'Medium' },
      { front: 'What is the difference between Flow Control and Congestion Control in TCP?', back: 'Flow Control prevents sender from overwhelming receiver buffer (Sliding Window); Congestion Control prevents sender from overwhelming the network infrastructure (Slow Start, Congestion Avoidance).', hint: 'Receiver buffer vs intermediate network routers.', difficulty: 'Hard' },
      { front: 'What layer does ARP operate at and what is its purpose?', back: 'Operates between Data Link (Layer 2) and Network (Layer 3) to map an IPv4 address to a physical MAC address on a local link.', hint: 'IP to MAC resolution.', difficulty: 'Easy' },
      { front: 'Explain DNS resolution: iterative vs recursive queries.', back: 'In a recursive query, the local DNS server does all the lookups on behalf of the client. In an iterative query, the queried server returns the address of the next DNS server to contact.', hint: 'Client delegation vs server delegation.', difficulty: 'Medium' },
    ],
  };

  let pool: GeneratedFlashcardItem[] = [];
  if (topicKey.includes('sql') || topicKey.includes('dbms') || topicKey.includes('database')) {
    pool = curatedBank.sql;
  } else if (topicKey.includes('dsa') || topicKey.includes('structure') || topicKey.includes('algorithm') || topicKey.includes('tree') || topicKey.includes('graph')) {
    pool = curatedBank.dsa;
  } else if (topicKey.includes('os') || topicKey.includes('operating') || topicKey.includes('process') || topicKey.includes('memory')) {
    pool = curatedBank.os;
  } else if (topicKey.includes('network') || topicKey.includes('tcp') || topicKey.includes('ip') || topicKey.includes('http')) {
    pool = curatedBank.networks;
  } else {
    pool = [
      ...curatedBank.dsa,
      ...curatedBank.sql,
      ...curatedBank.os,
      ...curatedBank.networks,
    ];
  }

  // Ensure count items
  const result: GeneratedFlashcardItem[] = [];
  for (let i = 0; i < count; i++) {
    const item = pool[i % pool.length];
    result.push({
      ...item,
      front: i >= pool.length ? `${item.front} (Variant #${Math.floor(i / pool.length) + 1})` : item.front,
    });
  }
  return result;
}
