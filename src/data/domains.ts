import { KnowledgeDomain } from '../types/quiz';

export interface DomainMeta {
  id: KnowledgeDomain;
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  iconName: 'eye' | 'brain' | 'palette' | 'compass' | 'shield';
  accentClass: string;
  barClass: string;
  softBgClass: string;
}

export const KNOWLEDGE_DOMAINS: DomainMeta[] = [
  {
    id: 'perception',
    title: 'AI如何“看”和“听”',
    shortTitle: '感知与识别',
    subtitle: '传感器、图像与语音识别',
    description: '了解摄像头、麦克风、红外与光敏传感器怎样充当AI的眼睛和耳朵。',
    iconName: 'eye',
    accentClass: 'text-sky-700',
    barClass: 'bg-sky-600',
    softBgClass: 'bg-sky-50 border-sky-200',
  },
  {
    id: 'learning',
    title: 'AI怎样“变聪明”',
    shortTitle: '机器学习',
    subtitle: '训练数据、特征与验证',
    description: '明白AI为什么要看很多例子、从错误中调整，以及什么是思维链与对抗样本。',
    iconName: 'brain',
    accentClass: 'text-indigo-700',
    barClass: 'bg-indigo-600',
    softBgClass: 'bg-indigo-50 border-indigo-200',
  },
  {
    id: 'generative',
    title: 'AI画画与写诗',
    shortTitle: '创意与生成',
    subtitle: '提示词、文生图与数字人',
    description: '学会写清楚的提示词，分清AI生成作品与人类情感创作的不同。',
    iconName: 'palette',
    accentClass: 'text-amber-700',
    barClass: 'bg-amber-500',
    softBgClass: 'bg-amber-50 border-amber-200',
  },
  {
    id: 'life',
    title: '身边的智能小助手',
    shortTitle: '生活与应用',
    subtitle: '推荐系统、导航与开源硬件',
    description: '发现手机地图、动画推荐、智能家居和机器翻译背后的聪明原理。',
    iconName: 'compass',
    accentClass: 'text-emerald-700',
    barClass: 'bg-emerald-600',
    softBgClass: 'bg-emerald-50 border-emerald-200',
  },
  {
    id: 'safety',
    title: '做个安全小达人',
    shortTitle: '安全与伦理',
    subtitle: '隐私保护、核查与好习惯',
    description: '记住不泄露家庭隐私、不直接抄AI答案、学会查证和诚实署名。',
    iconName: 'shield',
    accentClass: 'text-teal-700',
    barClass: 'bg-teal-600',
    softBgClass: 'bg-teal-50 border-teal-200',
  },
];

export const DOMAIN_MAP: Record<KnowledgeDomain, DomainMeta> = KNOWLEDGE_DOMAINS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<KnowledgeDomain, DomainMeta>
);
