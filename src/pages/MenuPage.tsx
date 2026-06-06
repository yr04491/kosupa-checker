import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { solveDP } from '../lib/dp';
import { MenuCard } from '../components/MenuCard';
import type { UIMenuItem } from '../components/MenuCard';
import { PRESET_MENUS } from '../mocks/menus';
import type { Session } from '../types';

const INPUT_STORAGE_KEY = 'kosupa-checker:input';
const RESULT_STORAGE_KEY = 'kosupa-checker:result';

// TopPage で入力された値を初期値として引き継ぐ（無ければ既定値）
function loadInitialInput() {
  const fallback = { stomachCapacity: 800, stayTime: 90, buffetPrice: 3980 };
  try {
    const raw = sessionStorage.getItem(INPUT_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      stomachCapacity: Number(parsed.stomachCapacity) || fallback.stomachCapacity,
      stayTime: Number(parsed.stayTime) || fallback.stayTime,
      buffetPrice: Number(parsed.buffetPrice) || fallback.buffetPrice,
    };
  } catch {
    return fallback;
  }
}

export default function MenuPage() {
  const navigate = useNavigate();
  const initial = loadInitialInput();

  const [menuList, setMenuList] = useState<UIMenuItem[]>(() =>
    PRESET_MENUS.map((m) => ({ ...m, isSelected: true, preference: 3 })),
  );

  const [stomachCapacity, setStomachCapacity] = useState<number>(initial.stomachCapacity);
  const [stayTime, setStayTime] = useState<number>(initial.stayTime);
  const [buffetPrice, setBuffetPrice] = useState<number>(initial.buffetPrice);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // カスタムメニュー追加フォーム用の状態
  const [showAddForm, setShowAddForm] = useState(false);
  const [customForm, setCustomForm] = useState({ name: '', price: '', weight: '', servingTime: '' });
  const [formError, setFormError] = useState('');

  const selectedCount = menuList.filter((m) => m.isSelected).length;

  const handleToggleSelect = (menuId: string) => {
    setMenuList((prev) =>
      prev.map((item) =>
        item.menuId === menuId ? { ...item, isSelected: !item.isSelected } : item,
      ),
    );
  };

  const handleChangePreference = (menuId: string, preference: number) => {
    setMenuList((prev) =>
      prev.map((item) => (item.menuId === menuId ? { ...item, preference } : item)),
    );
  };

  // カスタムメニューを追加して一覧に加える
  const handleAddCustomMenu = () => {
    setFormError('');
    const price = Number(customForm.price);
    const weight = Number(customForm.weight);
    const servingTime = Number(customForm.servingTime);

    if (!customForm.name.trim()) {
      setFormError('メニュー名を入力してください');
      return;
    }
    if (!price || price <= 0 || !weight || weight <= 0 || !servingTime || servingTime <= 0) {
      setFormError('価格・重量・提供時間は1以上で入力してください');
      return;
    }

    const newMenu: UIMenuItem = {
      menuId: `custom-${Date.now()}`,
      name: customForm.name.trim(),
      price,
      weight,
      servingTime,
      isPreset: false,
      category: 'カスタム',
      createdBy: null,
      createdAt: new Date(),
      isSelected: true,
      preference: 3,
    };

    setMenuList((prev) => [...prev, newMenu]);
    setCustomForm({ name: '', price: '', weight: '', servingTime: '' });
    setShowAddForm(false);
  };

  // DP を計算し、結果を保存してリザルト画面へ遷移する
  const handleRunDP = async () => {
    if (selectedCount === 0 || isSubmitting) return;
    setIsSubmitting(true);

    const selectedMenus = menuList
      .filter((m) => m.isSelected)
      .map((m) => ({ menuId: m.menuId, preference: m.preference }));

    // カスタムメニューも参照できるよう menuList をそのまま渡す
    const result = solveDP({
      stomachCapacity,
      stayTime,
      buffetPrice,
      selectedMenus,
      menus: menuList,
    });

    const session: Session = {
      sessionId: '',
      userId: null,
      input: { stomachCapacity, stayTime, buffetPrice, selectedMenus },
      result: { ...result, geminiComment: null },
      createdAt: new Date(),
    };

    // ローカルフォールバック用に常に保存しておく（Firebase未設定でも結果表示できる）
    sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(session));

    try {
      // Firestore が設定済みなら永続化して docId で遷移
      const ref = await addDoc(collection(db, 'sessions'), {
        userId: null,
        input: { stomachCapacity, stayTime, buffetPrice, selectedMenus },
        result: { ...result, geminiComment: null },
        createdAt: serverTimestamp(),
      });
      navigate(`/result/${ref.id}`);
    } catch {
      // 未設定・失敗時は sessionStorage 経由で表示
      navigate('/result/local');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-zinc-950">
      <main className="mx-auto max-w-2xl space-y-6 px-5 py-10 sm:px-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-red-700">
            Kosupa Checker
          </p>
          <p className="font-mono text-xs text-zinc-400">/select</p>
        </div>

        {/* 画面タイトル */}
        <div className="rounded-sm border-2 border-zinc-950 bg-white p-6 shadow-[6px_6px_0_#18181b]">
          <h1 className="text-xl font-black sm:text-2xl">😋 メニューセレクト</h1>
          <p className="mt-2 text-sm text-zinc-500">
            食べたいメニューにチェックを入れ、好み度を設定してください。
          </p>
        </div>

        {/* 条件設定 */}
        <div className="rounded-sm border-2 border-zinc-200 bg-white p-5 shadow-[6px_6px_0_#18181b] space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">条件設定</h2>

          <div className="space-y-4 font-mono text-sm">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                食べ放題料金 (円)
              </label>
              <input
                type="number"
                step="100"
                value={buffetPrice}
                onChange={(e) => setBuffetPrice(Number(e.target.value))}
                className="w-full rounded-sm border-2 border-zinc-950 p-2.5 font-bold text-zinc-950 focus:outline-none focus:ring-0"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <label className="text-zinc-400 uppercase tracking-wider">あなたの胃袋容量</label>
                <span className="text-zinc-950 font-bold">{stomachCapacity.toLocaleString()}g</span>
              </div>
              <input
                type="range"
                min="200"
                max="2500"
                step="50"
                value={stomachCapacity}
                onChange={(e) => setStomachCapacity(Number(e.target.value))}
                className="w-full h-2 bg-zinc-200 rounded-sm appearance-none cursor-pointer accent-zinc-950"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <label className="text-zinc-400 uppercase tracking-wider">お店の制限時間</label>
                <span className="text-zinc-950 font-bold">{stayTime}分</span>
              </div>
              <input
                type="range"
                min="10"
                max="180"
                step="5"
                value={stayTime}
                onChange={(e) => setStayTime(Number(e.target.value))}
                className="w-full h-2 bg-zinc-200 rounded-sm appearance-none cursor-pointer accent-zinc-950"
              />
            </div>
          </div>
        </div>

        {/* メニュー選択一覧 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">対象メニュー</h2>
            <span className="font-mono text-xs text-zinc-400">{selectedCount}件 選択中</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {menuList.map((menu) => (
              <MenuCard
                key={menu.menuId}
                item={menu}
                onToggleSelect={handleToggleSelect}
                onChangePreference={handleChangePreference}
              />
            ))}
          </div>
        </div>

        {/* カスタムメニュー追加 */}
        {showAddForm ? (
          <div className="rounded-sm border-2 border-zinc-200 bg-white p-5 shadow-[4px_4px_0_#18181b]">
            <h3 className="mb-4 text-sm font-black">カスタムメニューを追加</h3>
            <div className="space-y-3">
              <input
                className="w-full rounded-sm border border-zinc-300 px-3 py-2.5 text-sm font-bold outline-none focus:border-zinc-950 focus:ring-2 focus:ring-red-100"
                placeholder="メニュー名（例：和牛リブロース）"
                value={customForm.name}
                onChange={e => setCustomForm(prev => ({ ...prev, name: e.target.value }))}
              />
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { field: 'price', placeholder: '価格', unit: '円' },
                    { field: 'weight', placeholder: '重量', unit: 'g' },
                    { field: 'servingTime', placeholder: '時間', unit: '分' },
                  ] as const
                ).map(({ field, placeholder, unit }) => (
                  <div
                    key={field}
                    className="flex overflow-hidden rounded-sm border border-zinc-300 focus-within:border-zinc-950 focus-within:ring-2 focus-within:ring-red-100"
                  >
                    <input
                      className="w-full px-3 py-2.5 text-sm font-bold outline-none"
                      placeholder={placeholder}
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value={customForm[field]}
                      onChange={e =>
                        setCustomForm(prev => ({ ...prev, [field]: e.target.value }))
                      }
                    />
                    <span className="grid place-items-center border-l border-zinc-200 bg-zinc-50 px-2 text-xs font-bold text-zinc-500">
                      {unit}
                    </span>
                  </div>
                ))}
              </div>
              {formError && (
                <p className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                  {formError}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-sm bg-zinc-950 py-2.5 text-sm font-bold text-white transition hover:bg-zinc-800"
                  onClick={handleAddCustomMenu}
                >
                  追加する
                </button>
                <button
                  type="button"
                  className="rounded-sm border border-zinc-300 px-4 py-2.5 text-sm font-bold text-zinc-600 transition hover:bg-zinc-50"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormError('');
                    setCustomForm({ name: '', price: '', weight: '', servingTime: '' });
                  }}
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="w-full rounded-sm border-2 border-dashed border-zinc-300 py-4 text-sm font-bold text-zinc-500 transition hover:border-zinc-400 hover:bg-white hover:text-zinc-700"
            onClick={() => setShowAddForm(true)}
          >
            + カスタムメニューを追加
          </button>
        )}

        {/* 送信ボタン */}
        <button
          type="button"
          disabled={isSubmitting || selectedCount === 0}
          onClick={handleRunDP}
          className="w-full rounded-sm border-2 border-zinc-950 bg-red-700 px-5 py-4 text-base font-black text-white shadow-[4px_4px_0_#18181b] transition hover:bg-red-800 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? '計算中...' : 'コスパをチェック！'}
        </button>
      </main>
    </div>
  );
}
