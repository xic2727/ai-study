import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Cpu } from 'lucide-react';
import { DOMAIN_MAP, KNOWLEDGE_DOMAINS } from '../data/domains';
import { ALL_QUESTIONS, MOCK_SETS } from '../data/questions';
import { KnowledgeDomain, LearningProgress, QuestionType } from '../types/quiz';
import { getQuestionTypeLabel } from '../utils/quizEngine';

interface SetsAndTopicsViewProps {
  progress: LearningProgress;
  onStartSet: (setNumber: number) => void;
  onStartSingleQuestion: (questionId: string, listTitle: string) => void;
  onStartFilteredList: (questionIds: string[], title: string, subtitle: string) => void;
  onOpenLab: () => void;
}

export const SetsAndTopicsView: React.FC<SetsAndTopicsViewProps> = ({
  progress,
  onStartSet,
  onStartSingleQuestion,
  onStartFilteredList,
  onOpenLab,
}) => {
  const [tab, setTab] = useState<'sets' | 'bank'>('sets');
  const [domainFilter, setDomainFilter] = useState<KnowledgeDomain | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<QuestionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unseen' | 'wrong' | 'mastered'>('all');

  const filteredQuestions = useMemo(() => {
    return ALL_QUESTIONS.filter((q) => {
      if (domainFilter !== 'all' && q.domain !== domainFilter) return false;
      if (typeFilter !== 'all' && q.type !== typeFilter) return false;
      const rec = progress.records[q.id];
      if (statusFilter === 'unseen' && rec && rec.attempts > 0) return false;
      if (statusFilter === 'wrong' && !rec?.inWrongBank) return false;
      if (statusFilter === 'mastered' && !rec?.mastered) return false;
      return true;
    });
  }, [domainFilter, typeFilter, statusFilter, progress.records]);

  const typeOptions: { id: QuestionType | 'all'; label: string }[] = [
    { id: 'all', label: '全部题型' },
    { id: 'single', label: '单选题' },
    { id: 'multiple', label: '多选题' },
    { id: 'boolean', label: '判断题' },
    { id: 'fill', label: '点词填空' },
    { id: 'match', label: '点击连线' },
    { id: 'discussion', label: '思辨点选' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">竞赛模拟套卷与全量题库</h1>
          <p className="text-sm text-slate-600 mt-1">
            完整收录 8 套竞赛题目（共 120 道基础与思辨题 + 40分智能台灯仿真实验）
          </p>
        </div>

        {/* Interactive Segmented Tab Control */}
        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTab('sets')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              tab === 'sets' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            8 套综合模拟卷
          </button>
          <button
            type="button"
            onClick={() => setTab('bank')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              tab === 'bank' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            按知识点筛选 ({ALL_QUESTIONS.length}题)
          </button>
        </div>
      </div>

      {tab === 'sets' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {MOCK_SETS.map((s) => {
              const setQs = ALL_QUESTIONS.filter((q) => q.setNumber === s.setNumber);
              const masteredInSet = setQs.filter((q) => progress.records[q.id]?.mastered).length;
              const setRecord = progress.completedSets[s.setNumber];

              return (
                <div
                  key={s.setNumber}
                  className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>模拟套卷 {s.setNumber}</span>
                      <span className="font-mono-tabular">
                        {masteredInSet}/{setQs.length} 已掌握
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">{s.title}</h2>
                    <p className="text-xs text-slate-600 leading-relaxed">{s.focusSummary}</p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-mono-tabular">
                      <span>{s.subtitle}</span>
                      <span>
                        {setRecord ? `最佳 ${setRecord.bestAccuracy}%` : '待挑战'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onStartSet(s.setNumber)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold text-white bg-sky-600 rounded-xl hover:bg-sky-700 transition-colors cursor-pointer"
                    >
                      <span>{setRecord ? '再刷一遍本套' : '开始做这一套'}</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dedicated Hardware Lab Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 shrink-0">
                <Cpu className="w-6 h-6" aria-hidden="true" />
              </span>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  第 16 题专项：Arduino 智能护眼台灯虚拟实验（40分）
                </h3>
                <p className="text-sm text-slate-600">
                  8套模拟卷的压轴实践题均为智能护眼台灯连线与图形化编程，已做成专门的可视化点击实验台，做完任意套卷都可以随时进来演练！
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenLab}
              className="px-5 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              打开台灯实验
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Interactive Filter Toolbar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 mr-1">知识专题：</span>
              <button
                type="button"
                onClick={() => setDomainFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border whitespace-nowrap cursor-pointer ${
                  domainFilter === 'all'
                    ? 'bg-sky-600 border-sky-600 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                全部专题
              </button>
              {KNOWLEDGE_DOMAINS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDomainFilter(d.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border whitespace-nowrap cursor-pointer ${
                    domainFilter === d.id
                      ? 'bg-sky-600 border-sky-600 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {d.shortTitle}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 mr-1">题型：</span>
                {typeOptions.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTypeFilter(t.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border whitespace-nowrap cursor-pointer ${
                      typeFilter === t.id
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 mr-1">状态：</span>
                {(
                  [
                    { id: 'all', label: '全部' },
                    { id: 'unseen', label: '未做' },
                    { id: 'wrong', label: '做错待练' },
                    { id: 'mastered', label: '已掌握' },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border whitespace-nowrap cursor-pointer ${
                      statusFilter === st.id
                        ? 'bg-sky-100 border-sky-300 text-sky-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filtered Action Header */}
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-slate-700 font-mono-tabular">
              共筛选出 {filteredQuestions.length} 道题目
            </p>
            {filteredQuestions.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  onStartFilteredList(
                    filteredQuestions.slice(0, 15).map((q) => q.id),
                    '专题筛选练习',
                    `已选 ${Math.min(15, filteredQuestions.length)} 道题目`
                  )
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-sky-600 rounded-xl hover:bg-sky-700 cursor-pointer whitespace-nowrap"
              >
                <span>练这批题目 ({Math.min(15, filteredQuestions.length)}题)</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Question List */}
          {filteredQuestions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
              当前筛选条件下没有题目，试试切换其他筛选条件吧！
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredQuestions.map((q) => {
                const rec = progress.records[q.id];
                const dMeta = DOMAIN_MAP[q.domain];
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() =>
                      onStartSingleQuestion(q.id, `单题精练 · ${q.conceptTag}`)
                    }
                    className="text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-sky-400 hover:bg-sky-50/20 transition-all flex flex-col justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-sky-700">{getQuestionTypeLabel(q.type)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{dMeta.shortTitle}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{q.conceptTag}</span>
                      </div>
                      <span className="shrink-0 font-mono-tabular">
                        {rec?.mastered ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            已掌握
                          </span>
                        ) : rec?.inWrongBank ? (
                          <span className="text-amber-700">待巩固</span>
                        ) : (
                          '未练习'
                        )}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                      {q.prompt}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
