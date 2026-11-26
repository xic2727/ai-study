import { KNOWLEDGE_DOMAINS } from '../data/domains';
import {
  KnowledgeDomain,
  LearningProgress,
  Question,
  QuestionRecord,
  UserSubmission,
} from '../types/quiz';

export const STORAGE_KEY = 'ai_literacy_grade2_progress_v1';

export function createInitialProgress(): LearningProgress {
  return {
    version: 1,
    stars: 0,
    streak: 0,
    bestStreak: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    records: {},
    completedSets: {},
    lab: {
      completed: false,
      bestScore: 0,
      attempts: 0,
      lastPracticedAt: null,
    },
  };
}

export function loadProgress(): LearningProgress {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createInitialProgress();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialProgress();
    const parsed = JSON.parse(raw) as Partial<LearningProgress>;
    const base = createInitialProgress();
    return {
      ...base,
      ...parsed,
      records: parsed.records ?? {},
      completedSets: parsed.completedSets ?? {},
      lab: { ...base.lab, ...(parsed.lab ?? {}) },
    };
  } catch {
    return createInitialProgress();
  }
}

export function saveProgress(progress: LearningProgress): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore storage quota errors gracefully
  }
}

export function clearProgress(): LearningProgress {
  const fresh = createInitialProgress();
  saveProgress(fresh);
  return fresh;
}

export interface EvaluationResult {
  isCorrect: boolean;
  detailMessage: string;
}

export function evaluateSubmission(
  question: Question,
  submission: UserSubmission
): EvaluationResult {
  if (question.type === 'single' && submission.type === 'single') {
    const expected = question.correctKeys?.[0] ?? '';
    const ok = submission.selected === expected;
    return {
      isCorrect: ok,
      detailMessage: ok
        ? '太棒了！你一眼就选出了最准确的答案！'
        : `再仔细想想哦，正确答案是选项 ${expected}。`,
    };
  }

  if (question.type === 'boolean' && submission.type === 'boolean') {
    const expected = question.correctKeys?.[0] ?? '';
    const ok = submission.selected === expected;
    return {
      isCorrect: ok,
      detailMessage: ok
        ? '判断完全正确！你的AI小雷达真灵敏！'
        : `这道题应该选“${expected}”哦，来看看小老师的解释吧！`,
    };
  }

  if (question.type === 'multiple' && submission.type === 'multiple') {
    const expectedSet = new Set(question.correctKeys ?? []);
    const selectedSet = new Set(submission.selected);
    const ok =
      expectedSet.size === selectedSet.size &&
      [...expectedSet].every((k) => selectedSet.has(k));
    return {
      isCorrect: ok,
      detailMessage: ok
        ? '多选题全选对了，一个小陷阱都没踩中！'
        : `正确选项是 ${(question.correctKeys ?? []).join('、')}，注意别漏选或多选哦！`,
    };
  }

  if (question.type === 'fill' && submission.type === 'fill') {
    const expected = question.correctBlanks ?? [];
    const ok =
      expected.length > 0 &&
      expected.length === submission.blanks.length &&
      expected.every((word, idx) => submission.blanks[idx] === word);
    return {
      isCorrect: ok,
      detailMessage: ok
        ? '词语小积木拼得严丝合缝，太厉害了！'
        : `正确答案是：${question.acceptedDisplayAnswer ?? expected.join('、')}。`,
    };
  }

  if (question.type === 'match' && submission.type === 'match') {
    const expected = question.correctMatches ?? {};
    const keys = Object.keys(expected);
    const ok =
      keys.length > 0 &&
      keys.every((k) => submission.pairs[k] === expected[k]);
    return {
      isCorrect: ok,
      detailMessage: ok
        ? '四组连线全部配对成功！'
        : `正确配对是：${question.rawAnswerLabel}，看看每组为什么连在一起吧！`,
    };
  }

  if (question.type === 'discussion' && submission.type === 'discussion') {
    const choices = question.discussionChoices ?? [];
    const wiseIds = new Set(choices.filter((c) => c.isWise).map((c) => c.id));
    const selectedSet = new Set(submission.selectedIds);
    const pickedTrap = choices.some((c) => !c.isWise && selectedSet.has(c.id));
    const missedWise = [...wiseIds].some((id) => !selectedSet.has(id));
    const ok = !pickedTrap && !missedWise && wiseIds.size > 0;
    return {
      isCorrect: ok,
      detailMessage: ok
        ? '你的思路太清晰了！所有好做法全选对，坏主意全部绕开啦！'
        : pickedTrap
          ? '选到了不太安全或偷懒的做法卡片哦，看看小老师的提醒吧！'
          : '还有几张好做法卡片漏选啦，把好习惯都集齐吧！',
    };
  }

  return {
    isCorrect: false,
    detailMessage: '答案格式不匹配，请重新选择后再提交。',
  };
}

