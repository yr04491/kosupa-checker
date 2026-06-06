import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PRESET_MENUS } from '../mocks/menus';
import { solveDP } from '../lib/dp';
import type { Menu, SelectedMenu } from '../types';

const INPUT_STORAGE_KEY = 'kosupa-checker:input';

type InputCache = {
  stomachCapacity: number;
  stayTime: number;
  buffetPrice: number;
};

const CATEGORIES = ['肉', '海鮮', 'サイド'] as const;

// ---- MenuCard ----------------------------------------------------------------

type MenuCardProps = {
  menu: Menu;
  isSelected: boolean;
  preference: number;
  onToggle: () => void;
  onPreferenceChange: (pref: number) => void;
};

function MenuCard({ menu, isSelected, preference, onToggle, onPreferenceChange }: MenuCardProps) {
  return (
    <div
      className={`rounded-sm border-2 bg-white transition ${
        isSelected
          ? 'border-zinc-950 shadow-[4px_4px_0_#18181b]'
          : 'border-zinc-200 hover:border-zinc-400'
      }`}
    >
      <button
        type="button"
        className="flex w-full items-center gap-4 p-4 text-left"
        onClick={onToggle}
      >
        <div
          className={`grid h-5 w-5 flex-shrink-0 place-items-center rounded-sm border-2 transition ${
            isSelected ? 'border-zinc-950 bg-zinc-950' : 'border-zinc-300'
          }`}
        >
          {isSelected && (
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold">{menu.name}</p>
          <p className="font-mono text-xs text-zinc-500">
            ¥{menu.price.toLocaleString()} · {menu.weight}g · {menu.servingTime}分
          </p>
        </div>
        <div className={`font-mono text-sm font-black ${isSelected ? 'text-zinc-950' : 'text-zinc-300'}`}>
          ¥{menu.price.toLocaleString()}
        </div>
      </button>

      {isSelected && (
        <div className="border-t border-zinc-100 px-4 pb-4 pt-3">
          <p className="mb-2 text-xs font-bold text-zinc-500">好み度（コスパ計算の重みになります）</p>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map(pref => (
              <button
                key={pref}
                type="button"
                className={`h-9 flex-1 rounded-sm text-sm font-black transition ${
                  preference === pref
                    ? 'bg-red-700 text-white shadow-[2px_2px_0_#18181b]'
                    : 'border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100'
                }`}
                onClick={() => onPreferenceChange(pref)}
              >
                {pref}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- MenuPage ----------------------------------------------------------------

export default function MenuPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState<InputCache | null>(null);
  const [customMenus, setCustomMenus] = useState<Menu[]>([]);
  const [selections, setSelections] = useState<Map<string, number>>(new Map());
  const [showAddForm, setShowAddForm] = useState(false);
  const [customForm, setCustomForm] = useState({ name: '', price: '', weight: '', servingTime: '' });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const allMenus = [...PRESET_MENUS, ...customMenus];

  useEffect(() => {
    const raw = sessionStorage.getItem(INPUT_STORAGE_KEY);
    if (!raw) {
      navigate('/');
      return;
    }
    setInput(JSON.parse(raw));
  }, [navigate]);

  const toggleMenu = (menuId: string) => {
    setSelections(prev => {
      const next = new Map(prev);
      if (next.has(menuId)) {
        next.delete(menuId);
      } else {
        next.set(menuId, 3);
      }
      return next;
    });
  };

  const setPreference = (menuId: string, pref: number) => {
    setSelections(prev => new Map(prev).set(menuId, pref));
  };

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

    const newMenu: Menu = {
      menuId: `custom-${Date.now()}`,
      name: customForm.name.trim(),
      price,
      weight,
      servingTime,
      isPreset: false,
      category: 'カスタム',
      createdBy: null,
      createdAt: new Date(),
    };

    setCustomMenus(prev => [...prev, newMenu]);
    setSelections(prev => new Map(prev).set(newMenu.menuId, 3));
    setCustomForm({ name: '', price: '', weight: '', servingTime: '' });
    setShowAddForm(false);
  };

  const handleCalculate = async () => {
    if (!input) return;
    setSubmitError('');

    const selectedMenus: SelectedMenu[] = Array.from(selections.entries()).map(
      ([menuId, preference]) => ({ menuId, preference }),
    );

    if (selectedMenus.length === 0) {
      setSubmitError('メニューを1つ以上選択してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = solveDP({ ...input, selectedMenus, menus: allMenus });

      const docRef = await addDoc(collection(db, 'sessions'), {
        userId: null,
        input: { ...input, selectedMenus },
        result: { ...result, geminiComment: null },
        createdAt: serverTimestamp(),
      });

      navigate(`/result/${docRef.id}`);
    } catch {
      setSubmitError('保存に失敗しました。もう一度お試しください。');
      setIsSubmitting(false);
    }
  };

  if (!input) return null;

  return (
    <div className="min-h-screen bg-stone-50 pb-32 text-zinc-950">
      <main className="mx-auto max-w-2xl space-y-8 px-5 py-8 sm:px-8">

        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-red-700">
            Kosupa Checker
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="font-mono text-xs text-zinc-400 transition hover:text-zinc-600"
              onClick={() => navigate('/')}
            >
              ← 戻る
            </button>
            <span className="rounded-sm bg-zinc-950 px-3 py-1.5 font-mono text-xs font-bold text-white">
              /menu
            </span>
          </div>
        </div>

        {/* タイトル */}
        <div>
          <h1 className="text-3xl font-black">メニューを選択</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            食べたいメニューを選んで、好み度（1〜5）を設定してください。
            好み度が高いほど優先的に組み合わせに選ばれます。
          </p>
        </div>

        {/* 入力条件サマリー */}
        <div className="grid grid-cols-3 gap-3">
          <div className="border-l-4 border-red-700 bg-white px-3 py-2 shadow-sm">
            <p className="text-xs font-bold text-zinc-500">胃袋</p>
            <p className="font-mono text-lg font-black">{input.stomachCapacity.toLocaleString()}g</p>
          </div>
          <div className="border-l-4 border-zinc-900 bg-white px-3 py-2 shadow-sm">
            <p className="text-xs font-bold text-zinc-500">滞在</p>
            <p className="font-mono text-lg font-black">{input.stayTime}分</p>
          </div>
          <div className="border-l-4 border-amber-500 bg-white px-3 py-2 shadow-sm">
            <p className="text-xs font-bold text-zinc-500">食べ放題</p>
            <p className="font-mono text-lg font-black">¥{input.buffetPrice.toLocaleString()}</p>
          </div>
        </div>

        {/* プリセットメニュー（カテゴリ別） */}
        {CATEGORIES.map(category => {
          const items = PRESET_MENUS.filter(m => m.category === category);
          if (items.length === 0) return null;
          return (
            <section key={category}>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">
                {category}
              </h2>
              <div className="space-y-2">
                {items.map(menu => (
                  <MenuCard
                    key={menu.menuId}
                    menu={menu}
                    isSelected={selections.has(menu.menuId)}
                    preference={selections.get(menu.menuId) ?? 3}
                    onToggle={() => toggleMenu(menu.menuId)}
                    onPreferenceChange={pref => setPreference(menu.menuId, pref)}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {/* カスタムメニュー */}
        {customMenus.length > 0 && (
          <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">
              カスタム
            </h2>
            <div className="space-y-2">
              {customMenus.map(menu => (
                <MenuCard
                  key={menu.menuId}
                  menu={menu}
                  isSelected={selections.has(menu.menuId)}
                  preference={selections.get(menu.menuId) ?? 3}
                  onToggle={() => toggleMenu(menu.menuId)}
                  onPreferenceChange={pref => setPreference(menu.menuId, pref)}
                />
              ))}
            </div>
          </section>
        )}

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

      </main>

      {/* スティッキーフッター */}
      <div className="fixed bottom-0 left-0 right-0 border-t-2 border-zinc-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-5 py-4 sm:px-8">
          {submitError && (
            <p className="mb-3 text-sm font-bold text-red-700">{submitError}</p>
          )}
          <div className="flex items-center gap-4">
            <div className="flex-1 text-sm text-zinc-500">
              <span className="font-mono font-black text-zinc-950">{selections.size}</span> 件選択中
            </div>
            <button
              type="button"
              className="rounded-sm bg-red-700 px-8 py-4 text-base font-black text-white shadow-[4px_4px_0_#18181b] transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40 active:translate-x-1 active:translate-y-1 active:shadow-none"
              disabled={isSubmitting || selections.size === 0}
              onClick={handleCalculate}
            >
              {isSubmitting ? '計算中...' : 'コスパを計算する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
