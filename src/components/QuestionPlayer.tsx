import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  RotateCcw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { DOMAIN_MAP } from '../data/domains';
import { Question, UserSubmission } from '../types/quiz';
import {
  EvaluationResult,
  evaluateSubmission,
  getQuestionTypeLabel,
} from '../utils/quizEngine';

interface QuestionPlayerProps {
  questions: Question[];
  sessionTitle: string;
  sessionSubtitle: string;
  includeLabAtEnd?: boolean;
  onRecordAnswer: (questionId: string, isCorrect: boolean) => number; // returns starsEarned
  onFinishSession: (results: { questionId: string; isCorrect: boolean; starsEarned: number }[]) => void;
  onExit: () => void;
}

const PAIR_COLORS = [
  { line: '#0284C7', badge: 'bg-sky-50 border-sky-400 text-sky-900', dot: 'bg-sky-600' },
  { line: '#059669', badge: 'bg-emerald-50 border-emerald-400 text-emerald-900', dot: 'bg-emerald-600' },
  { line: '#D97706', badge: 'bg-amber-50 border-amber-400 text-amber-900', dot: 'bg-amber-600' },
  { line: '#4F46E5', badge: 'bg-indigo-50 border-indigo-400 text-indigo-900', dot: 'bg-indigo-600' },
];