export function applyAnswerToProgress(
  progress: LearningProgress,
  questionId: string,
  isCorrect: boolean,
  now: number = Date.now()
): { nextProgress: LearningProgress; starsEarned: number } {
  const prevRec: QuestionRecord = progress.records[questionId] ?? {
    questionId,
    attempts: 0,
    correctCount: 0,
    lastCorrect: false,
    mastered: false,
    inWrongBank: false,
    lastPracticedAt: 0,
  };

  const starsEarned = isCorrect ? 10 : 2;
  const nextStreak = isCorrect ? progress.streak + 1 : 0;
  const nextBestStreak = Math.max(progress.bestStreak, nextStreak);

  const nextRec: QuestionRecord = {
    questionId,
    attempts: prevRec.attempts + 1,
    correctCount: prevRec.correctCount + (isCorrect ? 1 : 0),
    lastCorrect: isCorrect,
    mastered: isCorrect,
    inWrongBank: isCorrect ? false : true,
    lastPracticedAt: now,
  };

  return {
    starsEarned,
    nextProgress: {
      ...progress,
      stars: progress.stars + starsEarned,
      streak: nextStreak,
      bestStreak: nextBestStreak,
      totalAnswered: progress.totalAnswered + 1,
      totalCorrect: progress.totalCorrect + (isCorrect ? 1 : 0),
      records: {
        ...progress.records,
        [questionId]: nextRec,
      },
    },
  };
}

export function applySetCompletionToProgress(
  progress: LearningProgress,
  setNumber: number,
  accuracyPct: number
): LearningProgress {
  const prev = progress.completedSets[setNumber];
  return {
    ...progress,
    completedSets: {
      ...progress.completedSets,
      [setNumber]: {
        bestAccuracy: Math.max(prev?.bestAccuracy ?? 0, accuracyPct),
        attempts: (prev?.attempts ?? 0) + 1,
      },
    },
  };
}

export function applyLabResultToProgress(
  progress: LearningProgress,
  score: number,
  now: number = Date.now()
): { nextProgress: LearningProgress; starsEarned: number } {
  const passed = score === 40;
  const starsEarned = passed ? 25 : 8;
  return {
    starsEarned,
    nextProgress: {
      ...progress,
      stars: progress.stars + starsEarned,
      lab: {
        completed: progress.lab.completed || passed,
        bestScore: Math.max(progress.lab.bestScore, score),
        attempts: progress.lab.attempts + 1,
        lastPracticedAt: now,
      },
    },
  };
}

export interface DomainStat {
  domain: KnowledgeDomain;
  total: number;
  attempted: number;
  mastered: number;
  wrongCount: number;
  masteryPct: number;
}

export interface ProgressStats {
  totalQuestions: number;
  attemptedCount: number;
  masteredCount: number;
  wrongBankCount: number;
  overallMasteryPct: number;
  accuracyPct: number;
  domainStats: DomainStat[];
  weakestDomain: DomainStat;
  wrongQuestionIds: string[];
}

export function computeProgressStats(
  questions: Question[],
  progress: LearningProgress
): ProgressStats {
  const domainBuckets: Record<
    KnowledgeDomain,
    { total: number; attempted: number; mastered: number; wrongCount: number }
  > = {
    perception: { total: 0, attempted: 0, mastered: 0, wrongCount: 0 },
    learning: { total: 0, attempted: 0, mastered: 0, wrongCount: 0 },
    generative: { total: 0, attempted: 0, mastered: 0, wrongCount: 0 },
    life: { total: 0, attempted: 0, mastered: 0, wrongCount: 0 },
    safety: { total: 0, attempted: 0, mastered: 0, wrongCount: 0 },
  };

  let attemptedCount = 0;
  let masteredCount = 0;
  const wrongQuestionIds: string[] = [];

  for (const q of questions) {
    const bucket = domainBuckets[q.domain];
    bucket.total += 1;
    const rec = progress.records[q.id];
    if (rec && rec.attempts > 0) {
      attemptedCount += 1;
      bucket.attempted += 1;
      if (rec.mastered) {
        masteredCount += 1;
        bucket.mastered += 1;
      }
      if (rec.inWrongBank) {
        bucket.wrongCount += 1;
        wrongQuestionIds.push(q.id);
      }
    }
  }

  const domainStats: DomainStat[] = KNOWLEDGE_DOMAINS.map((meta) => {
    const b = domainBuckets[meta.id];
    return {
      domain: meta.id,
      total: b.total,
      attempted: b.attempted,
      mastered: b.mastered,
      wrongCount: b.wrongCount,
      masteryPct: b.total > 0 ? Math.round((b.mastered / b.total) * 100) : 0,
    };
  });

  // Find weakest domain (prefer domain with wrong items, otherwise lowest mastery %)
  const weakestDomain = [...domainStats].sort((a, b) => {
    if (b.wrongCount !== a.wrongCount) return b.wrongCount - a.wrongCount;
    return a.masteryPct - b.masteryPct;
  })[0];

  const totalQuestions = questions.length;
  const overallMasteryPct =
    totalQuestions > 0 ? Math.round((masteredCount / totalQuestions) * 100) : 0;
  const accuracyPct =
    progress.totalAnswered > 0
      ? Math.round((progress.totalCorrect / progress.totalAnswered) * 100)
      : 0;

  return {
    totalQuestions,
    attemptedCount,
    masteredCount,
    wrongBankCount: wrongQuestionIds.length,
    overallMasteryPct,
    accuracyPct,
    domainStats,
    weakestDomain,
    wrongQuestionIds,
  };
}

