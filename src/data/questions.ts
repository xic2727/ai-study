import { Question } from '../types/quiz';
import { QUESTIONS_PART_1 } from './questionsPart1';
import { QUESTIONS_PART_2 } from './questionsPart2';

export const ALL_QUESTIONS: Question[] = [...QUESTIONS_PART_1, ...QUESTIONS_PART_2];

export const QUESTIONS_BY_ID: Record<string, Question> = ALL_QUESTIONS.reduce(
  (acc, q) => {
    acc[q.id] = q;
    return acc;
  },
  {} as Record<string, Question>
);

export interface MockSetMeta {
  setNumber: number;
  title: string;
  subtitle: string;
  focusSummary: string;
}

export const MOCK_SETS: MockSetMeta[] = [
  { setNumber: 1, title: '第 1 套综合模拟卷', subtitle: '15道核心题 + 台灯实验', focusSummary: '交通预测 · 推荐系统 · 开源硬件 · 伴读思辨' },
  { setNumber: 2, title: '第 2 套综合模拟卷', subtitle: '15道核心题 + 台灯实验', focusSummary: '红外避障 · 监督学习 · 思维链 · 脑机接口' },
  { setNumber: 3, title: '第 3 套综合模拟卷', subtitle: '15道核心题 + 台灯实验', focusSummary: '云端语音 · 路径规划 · 掩码学习 · 数字人' },
  { setNumber: 4, title: '第 4 套综合模拟卷', subtitle: '15道核心题 + 台灯实验', focusSummary: '感知决策控制 · 数据加载 · 深蓝历史 · 无障碍眼镜' },
  { setNumber: 5, title: '第 5 套综合模拟卷', subtitle: '15道核心题 + 台灯实验', focusSummary: '知识库 · 专家系统 · 特征提取 · 隐私保护' },
  { setNumber: 6, title: '第 6 套综合模拟卷', subtitle: '15道核心题 + 台灯实验', focusSummary: '计算思维 · 验证测试 · 统计图 · 人机分工' },
  { setNumber: 7, title: '第 7 套综合模拟卷', subtitle: '15道核心题 + 台灯实验', focusSummary: '机器翻译 · 样本偏见 · 传感器 · 诚实写作' },
  { setNumber: 8, title: '第 8 套综合模拟卷', subtitle: '15道核心题 + 台灯实验', focusSummary: '声纹识别 · 对抗样本 · 信息茧房 · 出行连线' },
];

export interface LampWiringSlot {
  id: 'sensor' | 'led' | 'buzzer';
  componentName: string;
  description: string;
  correctPin: 'A0' | 'PWM6' | 'D5';
  hint: string;
}

export interface LampBlockSlot {
  id: string;
  stepNumber: string;
  label: string;
  points: number;
  correctOption: string;
  options: string[];
  explanation: string;
}

