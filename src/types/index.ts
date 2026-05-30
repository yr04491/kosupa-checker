// メニュー1件 (Firestoreの menus/{menuId} に対応)
export type Menu = {
  menuId: string;
  name: string;
  price: number;       // 単品価格（円）
  weight: number;      // 1皿あたりの重量（g）
  servingTime: number; // 食べるのにかかる時間（分）
  isPreset: boolean;
  category?: string;
  createdBy: string | null;
  createdAt: Date;
};

// メニュー選択時に好み度を付与したもの
export type SelectedMenu = {
  menuId: string;
  preference: number; // 1〜5
};

// DP への入力
export type DPInput = {
  stomachCapacity: number; // 胃袋容量（g）
  stayTime: number;        // 滞在時間（分）
  buffetPrice: number;     // 食べ放題の料金（円）
  selectedMenus: SelectedMenu[];
  menus: Menu[];           // selectedMenus の参照元
};

// DP の計算結果
export type DPResult = {
  optimalCombination: { menuId: string; quantity: number }[];
  totalPrice: number;
  verdict: 'buffet' | 'alacarte';
  difference: number; // 正=食べ放題お得、負=単品お得
};

// 1回の計算セッション (Firestoreの sessions/{sessionId} に対応)
export type Session = {
  sessionId: string;
  userId: string | null; // Phase 1 は null
  input: {
    stomachCapacity: number;
    stayTime: number;
    buffetPrice: number;
    selectedMenus: SelectedMenu[];
  };
  result: DPResult & { geminiComment: string | null };
  createdAt: Date;
};
