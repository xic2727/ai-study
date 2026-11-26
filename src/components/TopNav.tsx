import React from 'react';

export type AppRoute = 'home' | 'sets' | 'lab' | 'wrong';

interface TopNavProps {
  activeRoute: AppRoute;
  isPracticing: boolean;
  wrongCount: number;
  onNavigate: (route: AppRoute) => void;
  onStartSmartPractice: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeRoute,
  isPracticing,
  wrongCount,
  onNavigate,
  onStartSmartPractice,
}) => {
  const navItems: { id: AppRoute; label: string }[] = [
    { id: 'home', label: '学习大厅' },
    { id: 'sets', label: '套卷与题库' },
    { id: 'lab', label: '台灯实验室' },
    { id: 'wrong', label: wrongCount > 0 ? `错题本(${wrongCount})` : '错题巩固' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-sky-700 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600"
        >
          AI通识小博士
        </button>

        {/* Zone 2: 4 concise single-line nav links */}
        <nav
          aria-label="主导航"
          className="hidden md:flex items-center gap-7 text-sm font-semibold"
        >
          {navItems.map((item) => {
            const active = !isPracticing && activeRoute === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative py-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600 ${
                  active
                    ? 'text-sky-700'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-sky-600 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary CTA */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onStartSmartPractice}
            className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          >
            开始智能练习
          </button>
        </div>
      </div>

      {/* Compact mobile navigation row (kept well under 15% viewport height) */}
      <nav
        aria-label="移动端导航"
        className="md:hidden border-t border-slate-100 px-3 py-1.5 flex items-center justify-around bg-slate-50/70"
      >
        {navItems.map((item) => {
          const active = !isPracticing && activeRoute === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`px-2 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 rounded-md transition-colors cursor-pointer ${
                active ? 'text-sky-700 bg-sky-50' : 'text-slate-600'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