export const SMART_LAMP_SPEC = {
  title: '动手小实验：智能护眼台灯（40分通关挑战）',
  scenario:
    '小明设计了一盏智能护眼台灯：用光敏传感器检测桌面光照强度（范围 0~1023，数值越小表示越暗），用LED灯自动调节亮度（0~255），光线太暗时蜂鸣器鸣响提醒！',
  rules: [
    '光照值 ≥ 300：光线充足，LED灯熄灭（输出0），蜂鸣器停止发声。',
    '100 ≤ 光照值 < 300：光线微暗，LED灯亮度设为 150，蜂鸣器停止发声。',
    '光照值 < 100：光线过暗！LED灯亮度调到最亮 255，蜂鸣器鸣响提醒。',
    '每 0.5 秒检测一次光照值，持续循环自动调节。',
  ],
  wiringSlots: [
    {
      id: 'sensor',
      componentName: '光敏传感器 (AO模拟输出)',
      description: '读取 0~1023 连续变化的光线数值，应该接哪个引脚？',
      correctPin: 'A0',
      hint: '光敏传感器输出的是连续变化的模拟数值（0~1023），所以要接“模拟引脚 A0”！',
    },
    {
      id: 'led',
      componentName: 'LED照明灯 (Sig数据引脚)',
      description: '需要调节 0~255 不同亮度，应该接哪个引脚？',
      correctPin: 'PWM6',
      hint: 'LED要调节0、150、255不同亮度，必须接支持调光的“PWM数字引脚 6”！',
    },
    {
      id: 'buzzer',
      componentName: '蜂鸣器 (信号线)',
      description: '控制发声与停止的普通开关信号，应该接哪个引脚？',
      correctPin: 'D5',
      hint: '蜂鸣器用“数字引脚 5”就能控制发声和停止啦（不能和LED引脚重复）！',
    },
  ] as LampWiringSlot[],
  pinChoices: [
    { id: 'A0', label: '模拟引脚 A0' },
    { id: 'PWM6', label: 'PWM数字引脚 6' },
    { id: 'D5', label: '数字引脚 5' },
  ] as { id: 'A0' | 'PWM6' | 'D5'; label: string }[],
  blockSlots: [
    {
      id: 'b1',
      stepNumber: '①②',
      label: '启动时，把 LED(6) 和 蜂鸣器(5) 引脚初始化为什么模式？',
      points: 4,
      correctOption: '输出模式',
      options: ['输出模式', '输入模式'],
      explanation: '台灯要向LED和蜂鸣器发出控制指令（亮灯/响声），所以引脚设为“输出模式”。',
    },
    {
      id: 'b2',
      stepNumber: '③',
      label: '第一个“如果”条件：光线很亮不需要开灯，应该判断什么？',
      points: 5,
      correctOption: '光照值 ≥ 300',
      options: ['光照值 ≥ 300', '光照值 < 100', '光照值 = 0'],
      explanation: '规则①规定：光照值 ≥ 300 时，LED熄灭（0）、蜂鸣器停止！',
    },
    {
      id: 'b3',
      stepNumber: '④',
      label: '第二个“否则如果”条件：光线有点暗，怎样用“且”连接？',
      points: 5,
      correctOption: '光照值 ≥ 100 且 光照值 < 300',
      options: ['光照值 ≥ 100 且 光照值 < 300', '光照值 ≥ 100 或 光照值 < 300', '光照值 > 300 且 光照值 < 500'],
      explanation: '数值要同时满足“≥100”和“<300”两个条件，所以中间必须用“且”连接！',
    },
    {
      id: 'b4',
      stepNumber: '⑤',
      label: '在第二个分支（100 ≤ 光照 < 300）里，LED亮度和蜂鸣器状态是？',
      points: 5,
      correctOption: 'LED亮度 150，蜂鸣器停止',
      options: ['LED亮度 150，蜂鸣器停止', 'LED亮度 255，蜂鸣器鸣响', 'LED亮度 0，蜂鸣器停止'],
      explanation: '傍晚微暗时开中等亮度 150 就够护眼啦，还不需要蜂鸣器叫醒你。',
    },
    {
      id: 'b5',
      stepNumber: '⑥',
      label: '“否则”分支（光照 < 100 太暗了！），LED亮度应设为多少？',
      points: 5,
      correctOption: '255（最亮）',
      options: ['255（最亮）', '150（中等）', '0（熄灭）'],
      explanation: 'LED亮度范围是 0~255，环境太暗（<100）时要开到最大亮度 255！',
    },
    {
      id: 'b6',
      stepNumber: '⑦',
      label: '“否则”分支（光照 < 100）时，蜂鸣器要执行什么动作？',
      points: 5,
      correctOption: '鸣响提醒（500Hz 250毫秒）',
      options: ['鸣响提醒（500Hz 250毫秒）', '停止发声', '读取光照值'],
      explanation: '光线过暗时蜂鸣器滴滴鸣响提醒小朋友：“该注意护眼或开大灯啦！”',
    },
    {
      id: 'b7',
      stepNumber: '⑧',
      label: '永久循环末尾的等待时间设为多少，才能每半秒测一次？',
      points: 5,
      correctOption: '等待 0.5 秒',
      options: ['等待 0.5 秒', '等待 10 秒', '等待 0 秒'],
      explanation: '规则④要求“每0.5秒检测一次光照值”，所以循环结尾要加上“等待 0.5 秒”。',
    },
  ] as LampBlockSlot[],
};
