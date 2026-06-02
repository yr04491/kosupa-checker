import type { DPInput, DPResult } from '../types';

export function solveDP(input: DPInput): DPResult {
  const { stomachCapacity, stayTime, buffetPrice, selectedMenus, menus } = input;

  const items = selectedMenus
    .map(sm => {
      const menu = menus.find(m => m.menuId === sm.menuId);
      if (!menu) return null;
      return {
        menuId: menu.menuId,
        price: menu.price,
        weight: menu.weight,
        servingTime: menu.servingTime,
        value: menu.price * sm.preference,
      };
    })
    .filter((item): item is NonNullable<typeof item> =>
      item !== null && item.weight > 0 && item.servingTime > 0
    );

  const W = stomachCapacity;
  const T = stayTime;

  // dp[w][t] = 重量≤w かつ 時間≤t で得られる最大加重価値（price × preference）
  const dp: number[][] = Array.from({ length: W + 1 }, () => new Array(T + 1).fill(0));
  // from[w][t] = 状態(w,t)で最後に選んだアイテムのインデックス
  const from: number[][] = Array.from({ length: W + 1 }, () => new Array(T + 1).fill(-1));

  for (let w = 0; w <= W; w++) {
    for (let t = 0; t <= T; t++) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (w >= item.weight && t >= item.servingTime) {
          const val = dp[w - item.weight][t - item.servingTime] + item.value;
          if (val > dp[w][t]) {
            dp[w][t] = val;
            from[w][t] = i;
          }
        }
      }
    }
  }

  // 逆追跡で最適組み合わせを復元
  const quantities = new Map<string, number>();
  let w = W;
  let t = T;
  while (from[w][t] !== -1) {
    const i = from[w][t];
    const item = items[i];
    quantities.set(item.menuId, (quantities.get(item.menuId) ?? 0) + 1);
    w -= item.weight;
    t -= item.servingTime;
  }

  const optimalCombination = Array.from(quantities.entries()).map(([menuId, quantity]) => ({
    menuId,
    quantity,
  }));

  // 実際の単品合計（好み重みなし）
  const totalPrice = optimalCombination.reduce((sum, { menuId, quantity }) => {
    const menu = menus.find(m => m.menuId === menuId)!;
    return sum + menu.price * quantity;
  }, 0);

  const difference = totalPrice - buffetPrice;

  return {
    optimalCombination,
    totalPrice,
    verdict: difference > 0 ? 'buffet' : 'alacarte',
    difference,
  };
}
