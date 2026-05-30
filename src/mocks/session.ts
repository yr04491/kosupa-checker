import type { Session } from '../types';

// UI開発用のサンプルセッション結果
export const MOCK_SESSION: Session = {
  sessionId: 'mock-session-001',
  userId: null,
  input: {
    stomachCapacity: 800,
    stayTime: 90,
    buffetPrice: 3000,
    selectedMenus: [
      { menuId: 'preset-001', preference: 5 }, // カルビ
      { menuId: 'preset-002', preference: 4 }, // ハラミ
      { menuId: 'preset-004', preference: 3 }, // タン塩
      { menuId: 'preset-007', preference: 2 }, // ライス
    ],
  },
  result: {
    optimalCombination: [
      { menuId: 'preset-001', quantity: 3 }, // カルビ × 3
      { menuId: 'preset-002', quantity: 2 }, // ハラミ × 2
      { menuId: 'preset-007', quantity: 1 }, // ライス × 1
    ],
    totalPrice: 3240,
    verdict: 'buffet',
    difference: 240, // 食べ放題の方が240円お得
    geminiComment: null,
  },
  createdAt: new Date('2026-05-30'),
};
