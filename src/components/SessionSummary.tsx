import React from 'react';
import { ArrowRight, CheckCircle2, Cpu, RotateCcw, Star, XCircle } from 'lucide-react';
import { QUESTIONS_BY_ID } from '../data/questions';
import { SessionResult } from '../types/quiz';

interface SessionSummaryProps {
  title: string;
  results: SessionResult[];
  includeLabOption?: boolean;
  onRetryWrong: (wrongIds: string[]) => void;
  onContinueSmart: () => void;
  onOpenLab: () => void;
  onBackHome: () => void;
  onInspectQuestion: (questionId: string) => void;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  title,
  results,
  includeLabOption,
  onRetryWrong,
  onContinueSmart,
  onOpenLab,
  onBackHome,
  onInspectQuestion,
}) => {
  const total = results.length;
  const correctCount = results.filter((r) => r.isCorrect).length;
  const accuracyPct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const starsTotal = results.reduce((sum, r) => sum + r.starsEarned, 0);
  const wrongIds = results.filter((r) => !r.isCorrect).map((r) => r.questionId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-sky-700">本次训练完成</p>
            <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-slate-500">本轮正确率</p>
              <p className="text-2xl font-extrabold text-slate-900 font-mono-tabular">
                {accuracyPct}%
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">收获星星</p>
              <p className="text-2xl font-extrabold text-amber-600 font-mono-tabular flex items-center gap-1">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" aria-hidden="true" />
                +{starsTotal}
              </p>
            </div>
          </div>
        </div>

        {/* Question-by-question clickable review */}
        <div className="space-y-3">
          <p className="text-sm font-bold text-slate-900">
            本轮答题清单（共 {total} 题，答对 {correctCount} 题 · 点击任意题目可回看小老师讲解）
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {results.map((r, idx) => {
              const q = QUESTIONS_BY_ID[r.questionId];
              if (!q) return null;
              return (
                <button
                  key={r.questionId}
                  type="button"
                  onClick={() => onInspectQuestion(r.questionId)}
                  className={`text-left p-3.5 rounded-xl border flex items-start gap-3 transition-colors cursor-pointer ${
                    r.isCorrect
                      ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50'
                      : 'border-amber-200 bg-amber-50/50 hover:bg-amber-50'
                  }`}
                >
                  {r.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  ) : (
                    <XCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-500 font-mono-tabular">
                      第 {idx + 1} 题 · {q.conceptTag}
                    </p>
                    <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
                      {q.prompt}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackHome}
            className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
          >
            返回学习大厅
          </button>

          <div className="flex flex-wrap items-center gap-3">
            {includeLabOption && (
              <button
                type="button"
                onClick={onOpenLab}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 cursor-pointer"
              >
                <Cpu className="w-4 h-4" aria-hidden="true" />
                <span>继续挑战第16题台灯实验</span>
              </button>
            )}

            {wrongIds.length > 0 && (
              <button
                type="button"
                onClick={() => onRetryWrong(wrongIds)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-amber-900 bg-amber-100 border border-amber-300 rounded-xl hover:bg-amber-200 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>重练本轮错题 ({wrongIds.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={onContinueSmart}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-sky-600 rounded-xl hover:bg-sky-700 cursor-pointer"
            >
              <span>再来一组智能练习</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
