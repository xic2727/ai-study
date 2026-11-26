import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, RotateCcw, Trash2 } from 'lucide-react';
import { DOMAIN_MAP, KNOWLEDGE_DOMAINS } from '../data/domains';
import { QUESTIONS_BY_ID } from '../data/questions';
import { LearningProgress } from '../types/quiz';
import { getQuestionTypeLabel, ProgressStats } from '../utils/quizEngine';

interface WrongBookViewProps {
  progress: LearningProgress;
  stats: ProgressStats;
  onStartWrongPractice: () => void;
  onPracticeSingleQuestion: (questionId: string) => void;
  onResetProgress: () => void;
}

export const WrongBookView: React.FC<WrongBookViewProps> = ({
  progress,
  stats,
  onStartWrongPractice,
  onPracticeSingleQuestion,
  onResetProgress,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  const wrongQuestions = stats.wrongQuestionIds
    .map((id) => QUESTIONS_BY_ID[id])
    .filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">错题巩固营与进度追踪</h1>
          <p className="text-sm text-slate-600 mt-1">
            每道做错的题都会自动留在这里，重新答对一次就能顺利毕业移出！
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>重置学习记录</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-1.5">
              <span className="text-xs font-semibold text-rose-900">确定清空所有进度？</span>
              <button
                type="button"
                onClick={() => {
                  onResetProgress();
                  setConfirmReset(false);
                }}
                className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700 cursor-pointer"
              >
                确定清空
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg cursor-pointer"
              >
                取消
              </button>
            </div>
          )}

          {wrongQuestions.length > 0 && (
            <button
              type="button"
              onClick={onStartWrongPractice}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-sky-600 rounded-xl hover:bg-sky-700 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>一键重练全部错题 ({wrongQuestions.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Domain Progress Table */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">五大知识专题掌握明细</h2>
          <span className="text-xs font-mono-tabular text-slate-500">
            总掌握 {stats.masteredCount} / {stats.totalQuestions} 题 ({stats.overallMasteryPct}%)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-6">知识专题</th>
                <th className="py-3 px-4 text-right">总题数</th>
                <th className="py-3 px-4 text-right">已练过</th>
                <th className="py-3 px-4 text-right">已掌握</th>
                <th className="py-3 px-4 text-right">错题数</th>
                <th className="py-3 px-6 text-right">掌握度</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {KNOWLEDGE_DOMAINS.map((meta) => {
                const st = stats.domainStats.find((d) => d.domain === meta.id)!;
                return (
                  <tr key={meta.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      {meta.title}
                      <span className="block text-xs font-normal text-slate-500">{meta.subtitle}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular text-slate-700">{st.total}</td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular text-slate-700">{st.attempted}</td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular text-emerald-700 font-semibold">{st.mastered}</td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular text-amber-700 font-semibold">{st.wrongCount}</td>
                    <td className="py-3.5 px-6 text-right font-mono-tabular font-bold text-slate-900">{st.masteryPct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Wrong Questions List */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">
          当前错题本（{wrongQuestions.length} 题）
        </h2>

        {wrongQuestions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" aria-hidden="true" />
            <p className="text-base font-bold text-slate-900">太棒了，错题本现在干干净净！</p>
            <p className="text-sm text-slate-500">
              去练习大厅做几道新题，或者挑战一套模拟卷吧。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wrongQuestions.map((q) => {
              const rec = progress.records[q.id];
              const dMeta = DOMAIN_MAP[q.domain];
              return (
                <div
                  key={q.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>
                        {getQuestionTypeLabel(q.type)} · {dMeta.shortTitle} · {q.conceptTag}
                      </span>
                      <span className="font-mono-tabular text-amber-700">
                        练习 {rec?.attempts ?? 1} 次
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-900 leading-relaxed">
                      {q.prompt}
                    </p>

                    <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-100 text-xs text-slate-700 leading-relaxed">
                      <span className="font-bold text-sky-800">一句话秒懂：</span>
                      {q.kidSummary}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">
                      参考答案：{q.acceptedDisplayAnswer ?? q.rawAnswerLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => onPracticeSingleQuestion(q.id)}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 cursor-pointer"
                    >
                      <span>单独重做</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
