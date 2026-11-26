export type QuestionType =
  | 'single'
  | 'multiple'
  | 'boolean'
  | 'fill'
  | 'match'
  | 'discussion'
  | 'lab';

export type KnowledgeDomain =
  | 'perception'   // AI如何“看”和“听”（传感器与识别）
  | 'learning'     // AI怎样“变聪明”（机器学习与数据）
  | 'generative'   // AI画画与写诗（生成式AI与提示词）
  | 'life'         // 身边的智能小助手（推荐、导航与系统）
  | 'safety';      // 做个安全小达人（隐私、核查与伦理）

export interface ChoiceOption {
  key: string; // 'A' | 'B' | 'C' | 'D' | 'E'
  text: string;
}

export interface MatchPairItem {
  id: string;
  text: string;
}

export interface DiscussionChoice {
  id: string;
  text: string;
  isWise: boolean;
  feedback: string;
}

export interface Question {
  id: string; // e.g. 'S1Q1'
  setNumber: number; // 1..8
  orderInSet: number; // 1..15 (or 16 for lab)
  type: QuestionType;
  domain: KnowledgeDomain;
  conceptTag: string;
  prompt: string;

  // Choice / Boolean
  options?: ChoiceOption[];
  correctKeys?: string[]; // e.g. ['A'] or ['B','C','D'] or ['是']

  // Fill-in-blank via click-tile bank (NO text input!)
  blankSegments?: string[]; // text chunks split around ____ (length = blanks + 1)
  correctBlanks?: string[]; // canonical word for each blank
  acceptedDisplayAnswer?: string; // e.g. "提示词 / 描述"
  wordBank?: string[]; // shuffled clickable tiles including correctBlanks + distractors

  // Matching via click-to-pair
  leftItems?: MatchPairItem[]; // id '1','2','3','4'
  rightItems?: MatchPairItem[]; // id 'A','B','C','D'
  correctMatches?: Record<string, string>; // { '1': 'C', ... }

  // Discussion via guided point-card clicker
  discussionScenario?: string;
  discussionSubQuestions?: string[];
  discussionChoices?: DiscussionChoice[];
  referenceEssay?: string;

  // Grade-2 friendly explanations
  kidSummary: string;     // 一句话秒懂
  kidAnalogy: string;     // 生活小比喻 & 推理步骤
  wrongTips: string;      // 易错点排雷
  rawExplanation: string; // 原题参考解析
  rawAnswerLabel: string; // 原题参考答案文本
}

export type UserSubmission =
  | { type: 'single'; selected: string }
  | { type: 'multiple'; selected: string[] }
  | { type: 'boolean'; selected: string }
  | { type: 'fill'; blanks: (string | null)[] }
  | { type: 'match'; pairs: Record<string, string> }
  | { type: 'discussion'; selectedIds: string[] }
  | { type: 'lab'; wiringOk: boolean; blocksOk: boolean; score: number };

export interface QuestionRecord {
  questionId: string;
  attempts: number;
  correctCount: number;
  lastCorrect: boolean;
  mastered: boolean; // true when answered right and not currently flagged in wrong bank
  inWrongBank: boolean;
  lastPracticedAt: number;
}

export interface LabProgress {
  completed: boolean;
  bestScore: number; // out of 40
  attempts: number;
  lastPracticedAt: number | null;
}

export interface LearningProgress {
  version: number;
  stars: number;
  streak: number;
  bestStreak: number;
  totalAnswered: number;
  totalCorrect: number;
  records: Record<string, QuestionRecord>;
  completedSets: Record<number, { bestAccuracy: number; attempts: number }>;
  lab: LabProgress;
}

export type PracticeMode = 'smart' | 'wrong' | 'domain' | 'set' | 'single_item';

export interface PracticeSession {
  id: string;
  mode: PracticeMode;
  title: string;
  subtitle: string;
  questionIds: string[];
  includeLabAtEnd?: boolean;
}

export interface SessionResult {
  questionId: string;
  isCorrect: boolean;
  starsEarned: number;
}
