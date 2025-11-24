import { Gender, HairColorOption, HairstyleOption } from './types';

export const HAIR_COLORS: HairColorOption[] = [
  { id: 'original', label: '保持原色', value: 'transparent', description: 'keep the original hair color' },
  { id: 'black', label: '自然黑', value: '#1a1a1a', description: 'natural black hair' },
  { id: 'dark-brown', label: '深棕色', value: '#4a3728', description: 'dark brown hair' },
  { id: 'chestnut', label: '栗棕色', value: '#8B4513', description: 'chestnut brown hair' },
  { id: 'blonde', label: '金发', value: '#e6c200', description: 'blonde hair' },
  { id: 'platinum', label: '白金', value: '#e5e4e2', description: 'platinum blonde hair' },
  { id: 'silver', label: '银灰', value: '#c0c0c0', description: 'silver grey hair' },
  { id: 'red', label: '酒红', value: '#880808', description: 'dark red wine hair' },
  { id: 'pink', label: '樱花粉', value: '#ffb6c1', description: 'sakura pink hair' },
  { id: 'blue', label: '雾霾蓝', value: '#4682b4', description: 'dusty blue hair' },
  { id: 'purple', label: '深紫', value: '#800080', description: 'deep purple hair' },
];

export const HAIRSTYLES: HairstyleOption[] = [
  // Female Styles
  { id: 'f-long-wavy', name: 'long wavy hair', label: '大波浪长发', gender: Gender.Female, category: '长发' },
  { id: 'f-straight-long', name: 'straight long hair', label: '黑长直', gender: Gender.Female, category: '长发' },
  { id: 'f-bob', name: 'bob cut', label: '波波头 (Bob)', gender: Gender.Female, category: '短发' },
  { id: 'f-pixie', name: 'pixie cut', label: '精灵短发', gender: Gender.Female, category: '短发' },
  { id: 'f-bangs', name: 'hair with bangs', label: '空气刘海', gender: Gender.Female, category: '刘海' },
  { id: 'f-ponytail', name: 'high ponytail', label: '高马尾', gender: Gender.Female, category: '扎发' },
  { id: 'f-bun', name: 'messy bun', label: '丸子头', gender: Gender.Female, category: '扎发' },
  { id: 'f-layer', name: 'layered haircut', label: '层次感中长发', gender: Gender.Female, category: '中长发' },
  { id: 'f-braid', name: 'side braid', label: '侧边麻花辫', gender: Gender.Female, category: '编发' },
  
  // Male Styles
  { id: 'm-undercut', name: 'undercut hairstyle', label: '底切 (Undercut)', gender: Gender.Male, category: '短发' },
  { id: 'm-pompadour', name: 'pompadour hairstyle', label: '庞毕度油头', gender: Gender.Male, category: '经典' },
  { id: 'm-buzz', name: 'buzz cut', label: '寸头', gender: Gender.Male, category: '超短' },
  { id: 'm-crew', name: 'crew cut', label: '小平头', gender: Gender.Male, category: '短发' },
  { id: 'm-korean', name: 'korean perm two block', label: '韩式纹理烫', gender: Gender.Male, category: '烫发' },
  { id: 'm-sidepart', name: 'classic side part', label: '经典偏分', gender: Gender.Male, category: '商务' },
  { id: 'm-fringe', name: 'messy fringe', label: '凌乱刘海', gender: Gender.Male, category: '休闲' },
  { id: 'm-long', name: 'shoulder length wavy hair', label: '日系中长发', gender: Gender.Male, category: '长发' },
];