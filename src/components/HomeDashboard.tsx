import React from 'react';
import {
  ArrowRight,
  Brain,
  Compass,
  Cpu,
  Eye,
  Flame,
  Palette,
  RotateCcw,
  ShieldCheck,
  Star,
  Target,
} from 'lucide-react';
import { DOMAIN_MAP, KNOWLEDGE_DOMAINS } from '../data/domains';
import { MOCK_SETS } from '../data/questions';
import { KnowledgeDomain, LearningProgress } from '../types/quiz';
import { ProgressStats } from '../utils/quizEngine';

interface HomeDashboardProps {
  progress: LearningProgress;
  stats: ProgressStats;
  onStartSmartPractice: () => void;
  onStartDomainPractice: (domain: KnowledgeDomain) => void;
  onStartWrongPractice: () => void;
  onStartSetPractice: (setNumber: number) => void;
  onOpenSets: () => void;
  onOpenLab: () => void;
}

const DomainIcon: React.FC<{ name: string; className?: string }> = ({
  name,
  className = 'w-5 h-5',
}) => {
  switch (name) {
    case 'eye':
      return <Eye className={className} aria-hidden="true" />;
    case 'brain':
      return <Brain className={className} aria-hidden="true" />;
    case 'palette':
      return <Palette className={className} aria-hidden="true" />;
    case 'compass':
      return <Compass className={className} aria-hidden="true" />;
    default:
      return <ShieldCheck className={className} aria-hidden="true" />;
  }
};

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  progress,
  stats,
  onStartSmartPractice,
  onStartDomainPractice,
  onStartWrongPractice,
  onStartSetPractice,
  onOpenSets,
  onOpenLab,
}) => {
  const weakestMeta = DOMAIN_MAP[stats.weakestDomain.domain];
  const hasWrong = stats.wrongBankCount > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Hero Two-Column Split: Learning Status + Smart Recommendation */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <p className="text-xs font-semibold text-sky-700 tracking-wide">
                小学二年级 AI 通识竞赛 · 全鼠标点击闯关
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight [text-wrap:balance]">
                每天 10 道聪明题，听懂 AI 核心小原理
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                不用打字，全部题目点一点就能选答案。每做完一题，小老师都会用生活中的小故事给你讲明白为什么选它！
              </p>
            </div>

            {/* Friendly Vector Robot Buddy SVG */}
            <div className="hidden sm:flex shrink-0 items-center justify-center w-28 h-28 bg-sky-50 border border-sky-100 rounded-2xl">
              <svg
                viewBox="0 0 120 120"
                className="w-22 h-22"
                aria-hidden="true"
              >
                <line x1="60" y1="14" x2="60" y2="26" stroke="#0284C7" strokeWidth="4" strokeLinecap="round" />
                <circle cx="60" cy="12" r="5" fill="#EAB308" />
                <rect x="26" y="26" width="68" height="54" rx="16" fill="#FFFFFF" stroke="#0284C7" strokeWidth="4" />
                <rect x="36" y="38" width="48" height="26" rx="10" fill="#0F172A" />
                <circle cx="49" cy="51" r="5" fill="#38BDF8" />
                <circle cx="71" cy="51" r="5" fill="#38BDF8" />
                <path d="M51 70 Q60 76 69 70" fill="none" stroke="#0284C7" strokeWidth="3.5" strokeLinecap="round" />
                <rect x="16" y="44" width="10" height="18" rx="4" fill="#BAE6FD" stroke="#0284C7" strokeWidth="3" />
                <rect x="94" y="44" width="10" height="18" rx="4" fill="#BAE6FD" stroke="#0284C7" strokeWidth="3" />
                <rect x="38" y="84" width="44" height="22" rx="8" fill="#E0F2FE" stroke="#0284C7" strokeWidth="3.5" />
                <circle cx="60" cy="95" r="4" fill="#059669" />
              </svg>
            </div>
          </div>

          {/* Primary Action & Inline Progress */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 max-w-md space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>总题库掌握进度</span>
                <span className="font-mono-tabular text-slate-900">
                  {stats.masteredCount} / {stats.totalQuestions} 题 ({stats.overallMasteryPct}%)
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-600 rounded-full transition-all duration-300"
                  style={{ width: `${stats.overallMasteryPct}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={onStartSmartPractice}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-white bg-sky-600 rounded-xl hover:bg-sky-700 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
              >
                <span>开始智能靶向练习</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Hero Column: Smart Next-Step Target */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Target className="w-4 h-4 text-sky-600" aria-hidden="true" />
              <span>智能学习建议</span>
            </div>

            {hasWrong ? (
              <>
                <h2 className="text-lg font-bold text-slate-900">
                  先消灭这 {stats.wrongBankCount} 道错题吧！
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  错题本里还留着做错过的题目。把它们重新做对一次，就能移出错题本并拿回双倍自信！
                </p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-slate-900">
                  推荐专攻：{weakestMeta.title}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {weakestMeta.description} 当前掌握度为{' '}
                  <span className="font-mono-tabular font-semibold text-slate-900">
                    {stats.weakestDomain.masteryPct}%
                  </span>
                  ，点下面就能练这一专题！
                </p>
              </>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            {hasWrong ? (
              <button
                type="button"
                onClick={onStartWrongPractice}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>一键重练错题 ({stats.wrongBankCount}题)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStartDomainPractice(weakestMeta.id)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-sky-800 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100 transition-colors cursor-pointer"
              >
                <span>练一练「{weakestMeta.shortTitle}」</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Full-width 4-column KPI Strip below Hero Split */}
      <section aria-label="学习数据统计" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>累计小星星</span>
            <Star className="w-4 h-4 text-amber-500" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 font-mono-tabular">
            {progress.stars}
          </p>
          <p className="mt-1 text-xs text-slate-500">答对每题 +10 颗星</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>当前连对记录</span>
            <Flame className="w-4 h-4 text-sky-600" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 font-mono-tabular">
            {progress.streak} <span className="text-sm font-semibold text-slate-500">/ 最高 {progress.bestStreak}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">连续答对不断档</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>历史正确率</span>
            <Target className="w-4 h-4 text-emerald-600" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 font-mono-tabular">
            {progress.totalAnswered > 0 ? `${stats.accuracyPct}%` : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500 font-mono-tabular">
            共作答 {progress.totalAnswered} 次
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>智能台灯实验</span>
            <Cpu className="w-4 h-4 text-indigo-600" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 font-mono-tabular">
            {progress.lab.bestScore} <span className="text-sm font-semibold text-slate-500">/ 40 分</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {progress.lab.completed ? '已满分通关' : '点击电路与积木可挑战'}
          </p>
        </div>
      </section>

      {/* 5 AI Knowledge Domains */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">五大 AI 核心知识专题</h2>
            <p className="text-sm text-slate-600 mt-1">
              点击任意专题卡片，直接开始针对这一类知识点的强化训练
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {KNOWLEDGE_DOMAINS.map((meta) => {
            const dStat = stats.domainStats.find((d) => d.domain === meta.id)!;
            return (
              <button
                key={meta.id}
                type="button"
                onClick={() => onStartDomainPractice(meta.id)}
                className="text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-sky-400 hover:bg-sky-50/20 transition-all flex flex-col justify-between cursor-pointer group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`p-2 rounded-lg border ${meta.softBgClass} ${meta.accentClass}`}>
                      <DomainIcon name={meta.iconName} />
                    </span>
                    <span className="text-xs font-mono-tabular font-semibold text-slate-500">
                      {dStat.mastered}/{dStat.total} 题
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                    {meta.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">{meta.subtitle}</p>
                </div>

                <div className="mt-5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {dStat.wrongCount > 0 ? `有 ${dStat.wrongCount} 题待巩固` : '掌握度'}
                    </span>
                    <span className="font-mono-tabular font-semibold text-slate-700">
                      {dStat.masteryPct}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${meta.barClass}`}
                      style={{ width: `${dStat.masteryPct}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Bottom Split: 8 Mock Sets + Hardware Simulation Lab */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">竞赛全真模拟套卷（共 8 套）</h2>
                <p className="text-xs text-slate-500 mt-1">
                  每套完整还原竞赛题型：单选 · 多选 · 判断 · 点词填空 · 连线 · 思辨 · 台灯实验
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenSets}
                className="text-xs font-semibold text-sky-700 hover:text-sky-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                查看全部题库 →
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {MOCK_SETS.map((s) => {
                const done = progress.completedSets[s.setNumber];
                return (
                  <button
                    key={s.setNumber}
                    type="button"
                    onClick={() => onStartSetPractice(s.setNumber)}
                    className="text-left p-3.5 rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/40 transition-all cursor-pointer"
                  >
                    <p className="text-sm font-bold text-slate-900">第 {s.setNumber} 套</p>
                    <p className="mt-1 text-xs text-slate-500 font-mono-tabular">
                      {done ? `最高 ${done.bestAccuracy}%` : '未完成'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-indigo-700">
              40 分压轴大题 · 交互式电路与积木
            </p>
            <h2 className="text-lg font-bold text-slate-900">
              智能护眼台灯仿真实验室
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              每套竞赛压轴大题都在这里！用鼠标点选引脚连线（A0、PWM 6、D5）和图形化积木块，还能拖动光线滑块亲眼看台灯亮灭和蜂鸣器提醒！
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <span className="text-xs font-mono-tabular text-slate-500">
              最佳得分：{progress.lab.bestScore} / 40 分
            </span>
            <button
              type="button"
              onClick={onOpenLab}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>进入台灯实验室</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
