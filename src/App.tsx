import { useEffect, useMemo, useState } from 'react';
import { HomeDashboard } from './components/HomeDashboard';
import { QuestionPlayer } from './components/QuestionPlayer';
import { SessionSummary } from './components/SessionSummary';
import { SetsAndTopicsView } from './components/SetsAndTopicsView';
import { SmartLampLab } from './components/SmartLampLab';
import { AppRoute, TopNav } from './components/TopNav';
import { WrongBookView } from './components/WrongBookView';
import { DOMAIN_MAP } from './data/domains';
import { ALL_QUESTIONS, QUESTIONS_BY_ID } from './data/questions';
import {
  KnowledgeDomain,
  LearningProgress,
  PracticeSession,
  SessionResult,
} from './types/quiz';
import {
  applyAnswerToProgress,
  applyLabResultToProgress,
  applySetCompletionToProgress,
  buildDomainPracticeIds,
  buildSetPracticeIds,
  buildSmartPracticeIds,
  clearProgress,
  computeProgressStats,
  loadProgress,
  saveProgress,
} from './utils/quizEngine';

export default function App() {
  const [route, setRoute] = useState<AppRoute>('home');
  const [progress, setProgress] = useState<LearningProgress>(() => loadProgress());
  const [activeSession, setActiveSession] = useState<PracticeSession | null>(null);
  const [activeSetNumber, setActiveSetNumber] = useState<number | null>(null);
  const [summaryData, setSummaryData] = useState<{
    title: string;
    results: SessionResult[];
    includeLabOption?: boolean;
  } | null>(null);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const stats = useMemo(
    () => computeProgressStats(ALL_QUESTIONS, progress),
    [progress]
  );

  const launchSmartPractice = () => {
    const ids = buildSmartPracticeIds(ALL_QUESTIONS, progress, 10);
    setSummaryData(null);
    setActiveSetNumber(null);
    setActiveSession({
      id: `smart-${Date.now()}`,
      mode: 'smart',
      title: '每日智能靶向练习',
      subtitle: '优先巩固错题与薄弱知识点（10题）',
      questionIds: ids,
    });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        launchSmartPractice();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const launchDomainPractice = (domain: KnowledgeDomain) => {
    const meta = DOMAIN_MAP[domain];
    const ids = buildDomainPracticeIds(ALL_QUESTIONS, progress, domain, 10);
    setSummaryData(null);
    setActiveSetNumber(null);
    setActiveSession({
      id: `domain-${domain}-${Date.now()}`,
      mode: 'domain',
      title: `专题特训：${meta.title}`,
      subtitle: meta.subtitle,
      questionIds: ids,
    });
  };

  const launchWrongPractice = () => {
    const ids = stats.wrongQuestionIds;
    if (ids.length === 0) {
      setRoute('wrong');
      return;
    }
    setSummaryData(null);
    setActiveSetNumber(null);
    setActiveSession({
      id: `wrong-${Date.now()}`,
      mode: 'wrong',
      title: '错题巩固营',
      subtitle: `把做错的 ${ids.length} 道题全部重做一遍`,
      questionIds: ids,
    });
  };

  const launchSetPractice = (setNumber: number) => {
    const ids = buildSetPracticeIds(ALL_QUESTIONS, setNumber);
    setSummaryData(null);
    setActiveSetNumber(setNumber);
    setActiveSession({
      id: `set-${setNumber}-${Date.now()}`,
      mode: 'set',
      title: `第 ${setNumber} 套综合模拟卷`,
      subtitle: '第 1~15 题全题型模拟（做完可直达第16题台灯实验）',
      questionIds: ids,
      includeLabAtEnd: true,
    });
  };

  const launchFilteredPractice = (
    questionIds: string[],
    title: string,
    subtitle: string
  ) => {
    setSummaryData(null);
    setActiveSetNumber(null);
    setActiveSession({
      id: `filtered-${Date.now()}`,
      mode: 'domain',
      title,
      subtitle,
      questionIds,
    });
  };

  const launchSingleQuestion = (questionId: string, title: string = '单题精练') => {
    setSummaryData(null);
    setActiveSetNumber(null);
    setActiveSession({
      id: `single-${questionId}-${Date.now()}`,
      mode: 'single_item',
      title,
      subtitle: '点击选项作答并查看小老师逻辑讲解',
      questionIds: [questionId],
    });
  };

  const handleRecordAnswer = (questionId: string, isCorrect: boolean): number => {
    let earned = 0;
    setProgress((prev) => {
      const { nextProgress, starsEarned } = applyAnswerToProgress(
        prev,
        questionId,
        isCorrect
      );
      earned = starsEarned;
      return nextProgress;
    });
    return earned || (isCorrect ? 10 : 2);
  };

  const handleFinishSession = (results: SessionResult[]) => {
    const total = results.length;
    const correctCount = results.filter((r) => r.isCorrect).length;
    const accuracyPct = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    if (activeSetNumber !== null) {
      setProgress((prev) =>
        applySetCompletionToProgress(prev, activeSetNumber, accuracyPct)
      );
    }

    setSummaryData({
      title: activeSession?.title ?? '练习完成',
      results,
      includeLabOption: activeSession?.includeLabAtEnd,
    });
    setActiveSession(null);
  };

  const handleCompleteLab = (score: number): number => {
    let earned = 0;
    setProgress((prev) => {
      const { nextProgress, starsEarned } = applyLabResultToProgress(prev, score);
      earned = starsEarned;
      return nextProgress;
    });
    return earned || (score === 40 ? 25 : 8);
  };

  const handleNavigate = (nextRoute: AppRoute) => {
    setActiveSession(null);
    setSummaryData(null);
    setRoute(nextRoute);
  };

  const sessionQuestions = useMemo(() => {
    if (!activeSession) return [];
    return activeSession.questionIds
      .map((id) => QUESTIONS_BY_ID[id])
      .filter(Boolean);
  }, [activeSession]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopNav
        activeRoute={route}
        isPracticing={Boolean(activeSession || summaryData)}
        wrongCount={stats.wrongBankCount}
        onNavigate={handleNavigate}
        onStartSmartPractice={launchSmartPractice}
      />

      <main className="flex-1">
        {activeSession ? (
          <QuestionPlayer
            key={activeSession.id}
            questions={sessionQuestions}
            sessionTitle={activeSession.title}
            sessionSubtitle={activeSession.subtitle}
            includeLabAtEnd={activeSession.includeLabAtEnd}
            onRecordAnswer={handleRecordAnswer}
            onFinishSession={handleFinishSession}
            onExit={() => {
              setActiveSession(null);
              setActiveSetNumber(null);
            }}
          />
        ) : summaryData ? (
          <SessionSummary
            title={summaryData.title}
            results={summaryData.results}
            includeLabOption={summaryData.includeLabOption}
            onRetryWrong={(wrongIds) =>
              launchFilteredPractice(
                wrongIds,
                '错题立刻重练',
                `把刚刚做错的 ${wrongIds.length} 题再练一次`
              )
            }
            onContinueSmart={launchSmartPractice}
            onOpenLab={() => {
              setSummaryData(null);
              setRoute('lab');
            }}
            onBackHome={() => {
              setSummaryData(null);
              setRoute('home');
            }}
            onInspectQuestion={(qId) =>
              launchSingleQuestion(qId, '单题回看与讲解')
            }
          />
        ) : route === 'home' ? (
          <HomeDashboard
            progress={progress}
            stats={stats}
            onStartSmartPractice={launchSmartPractice}
            onStartDomainPractice={launchDomainPractice}
            onStartWrongPractice={launchWrongPractice}
            onStartSetPractice={launchSetPractice}
            onOpenSets={() => setRoute('sets')}
            onOpenLab={() => setRoute('lab')}
          />
        ) : route === 'sets' ? (
          <SetsAndTopicsView
            progress={progress}
            onStartSet={launchSetPractice}
            onStartSingleQuestion={launchSingleQuestion}
            onStartFilteredList={launchFilteredPractice}
            onOpenLab={() => setRoute('lab')}
          />
        ) : route === 'lab' ? (
          <SmartLampLab
            bestScore={progress.lab.bestScore}
            onCompleteLab={handleCompleteLab}
            onBack={() => setRoute('home')}
          />
        ) : (
          <WrongBookView
            progress={progress}
            stats={stats}
            onStartWrongPractice={launchWrongPractice}
            onPracticeSingleQuestion={(qId) =>
              launchSingleQuestion(qId, '错题单独重练')
            }
            onResetProgress={() => {
              const fresh = clearProgress();
              setProgress(fresh);
            }}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-5 px-4 sm:px-6 text-center text-xs text-slate-500">
        AI通识小博士 · 专为小学二年级 AI 通识竞赛打造 · 全鼠标点击交互 · 自动保存学习进度
      </footer>
    </div>
  );
}