/**
 * Smart Adaptive Practice Queue:
 * 1. Wrong bank items first (oldest practiced first)
 * 2. Unseen items weighted toward weaker domains (lowest masteryPct)
 * 3. Remaining non-mastered / oldest items up to `count`
 */
export function buildSmartPracticeIds(
  questions: Question[],
  progress: LearningProgress,
  count: number = 10
): string[] {
  const stats = computeProgressStats(questions, progress);
  const domainRank = new Map<KnowledgeDomain, number>();
  const sortedDomains = [...stats.domainStats].sort(
    (a, b) => a.masteryPct - b.masteryPct
  );
  sortedDomains.forEach((d, idx) => domainRank.set(d.domain, idx));

  const wrongItems = questions
    .filter((q) => progress.records[q.id]?.inWrongBank)
    .sort(
      (a, b) =>
        (progress.records[a.id]?.lastPracticedAt ?? 0) -
        (progress.records[b.id]?.lastPracticedAt ?? 0)
    );

  const unseenItems = questions
    .filter((q) => !progress.records[q.id])
    .sort((a, b) => {
      const rankDiff =
        (domainRank.get(a.domain) ?? 99) - (domainRank.get(b.domain) ?? 99);
      if (rankDiff !== 0) return rankDiff;
      if (a.orderInSet !== b.orderInSet) return a.orderInSet - b.orderInSet;
      return a.setNumber - b.setNumber;
    });

  const reviewItems = questions
    .filter(
      (q) =>
        progress.records[q.id] && !progress.records[q.id].inWrongBank
    )
    .sort(
      (a, b) =>
        (progress.records[a.id]?.lastPracticedAt ?? 0) -
        (progress.records[b.id]?.lastPracticedAt ?? 0)
    );

  const picked: string[] = [];
  const seen = new Set<string>();

  const pushUnique = (list: Question[]) => {
    for (const q of list) {
      if (picked.length >= count) break;
      if (!seen.has(q.id)) {
        seen.add(q.id);
        picked.push(q.id);
      }
    }
  };

  pushUnique(wrongItems);
  pushUnique(unseenItems);
  pushUnique(reviewItems);

  return picked;
}

export function buildDomainPracticeIds(
  questions: Question[],
  progress: LearningProgress,
  domain: KnowledgeDomain,
  count: number = 10
): string[] {
  const pool = questions.filter((q) => q.domain === domain);
  const wrong = pool.filter((q) => progress.records[q.id]?.inWrongBank);
  const unseen = pool.filter((q) => !progress.records[q.id]);
  const mastered = pool
    .filter((q) => progress.records[q.id] && !progress.records[q.id].inWrongBank)
    .sort(
      (a, b) =>
        (progress.records[a.id]?.lastPracticedAt ?? 0) -
        (progress.records[b.id]?.lastPracticedAt ?? 0)
    );

  return [...wrong, ...unseen, ...mastered]
    .slice(0, count)
    .map((q) => q.id);
}

export function buildSetPracticeIds(
  questions: Question[],
  setNumber: number
): string[] {
  return questions
    .filter((q) => q.setNumber === setNumber)
    .sort((a, b) => a.orderInSet - b.orderInSet)
    .map((q) => q.id);
}

export function getQuestionTypeLabel(type: Question['type']): string {
  switch (type) {
    case 'single':
      return '单选题';
    case 'multiple':
      return '多选题';
    case 'boolean':
      return '判断题';
    case 'fill':
      return '点词填空';
    case 'match':
      return '点击连线';
    case 'discussion':
      return '思辨点选';
    case 'lab':
      return '硬件实验';
  }
}
