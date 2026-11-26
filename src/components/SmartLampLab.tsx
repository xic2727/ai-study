import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Lightbulb,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { SMART_LAMP_SPEC } from '../data/questions';

interface SmartLampLabProps {
  bestScore: number;
  onCompleteLab: (score: number) => number; // returns starsEarned
  onBack: () => void;
}

type PinId = 'A0' | 'PWM6' | 'D5';
type ComponentId = 'sensor' | 'led' | 'buzzer';

export const SmartLampLab: React.FC<SmartLampLabProps> = ({
  bestScore,
  onCompleteLab,
  onBack,
}) => {
  // Step 1: Wiring
  const [selectedComponent, setSelectedComponent] = useState<ComponentId | null>('sensor');
  const [wiring, setWiring] = useState<Partial<Record<ComponentId, PinId>>>({});

  // Step 2: Graphical blocks
  const [blockAnswers, setBlockAnswers] = useState<Record<string, string>>({});

  // Evaluation state
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [starsEarned, setStarsEarned] = useState<number>(0);

  // Live Interactive Desk Lamp Simulation
  const [luxValue, setLuxValue] = useState<number>(180);

  const handleAssignPin = (pinId: PinId) => {
    if (submittedScore !== null || !selectedComponent) return;
    setWiring((prev) => {
      const next = { ...prev };
      // Ensure non-overlapping pins as required by the exam rule
      for (const key of Object.keys(next) as ComponentId[]) {
        if (next[key] === pinId) delete next[key];
      }
      next[selectedComponent] = pinId;
      // Advance selection to next unwired component
      const nextComp = SMART_LAMP_SPEC.wiringSlots.find(
        (s) => s.id !== selectedComponent && !next[s.id]
      );
      setSelectedComponent(nextComp ? nextComp.id : null);
      return next;
    });
  };

  const handleSelectBlock = (slotId: string, option: string) => {
    if (submittedScore !== null) return;
    setBlockAnswers((prev) => ({ ...prev, [slotId]: option }));
  };

  const allWired = SMART_LAMP_SPEC.wiringSlots.every((s) => Boolean(wiring[s.id]));
  const allBlocksFilled = SMART_LAMP_SPEC.blockSlots.every((b) => Boolean(blockAnswers[b.id]));
  const canCheck = allWired && allBlocksFilled && submittedScore === null;

  const wiringCorrect = SMART_LAMP_SPEC.wiringSlots.every(
    (s) => wiring[s.id] === s.correctPin
  );

  const handleSubmitLab = () => {
    let score = 0;
    if (wiringCorrect) score += 6;
    for (const slot of SMART_LAMP_SPEC.blockSlots) {
      if (blockAnswers[slot.id] === slot.correctOption) {
        score += slot.points;
      }
    }
    const stars = onCompleteLab(score);
    setStarsEarned(stars);
    setSubmittedScore(score);
  };

  const handleResetLab = () => {
    setWiring({});
    setSelectedComponent('sensor');
    setBlockAnswers({});
    setSubmittedScore(null);
    setStarsEarned(0);
  };

  // Compute simulated hardware state from luxValue (0..1023)
  const simState =
    luxValue >= 300
      ? { ledBrightness: 0, buzzerOn: false, label: '光线充足（≥ 300）：台灯熄灭，蜂鸣器安静' }
      : luxValue >= 100
        ? { ledBrightness: 150, buzzerOn: false, label: '光线微暗（100~299）：台灯亮起柔和护眼亮度 150' }
        : { ledBrightness: 255, buzzerOn: true, label: '太暗啦（< 100）：台灯开到最亮 255，蜂鸣器滴滴提醒！' };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>返回</span>
            </button>
            <span className="text-slate-300" aria-hidden="true">|</span>
            <span className="text-xs font-semibold text-indigo-700">40分压轴实验专题</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {SMART_LAMP_SPEC.title}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
            {SMART_LAMP_SPEC.scenario}
          </p>
        </div>

        <div className="shrink-0 text-left sm:text-right">
          <p className="text-xs font-medium text-slate-500">历史最高分</p>
          <p className="text-2xl font-extrabold text-slate-900 font-mono-tabular">
            {Math.max(bestScore, submittedScore ?? 0)} / 40 分
          </p>
        </div>
      </div>

      {/* Interactive Live Desk Lamp Simulator (Top Sandbox Stage!) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">实时智能台灯实验室</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                点一点光线情景或拖动滑块，先看看智能护眼台灯是怎么自己动起来的！
              </p>
            </div>
            <span className="font-mono-tabular text-sm font-bold text-sky-700">
              光照值：{luxValue}
            </span>
          </div>

          {/* Visual SVG Desk Lamp & Sensor Stage */}
          <div
            className="rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-around gap-6 transition-colors duration-300"
            style={{
              backgroundColor:
                luxValue >= 300 ? '#F8FAFC' : luxValue >= 100 ? '#E2E8F0' : '#1E293B',
            }}
          >
            {/* Desk Lamp SVG */}
            <svg viewBox="0 0 180 150" className="w-44 h-36 shrink-0" aria-hidden="true">
              {/* Light cone */}
              {simState.ledBrightness > 0 && (
                <polygon
                  points="62,56 122,56 164,136 20,136"
                  fill={simState.ledBrightness === 255 ? '#FDE047' : '#FEF08A'}
                  opacity={simState.ledBrightness === 255 ? 0.45 : 0.28}
                />
              )}
              {/* Base & Arm */}
              <rect x="64" y="128" width="56" height="10" rx="5" fill="#475569" />
              <path d="M92 128 L92 92 L58 62 L76 48" fill="none" stroke="#64748B" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
              {/* Lamp Head */}
              <path d="M62 46 L122 46 L114 60 L70 60 Z" fill="#334155" />
              <ellipse
                cx="92"
                cy="60"
                rx="18"
                ry="5"
                fill={
                  simState.ledBrightness === 0
                    ? '#94A3B8'
                    : simState.ledBrightness === 150
                      ? '#FACC15'
                      : '#FEF08A'
                }
              />
            </svg>

            {/* Live Hardware Telemetry Readout */}
            <div className="space-y-3 text-sm max-w-xs">
              <div
                className={`p-3.5 rounded-xl border ${
                  luxValue < 100
                    ? 'bg-slate-800 border-slate-700 text-slate-100'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <p className="text-xs opacity-75">LED 亮度输出 (PWM 引脚 6)</p>
                <p className="text-lg font-extrabold font-mono-tabular mt-0.5">
                  {simState.ledBrightness} / 255
                </p>
              </div>

              <div
                className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                  simState.buzzerOn
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : luxValue < 100
                      ? 'bg-slate-800 border-slate-700 text-slate-100'
                      : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                {simState.buzzerOn ? (
                  <Volume2 className="w-5 h-5 text-amber-600 shrink-0" aria-hidden="true" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
                )}
                <div>
                  <p className="text-xs opacity-75">蜂鸣器状态 (引脚 5)</p>
                  <p className="text-sm font-bold">
                    {simState.buzzerOn ? '滴滴鸣响提醒 (500Hz)' : '停止发声'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Slider & Quick Presets */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="lux-slider" className="text-xs font-semibold text-slate-600">
                光敏传感器光照值（0 最暗 ~ 1023 最亮）：
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLuxValue(500)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 cursor-pointer"
                >
                  白天明亮 (500)
                </button>
                <button
                  type="button"
                  onClick={() => setLuxValue(180)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 cursor-pointer"
                >
                  傍晚微暗 (180)
                </button>
                <button
                  type="button"
                  onClick={() => setLuxValue(50)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 cursor-pointer"
                >
                  关灯太暗 (50)
                </button>
              </div>
            </div>

            <input
              id="lux-slider"
              type="range"
              min={0}
              max={1023}
              value={luxValue}
              onChange={(e) => setLuxValue(Number(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <p className="text-xs font-semibold text-sky-800">{simState.label}</p>
          </div>
        </div>

        {/* Right: 4 Rules Cheat Sheet */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Lightbulb className="w-4 h-4 text-amber-500" aria-hidden="true" />
            <span>台灯工作规则（照着做就能拿满分）</span>
          </div>
          <ul className="space-y-3 text-sm text-slate-700 leading-relaxed">
            {SMART_LAMP_SPEC.rules.map((r, i) => (
              <li key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-mono-tabular font-bold text-sky-700 mr-1.5">
                  规则 {i + 1}.
                </span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Part 1: Click-to-Wire Hardware (6 points) */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              第一步：点选硬件连线（得分点1 · 共 6 分）
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              先点左边的元器件，再点右边主控板上对应的引脚（注意各器件引脚不能重复！）
            </p>
          </div>
          {submittedScore === null && Object.keys(wiring).length > 0 && (
            <button
              type="button"
              onClick={() => {
                setWiring({});
                setSelectedComponent('sensor');
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>重置连线</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Components */}
          <div className="space-y-3">
            {SMART_LAMP_SPEC.wiringSlots.map((slot) => {
              const assigned = wiring[slot.id];
              const isSelected = selectedComponent === slot.id;
              const isRight = submittedScore !== null && assigned === slot.correctPin;

              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={submittedScore !== null}
                  onClick={() => setSelectedComponent(slot.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer disabled:cursor-default ${
                    submittedScore !== null
                      ? isRight
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-rose-500 bg-rose-50'
                      : isSelected
                        ? 'border-sky-600 bg-sky-50 ring-1 ring-sky-600'
                        : assigned
                          ? 'border-indigo-300 bg-indigo-50/40'
                          : 'border-slate-200 bg-white hover:border-sky-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900">{slot.componentName}</span>
                    <span className="font-mono-tabular text-xs font-bold text-sky-700">
                      {assigned ? `已连 → ${assigned}` : '待连线'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{slot.description}</p>
                  {submittedScore !== null && (
                    <p className="mt-2 text-xs font-semibold text-slate-700">{slot.hint}</p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Microcontroller Pin Targets */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Cpu className="w-4 h-4 text-sky-600" aria-hidden="true" />
              <span>Arduino 主控板接口（点选目标引脚）</span>
            </div>

            <div className="space-y-3">
              {SMART_LAMP_SPEC.pinChoices.map((pin) => {
                const owner = SMART_LAMP_SPEC.wiringSlots.find(
                  (s) => wiring[s.id] === pin.id
                );
                return (
                  <button
                    key={pin.id}
                    type="button"
                    disabled={submittedScore !== null || !selectedComponent}
                    onClick={() => handleAssignPin(pin.id)}
                    className={`w-full px-4 py-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer disabled:cursor-default ${
                      owner
                        ? 'bg-white border-sky-500 text-slate-900'
                        : selectedComponent
                          ? 'bg-white border-slate-300 hover:border-sky-500 hover:bg-sky-50 text-slate-800'
                          : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    <span className="text-sm font-bold font-mono-tabular">{pin.label}</span>
                    <span className="text-xs font-semibold text-slate-500">
                      {owner ? `连接：${owner.componentName.split(' ')[0]}` : '空闲引脚'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Part 2: Click-to-Complete Graphical Blocks (34 points) */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            第二步：图形化积木程序补全（得分点 2~9 · 共 34 分）
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            不用自己敲代码，点击每一条积木后面的选项按钮就能把台灯程序拼完整！
          </p>
        </div>

        <div className="space-y-4">
          {SMART_LAMP_SPEC.blockSlots.map((slot) => {
            const chosen = blockAnswers[slot.id];
            const isRight = submittedScore !== null && chosen === slot.correctOption;

            return (
              <div
                key={slot.id}
                className={`p-4 rounded-xl border space-y-3 ${
                  submittedScore !== null
                    ? isRight
                      ? 'border-emerald-300 bg-emerald-50/40'
                      : 'border-rose-300 bg-rose-50/40'
                    : 'border-slate-200 bg-slate-50/60'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900">
                    <span className="font-mono-tabular text-sky-700 mr-2">空位 {slot.stepNumber}</span>
                    {slot.label}
                  </p>
                  <span className="text-xs font-mono-tabular font-semibold text-slate-500">
                    {slot.points} 分
                  </span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {slot.options.map((opt) => {
                    const active = chosen === opt;
                    const isCorrectOpt = slot.correctOption === opt;
                    let btnStyle =
                      'bg-white border-slate-200 text-slate-800 hover:border-sky-400';
                    if (submittedScore === null && active) {
                      btnStyle = 'bg-sky-600 border-sky-600 text-white';
                    } else if (submittedScore !== null && isCorrectOpt) {
                      btnStyle = 'bg-emerald-600 border-emerald-600 text-white';
                    } else if (submittedScore !== null && active && !isCorrectOpt) {
                      btnStyle = 'bg-rose-600 border-rose-600 text-white';
                    }

                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={submittedScore !== null}
                        aria-pressed={active}
                        onClick={() => handleSelectBlock(slot.id, opt)}
                        className={`px-4 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer disabled:cursor-default min-h-[40px] ${btnStyle}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {submittedScore !== null && (
                  <p className="text-xs font-medium text-slate-700">
                    {isRight ? '✓ 选对啦！' : `✕ 正确答案是「${slot.correctOption}」。`}
                    {slot.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit / Result Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {submittedScore === null ? (
            <>
              <p className="text-xs text-slate-500">
                完成 3 根硬件连线和 7 个程序积木空位后，就能提交评分啦！
              </p>
              <button
                type="button"
                disabled={!canCheck}
                onClick={handleSubmitLab}
                className="px-6 py-3 text-sm font-bold text-white bg-sky-600 rounded-xl hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                运行并检查实验得分
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                {submittedScore === 40 ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" aria-hidden="true" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" aria-hidden="true" />
                )}
                <div>
                  <p className="text-base font-extrabold text-slate-900 font-mono-tabular">
                    本次实验得分：{submittedScore} / 40 分（+{starsEarned} 颗星）
                  </p>
                  <p className="text-xs text-slate-600">
                    {submittedScore === 40
                      ? '全对通关！你已经掌握了“光敏感知 → 条件判断 → 调光与蜂鸣器控制”的完整逻辑！'
                      : '上面标绿色的就是正确答案，再重拼一次就能拿 40 分满分啦！'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetLab}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-slate-800 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>再挑战一次</span>
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
};