export const QuestionPlayer: React.FC<QuestionPlayerProps> = ({
  questions,
  sessionTitle,
  sessionSubtitle,
  includeLabAtEnd,
  onRecordAnswer,
  onFinishSession,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resultsMap, setResultsMap] = useState<
    Record<string, { submission: UserSubmission; evalResult: EvaluationResult; starsEarned: number }>
  >({});

  // Per-question interactive input states
  const [singleKey, setSingleKey] = useState<string>('');
  const [multiKeys, setMultiKeys] = useState<string[]>([]);
  const [blanks, setBlanks] = useState<(string | null)[]>([]);
  const [activeBlankIdx, setActiveBlankIdx] = useState<number>(0);
  const [matchPairs, setMatchPairs] = useState<Record<string, string>>({});
  const [activeLeftId, setActiveLeftId] = useState<string | null>(null);
  const [discussionIds, setDiscussionIds] = useState<string[]>([]);
  const [showRawExplanation, setShowRawExplanation] = useState(false);

  const currentQuestion = questions[currentIndex];
  const submittedEntry = currentQuestion ? resultsMap[currentQuestion.id] : undefined;
  const isSubmitted = Boolean(submittedEntry);

  // Deterministic shuffled wordBank / discussionChoices per question ID so options aren't always in answer order
  const orderedWordBank = useMemo(() => {
    if (!currentQuestion?.wordBank) return [];
    const arr = [...currentQuestion.wordBank];
    // Deterministic rotation/interleave based on question id char codes
    const seed = currentQuestion.id.split('').reduce((s, ch) => s + ch.charCodeAt(0), 0);
    return arr.sort((a, b) => {
      const ha = (a.charCodeAt(0) * 31 + seed) % 97;
      const hb = (b.charCodeAt(0) * 31 + seed) % 97;
      return ha - hb;
    });
  }, [currentQuestion]);

  const orderedDiscussionChoices = useMemo(() => {
    if (!currentQuestion?.discussionChoices) return [];
    const arr = [...currentQuestion.discussionChoices];
    const seed = currentQuestion.id.split('').reduce((s, ch) => s + ch.charCodeAt(0), 0);
    return arr.sort((a, b) => {
      const ha = (a.id.charCodeAt(0) * 17 + a.text.charCodeAt(0) + seed) % 89;
      const hb = (b.id.charCodeAt(0) * 17 + b.text.charCodeAt(0) + seed) % 89;
      return ha - hb;
    });
  }, [currentQuestion]);

  // Reset local interactive state when switching question
  useEffect(() => {
    if (!currentQuestion) return;
    setShowRawExplanation(false);
    const existing = resultsMap[currentQuestion.id];
    if (existing) {
      const sub = existing.submission;
      if (sub.type === 'single' || sub.type === 'boolean') setSingleKey(sub.selected);
      if (sub.type === 'multiple') setMultiKeys(sub.selected);
      if (sub.type === 'fill') setBlanks(sub.blanks);
      if (sub.type === 'match') setMatchPairs(sub.pairs);
      if (sub.type === 'discussion') setDiscussionIds(sub.selectedIds);
      return;
    }

    setSingleKey('');
    setMultiKeys([]);
    setBlanks(new Array(currentQuestion.correctBlanks?.length ?? 0).fill(null));
    setActiveBlankIdx(0);
    setMatchPairs({});
    setActiveLeftId(null);
    setDiscussionIds([]);
  }, [currentQuestion?.id]);

  if (!currentQuestion) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-lg font-bold text-slate-800">没有找到可练习的题目</p>
        <button
          type="button"
          onClick={onExit}
          className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 rounded-lg cursor-pointer"
        >
          返回大厅
        </button>
      </div>
    );
  }

  const domainMeta = DOMAIN_MAP[currentQuestion.domain];
  const progressPct = Math.round(((currentIndex + 1) / questions.length) * 100);

  // Check if user has selected enough to submit
  const canSubmit = (() => {
    if (isSubmitted) return false;
    switch (currentQuestion.type) {
      case 'single':
      case 'boolean':
        return singleKey !== '';
      case 'multiple':
        return multiKeys.length > 0;
      case 'fill':
        return blanks.length > 0 && blanks.every((b) => b !== null);
      case 'match':
        return Object.keys(matchPairs).length === (currentQuestion.leftItems?.length ?? 4);
      case 'discussion':
        return discussionIds.length > 0;
      default:
        return false;
    }
  })();

  const handleSubmit = () => {
    if (!canSubmit) return;
    let submission: UserSubmission;
    switch (currentQuestion.type) {
      case 'single':
        submission = { type: 'single', selected: singleKey };
        break;
      case 'boolean':
        submission = { type: 'boolean', selected: singleKey };
        break;
      case 'multiple':
        submission = { type: 'multiple', selected: multiKeys };
        break;
      case 'fill':
        submission = { type: 'fill', blanks };
        break;
      case 'match':
        submission = { type: 'match', pairs: matchPairs };
        break;
      case 'discussion':
        submission = { type: 'discussion', selectedIds: discussionIds };
        break;
      default:
        return;
    }

    const evalResult = evaluateSubmission(currentQuestion, submission);
    const starsEarned = onRecordAnswer(currentQuestion.id, evalResult.isCorrect);
    setResultsMap((prev) => ({
      ...prev,
      [currentQuestion.id]: { submission, evalResult, starsEarned },
    }));
  };

  const handleToggleMulti = (key: string) => {
    if (isSubmitted) return;
    setMultiKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleClickWordTile = (word: string) => {
    if (isSubmitted) return;
    // If word is already placed in a blank, remove it from that blank
    const placedIdx = blanks.indexOf(word);
    if (placedIdx !== -1) {
      const next = [...blanks];
      next[placedIdx] = null;
      setBlanks(next);
      setActiveBlankIdx(placedIdx);
      return;
    }

    // Place into activeBlankIdx (or first empty slot)
    const targetIdx =
      blanks[activeBlankIdx] === null
        ? activeBlankIdx
        : blanks.findIndex((b) => b === null);
    const idxToFill = targetIdx !== -1 ? targetIdx : activeBlankIdx;
    const next = [...blanks];
    next[idxToFill] = word;
    setBlanks(next);
    const nextEmpty = next.findIndex((b) => b === null);
    if (nextEmpty !== -1) setActiveBlankIdx(nextEmpty);
  };

  const handleClickBlankSlot = (idx: number) => {
    if (isSubmitted) return;
    if (blanks[idx] !== null) {
      const next = [...blanks];
      next[idx] = null;
      setBlanks(next);
    }
    setActiveBlankIdx(idx);
  };

  const handleClickMatchLeft = (leftId: string) => {
    if (isSubmitted) return;
    setActiveLeftId(leftId);
  };

  const handleClickMatchRight = (rightId: string) => {
    if (isSubmitted) return;
    if (!activeLeftId) {
      // If clicking an already-paired right item without activeLeftId, unpair it
      const existingLeft = Object.keys(matchPairs).find((k) => matchPairs[k] === rightId);
      if (existingLeft) {
        const next = { ...matchPairs };
        delete next[existingLeft];
        setMatchPairs(next);
      }
      return;
    }

    const next = { ...matchPairs };
    // Ensure 1-to-1: remove rightId if used by another leftId
    for (const k of Object.keys(next)) {
      if (next[k] === rightId) delete next[k];
    }
    next[activeLeftId] = rightId;
    setMatchPairs(next);
    setActiveLeftId(null);
  };

  const handleToggleDiscussion = (choiceId: string) => {
    if (isSubmitted) return;
    setDiscussionIds((prev) =>
      prev.includes(choiceId)
        ? prev.filter((id) => id !== choiceId)
        : [...prev, choiceId]
    );
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      const summary = questions.map((q) => {
        const r = resultsMap[q.id];
        return {
          questionId: q.id,
          isCorrect: r ? r.evalResult.isCorrect : false,
          starsEarned: r ? r.starsEarned : 0,
        };
      });
      onFinishSession(summary);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Slim Practice Header & Progress Bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>退出练习</span>
          </button>
          <span className="text-slate-300" aria-hidden="true">|</span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{sessionTitle}</p>
            <p className="text-xs text-slate-500 truncate">{sessionSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="w-32 sm:w-44 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-sm font-bold text-slate-800 font-mono-tabular whitespace-nowrap">
            第 {currentIndex + 1} / {questions.length} 题
          </span>
        </div>
      </div>

      {/* Main Two-Zone Educational Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Zone (7/12): Question & Pure Mouse-Click Interactive Controls */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
          {/* Clean Unboxed Metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="text-sky-700">{getQuestionTypeLabel(currentQuestion.type)}</span>
            <span aria-hidden="true">·</span>
            <span>{domainMeta.title}</span>
            <span aria-hidden="true">·</span>
            <span>核心概念：{currentQuestion.conceptTag}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">第 {currentQuestion.setNumber} 套第 {currentQuestion.orderInSet} 题</span>
          </div>

          {/* Question Prompt */}
          {currentQuestion.type !== 'fill' && (
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed">
              {currentQuestion.prompt}
            </h2>
          )}

          {/* 1. Single Choice / Boolean Renderer */}
          {(currentQuestion.type === 'single' || currentQuestion.type === 'boolean') && (
            <div
              className={`grid gap-3 ${
                currentQuestion.type === 'boolean' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
              }`}
            >
              {(currentQuestion.options ?? []).map((opt) => {
                const isSelected = singleKey === opt.key;
                const isRightOption = currentQuestion.correctKeys?.[0] === opt.key;

                let cardStyle =
                  'border-slate-200 bg-white text-slate-800 hover:border-sky-400 hover:bg-sky-50/40';
                if (!isSubmitted && isSelected) {
                  cardStyle = 'border-sky-600 bg-sky-50 text-sky-950 ring-1 ring-sky-600';
                } else if (isSubmitted && isRightOption) {
                  cardStyle = 'border-emerald-600 bg-emerald-50 text-emerald-950';
                } else if (isSubmitted && isSelected && !isRightOption) {
                  cardStyle = 'border-rose-500 bg-rose-50 text-rose-950';
                }

                return (
                  <button
                    key={opt.key}
                    type="button"
                    disabled={isSubmitted}
                    aria-pressed={isSelected}
                    onClick={() => setSingleKey(opt.key)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all flex items-start gap-3.5 min-h-[54px] cursor-pointer disabled:cursor-default ${cardStyle}`}
                  >
                    <span
                      className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold font-mono-tabular border ${
                        isSubmitted && isRightOption
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : isSubmitted && isSelected && !isRightOption
                            ? 'bg-rose-600 text-white border-rose-600'
                            : isSelected
                              ? 'bg-sky-600 text-white border-sky-600'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {opt.key}
                    </span>
                    <span className="text-base font-medium leading-snug pt-0.5 flex-1">
                      {opt.text}
                    </span>
                    {isSubmitted && isRightOption && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* 2. Multiple Choice Renderer */}
          {currentQuestion.type === 'multiple' && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-500">
                提示：这道题有多个正确答案，请把所有正确的选项都点选出来（当前已选{' '}
                <span className="font-mono-tabular text-sky-700">{multiKeys.length}</span> 项）
              </p>
              <div className="grid gap-3">
                {(currentQuestion.options ?? []).map((opt) => {
                  const isSelected = multiKeys.includes(opt.key);
                  const isRightOption = currentQuestion.correctKeys?.includes(opt.key);

                  let cardStyle =
                    'border-slate-200 bg-white text-slate-800 hover:border-sky-400 hover:bg-sky-50/40';
                  if (!isSubmitted && isSelected) {
                    cardStyle = 'border-sky-600 bg-sky-50 text-sky-950 ring-1 ring-sky-600';
                  } else if (isSubmitted && isRightOption) {
                    cardStyle = 'border-emerald-600 bg-emerald-50 text-emerald-950';
                  } else if (isSubmitted && isSelected && !isRightOption) {
                    cardStyle = 'border-rose-500 bg-rose-50 text-rose-950';
                  }

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      disabled={isSubmitted}
                      aria-pressed={isSelected}
                      onClick={() => handleToggleMulti(opt.key)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all flex items-start gap-3.5 min-h-[54px] cursor-pointer disabled:cursor-default ${cardStyle}`}
                    >
                      <span
                        className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold border ${
                          isSubmitted && isRightOption
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : isSubmitted && isSelected && !isRightOption
                              ? 'bg-rose-600 text-white border-rose-600'
                              : isSelected
                                ? 'bg-sky-600 text-white border-sky-600'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {isSelected ? <Check className="w-4 h-4" /> : opt.key}
                      </span>
                      <span className="text-base font-medium leading-snug pt-0.5 flex-1">
                        <span className="font-mono-tabular font-bold mr-1.5">{opt.key}.</span>
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Click-Tile Fill-in-Blank Renderer (ZERO keyboard typing!) */}
          {currentQuestion.type === 'fill' && currentQuestion.blankSegments && (
            <div className="space-y-6">
              <div className="text-lg sm:text-xl font-bold text-slate-900 leading-[2.2]">
                {currentQuestion.blankSegments.map((seg, idx) => (
                  <React.Fragment key={idx}>
                    <span>{seg}</span>
                    {idx < (currentQuestion.correctBlanks?.length ?? 0) && (
                      <button
                        type="button"
                        disabled={isSubmitted}
                        onClick={() => handleClickBlankSlot(idx)}
                        aria-label={`第 ${idx + 1} 空，${blanks[idx] ? `已选 ${blanks[idx]}` : '待填入'}`}
                        className={`inline-flex items-center justify-center min-w-[104px] px-3.5 py-1 mx-1.5 rounded-lg border-2 text-base font-bold align-baseline transition-all cursor-pointer disabled:cursor-default ${
                          isSubmitted
                            ? blanks[idx] === currentQuestion.correctBlanks?.[idx]
                              ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                              : 'bg-rose-50 border-rose-500 text-rose-800'
                            : activeBlankIdx === idx
                              ? 'bg-sky-50 border-sky-600 text-sky-900'
                              : blanks[idx]
                                ? 'bg-slate-100 border-slate-400 text-slate-900'
                                : 'bg-slate-50 border-dashed border-slate-300 text-slate-400'
                        }`}
                      >
                        {blanks[idx] ?? `第 ${idx + 1} 空`}
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Word Tile Bank */}
              <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-600">
                    词语百宝箱（用鼠标点击词卡填入空格，点已填空格可退回）
                  </p>
                  {!isSubmitted && blanks.some((b) => b !== null) && (
                    <button
                      type="button"
                      onClick={() => {
                        setBlanks(new Array(currentQuestion.correctBlanks?.length ?? 0).fill(null));
                        setActiveBlankIdx(0);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>清空重选</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {orderedWordBank.map((word) => {
                    const isUsed = blanks.includes(word);
                    return (
                      <button
                        key={word}
                        type="button"
                        disabled={isSubmitted}
                        aria-pressed={isUsed}
                        onClick={() => handleClickWordTile(word)}
                        className={`px-4 py-2.5 rounded-xl border text-sm sm:text-base font-bold transition-all cursor-pointer disabled:cursor-default min-h-[44px] ${
                          isUsed
                            ? 'bg-sky-600 border-sky-600 text-white'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-sky-400 hover:bg-sky-50'
                        }`}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 4. Click-to-Match Renderer with SVG Connector */}
          {currentQuestion.type === 'match' &&
            currentQuestion.leftItems &&
            currentQuestion.rightItems && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>先点左边一项，再点右边对应的一项就能连线（已配对 {Object.keys(matchPairs).length}/4）</span>
                  {!isSubmitted && Object.keys(matchPairs).length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setMatchPairs({});
                        setActiveLeftId(null);
                      }}
                      className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>重新配对</span>
                    </button>
                  )}
                </div>

                <div className="relative flex items-stretch gap-2 sm:gap-0">
                  {/* Left Items */}
                  <div className="flex-1 flex flex-col gap-3">
                    {currentQuestion.leftItems.map((left, idx) => {
                      const pairedRightId = matchPairs[left.id];
                      const isActive = activeLeftId === left.id;
                      const color = PAIR_COLORS[idx % PAIR_COLORS.length];
                      const isCorrectPair =
                        isSubmitted &&
                        currentQuestion.correctMatches?.[left.id] === pairedRightId;

                      return (
                        <button
                          key={left.id}
                          type="button"
                          disabled={isSubmitted}
                          onClick={() => handleClickMatchLeft(left.id)}
                          className={`h-16 px-3.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer disabled:cursor-default ${
                            isSubmitted
                              ? isCorrectPair
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                                : 'border-rose-500 bg-rose-50 text-rose-950'
                              : isActive
                                ? 'border-sky-600 bg-sky-50 ring-2 ring-sky-500/30 text-slate-900'
                                : pairedRightId
                                  ? `${color.badge}`
                                  : 'border-slate-200 bg-white hover:border-sky-400 text-slate-800'
                          }`}
                        >
                          <span className="text-xs sm:text-sm font-semibold leading-snug line-clamp-2">
                            <span className="font-mono-tabular font-bold mr-1">{left.id}.</span>
                            {left.text}
                          </span>
                          {pairedRightId && (
                            <span className="shrink-0 text-xs font-mono-tabular font-bold px-2 py-0.5 rounded bg-white/80 border border-current/20">
                              → {pairedRightId}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Center Mathematical SVG Connectors (Desktop/Tablet) */}
                  <div className="hidden sm:block w-16 md:w-20 shrink-0" aria-hidden="true">
                    <svg viewBox="0 0 80 292" className="w-full h-[292px]" preserveAspectRatio="none">
                      {currentQuestion.leftItems.map((left, leftIdx) => {
                        const rightId = matchPairs[left.id];
                        if (!rightId) return null;
                        const rightIdx = currentQuestion.rightItems!.findIndex(
                          (r) => r.id === rightId
                        );
                        if (rightIdx === -1) return null;
                        // Row height 64 + gap 12 = 76; center = idx * 76 + 32
                        const y1 = leftIdx * 76 + 32;
                        const y2 = rightIdx * 76 + 32;
                        const isRight =
                          currentQuestion.correctMatches?.[left.id] === rightId;
                        const strokeColor = isSubmitted
                          ? isRight
                            ? '#059669'
                            : '#DC2626'
                          : PAIR_COLORS[leftIdx % PAIR_COLORS.length].line;

                        return (
                          <g key={left.id}>
                            <path
                              d={`M 4 ${y1} C 36 ${y1}, 44 ${y2}, 76 ${y2}`}
                              fill="none"
                              stroke={strokeColor}
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                            <circle cx="4" cy={y1} r="4" fill={strokeColor} />
                            <circle cx="76" cy={y2} r="4" fill={strokeColor} />
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Right Items */}
                  <div className="flex-1 flex flex-col gap-3">
                    {currentQuestion.rightItems.map((right) => {
                      const pairedLeftIdx = currentQuestion.leftItems!.findIndex(
                        (l) => matchPairs[l.id] === right.id
                      );
                      const pairedLeft =
                        pairedLeftIdx !== -1 ? currentQuestion.leftItems![pairedLeftIdx] : null;
                      const color =
                        pairedLeftIdx !== -1
                          ? PAIR_COLORS[pairedLeftIdx % PAIR_COLORS.length]
                          : null;
                      const isCorrectPair =
                        isSubmitted &&
                        pairedLeft &&
                        currentQuestion.correctMatches?.[pairedLeft.id] === right.id;

                      return (
                        <button
                          key={right.id}
                          type="button"
                          disabled={isSubmitted}
                          onClick={() => handleClickMatchRight(right.id)}
                          className={`h-16 px-3.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer disabled:cursor-default ${
                            isSubmitted && pairedLeft
                              ? isCorrectPair
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                                : 'border-rose-500 bg-rose-50 text-rose-950'
                              : color
                                ? color.badge
                                : activeLeftId
                                  ? 'border-sky-300 bg-sky-50/30 hover:border-sky-600 text-slate-800'
                                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                          }`}
                        >
                          <span className="text-xs sm:text-sm font-semibold leading-snug line-clamp-2">
                            <span className="font-mono-tabular font-bold mr-1">{right.id}.</span>
                            {right.text}
                          </span>
                          {pairedLeft && (
                            <span className="shrink-0 text-xs font-mono-tabular font-bold px-2 py-0.5 rounded bg-white/80 border border-current/20">
                              {pairedLeft.id}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          {/* 5. Discussion Guided Key-Point Picker (ZERO typing!) */}
          {currentQuestion.type === 'discussion' && (
            <div className="space-y-5">
              {currentQuestion.discussionScenario && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <p className="text-xs font-bold text-slate-500">故事小场景</p>
                  <p className="text-sm text-slate-800 leading-relaxed">
                    {currentQuestion.discussionScenario}
                  </p>
                  {currentQuestion.discussionSubQuestions && (
                    <ul className="pt-2 border-t border-slate-200 space-y-1 text-xs text-slate-600">
                      {currentQuestion.discussionSubQuestions.map((sq, i) => (
                        <li key={i}>
                          {i + 1}. {sq}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-slate-600">
                  点选所有“聪明又安全的好做法卡片”（不用打字，避开偷懒或危险想法）：
                </p>

                <div className="grid gap-2.5">
                  {orderedDiscussionChoices.map((choice) => {
                    const isSelected = discussionIds.includes(choice.id);
                    let cardStyle =
                      'border-slate-200 bg-white hover:border-sky-400 text-slate-800';
                    if (!isSubmitted && isSelected) {
                      cardStyle = 'border-sky-600 bg-sky-50 text-sky-950 ring-1 ring-sky-600';
                    } else if (isSubmitted) {
                      if (choice.isWise && isSelected) {
                        cardStyle = 'border-emerald-600 bg-emerald-50 text-emerald-950';
                      } else if (choice.isWise && !isSelected) {
                        cardStyle = 'border-amber-400 bg-amber-50 text-amber-950';
                      } else if (!choice.isWise && isSelected) {
                        cardStyle = 'border-rose-500 bg-rose-50 text-rose-950';
                      } else {
                        cardStyle = 'border-slate-200 bg-slate-50 text-slate-500';
                      }
                    }

                    return (
                      <button
                        key={choice.id}
                        type="button"
                        disabled={isSubmitted}
                        aria-pressed={isSelected}
                        onClick={() => handleToggleDiscussion(choice.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer disabled:cursor-default space-y-1.5 ${cardStyle}`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`shrink-0 mt-0.5 w-5 h-5 rounded flex items-center justify-center border text-xs font-bold ${
                              isSelected
                                ? 'bg-sky-600 border-sky-600 text-white'
                                : 'bg-white border-slate-300 text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </span>
                          <span className="text-sm font-medium leading-snug flex-1">
                            {choice.text}
                          </span>
                        </div>
                        {isSubmitted && (
                          <p className="pl-8 text-xs font-medium opacity-90">
                            {choice.isWise ? '✓ 好做法：' : '✕ 注意避坑：'}
                            {choice.feedback}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              上一题
            </button>

            {!isSubmitted ? (
              <button
                key="submit-btn"
                type="button"
                disabled={!canSubmit}
                onClick={handleSubmit}
                className="px-6 py-2.5 text-sm font-bold text-white bg-sky-600 rounded-xl hover:bg-sky-700 disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed active:scale-[0.98] transition-transform cursor-pointer"
              >
                提交答案看讲解
              </button>
            ) : (
              <button
                key="next-btn"
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-sky-600 rounded-xl hover:bg-sky-700 active:scale-[0.98] transition-transform cursor-pointer"
              >
                <span>
                  {currentIndex < questions.length - 1
                    ? '下一题'
                    : includeLabAtEnd
                      ? '完成本套并查看成绩'
                      : '查看练习成果'}
                </span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </section>

        {/* Right Zone (5/12): 小老师通俗逻辑小课堂 */}
        <aside className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-5">
          {!submittedEntry ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Lightbulb className="w-4 h-4 text-amber-500" aria-hidden="true" />
                <span>小老师审题小提示</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                正在挑战知识点：<strong className="text-slate-900">{currentQuestion.conceptTag}</strong>。
                慢慢读完题目和每一个选项，用鼠标点击你认为最合理的答案吧！
              </p>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600 leading-relaxed">
                <p className="font-semibold text-slate-800">做题小锦囊：</p>
                <p>1. 遇到“永远不会出错”“任何条件下都……”这种太绝对的话，要多留个心眼。</p>
                <p>2. 只要看到姓名、住址、身份证、银行卡号，一定要牢记“保护隐私不上传”。</p>
                <p>3. 提交后这里会立刻出现通俗故事讲解和排雷秘籍！</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Dual-coded Result Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  submittedEntry.evalResult.isCorrect
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}
              >
                {submittedEntry.evalResult.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                )}
                <div className="space-y-1">
                  <p className="text-sm font-bold">
                    {submittedEntry.evalResult.isCorrect
                      ? `✓ 答对啦！+${submittedEntry.starsEarned} 颗星`
                      : `✕ 再听听小老师讲解（已记入错题本）`}
                  </p>
                  <p className="text-xs leading-relaxed opacity-90">
                    {submittedEntry.evalResult.detailMessage}
                  </p>
                </div>
              </div>

              {/* Reference Answer */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">参考答案</p>
                <p className="text-base font-extrabold text-slate-900">
                  {currentQuestion.acceptedDisplayAnswer ?? currentQuestion.rawAnswerLabel}
                </p>
              </div>

              {/* 1. 一句话秒懂 */}
              <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>一句话秒懂</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                  {currentQuestion.kidSummary}
                </p>
              </div>

              {/* 2. 生活小比喻 & 逻辑推理 */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <BookOpen className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
                  <span>生活小比喻 · 逻辑讲明白</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {currentQuestion.kidAnalogy}
                </p>
              </div>

              {/* 3. 易错点排雷 */}
              <div className="space-y-1.5 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                  <span>易错点排雷</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {currentQuestion.wrongTips}
                </p>
              </div>

              {/* Reference Essay for Discussion Questions */}
              {currentQuestion.referenceEssay && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <p className="text-xs font-bold text-slate-700">竞赛参考作答（家长可陪孩子口头聊一聊）</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {currentQuestion.referenceEssay}
                  </p>
                </div>
              )}

              {/* Collapsible Raw Competition Parsing */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  aria-expanded={showRawExplanation}
                  onClick={() => setShowRawExplanation((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <span>查看原题官方解析</span>
                  {showRawExplanation ? (
                    <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </button>
                {showRawExplanation && (
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {currentQuestion.rawExplanation}
                  </p>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
