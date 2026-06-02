import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { solveDP } from '../lib/dp';
import { MOCK_SESSION } from '../mocks/session';
import { PRESET_MENUS } from '../mocks/menus';
import type { Session } from '../types';

type LoadState =
  | { status: 'loading' }
  | { status: 'ok'; session: Session }
  | { status: 'error'; message: string };

function buildMockSession(): Session {
  const result = solveDP({
    stomachCapacity: MOCK_SESSION.input.stomachCapacity,
    stayTime: MOCK_SESSION.input.stayTime,
    buffetPrice: MOCK_SESSION.input.buffetPrice,
    selectedMenus: MOCK_SESSION.input.selectedMenus,
    menus: PRESET_MENUS,
  });
  return { ...MOCK_SESSION, result: { ...result, geminiComment: null } };
}

export default function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    if (sessionId === 'mock') {
      setState({ status: 'ok', session: buildMockSession() });
      return;
    }

    (async () => {
      try {
        const snap = await getDoc(doc(db, 'sessions', sessionId!));
        if (!snap.exists()) {
          setState({ status: 'error', message: 'セッションが見つかりません' });
          return;
        }
        const data = snap.data();
        setState({
          status: 'ok',
          session: {
            ...data,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
          } as Session,
        });
      } catch {
        setState({ status: 'error', message: 'データの取得に失敗しました' });
      }
    })();
  }, [sessionId]);

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="font-mono text-sm text-zinc-500">計算中...</p>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-stone-50">
        <p className="text-zinc-700">{state.message}</p>
        <button
          className="rounded-sm bg-zinc-950 px-5 py-3 text-sm font-bold text-white"
          onClick={() => navigate('/')}
        >
          トップへ戻る
        </button>
      </div>
    );
  }

  const { session } = state;
  const { result, input } = session;
  const isBuffet = result.verdict === 'buffet';
  const menus = PRESET_MENUS;

  return (
    <div className="min-h-screen bg-stone-50 text-zinc-950">
      <main className="mx-auto max-w-2xl space-y-6 px-5 py-10 sm:px-8">

        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-red-700">
            Kosupa Checker
          </p>
          <p className="font-mono text-xs text-zinc-400">/result</p>
        </div>

        {/* 判定バナー */}
        <div
          className={`rounded-sm border-2 p-6 shadow-[6px_6px_0_#18181b] ${
            isBuffet
              ? 'border-red-700 bg-red-700 text-white'
              : 'border-zinc-950 bg-zinc-950 text-white'
          }`}
        >
          <p className="font-mono text-xs font-bold uppercase tracking-widest opacity-70">
            Verdict
          </p>
          <p className="mt-2 text-3xl font-black sm:text-4xl">
            {isBuffet ? '食べ放題がお得！' : '単品注文がお得！'}
          </p>
          <p className="mt-3 font-mono text-lg font-bold">
            {isBuffet
              ? `食べ放題の方が ¥${Math.abs(result.difference).toLocaleString()} お得`
              : `単品の方が ¥${Math.abs(result.difference).toLocaleString()} お得`}
          </p>
        </div>

        {/* 最適な組み合わせ */}
        <div className="rounded-sm border-2 border-zinc-200 bg-white p-5 shadow-[6px_6px_0_#18181b]">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-zinc-500">
            最適な組み合わせ
          </h2>
          <div className="space-y-2">
            {result.optimalCombination.map(({ menuId, quantity }) => {
              const menu = menus.find(m => m.menuId === menuId);
              if (!menu) return null;
              return (
                <div key={menuId} className="flex items-center justify-between border-b border-zinc-100 py-2 last:border-0">
                  <span className="font-bold text-zinc-800">
                    {menu.name}
                    <span className="ml-2 font-mono text-sm text-zinc-400">× {quantity}</span>
                  </span>
                  <span className="font-mono font-bold">
                    ¥{(menu.price * quantity).toLocaleString()}
                  </span>
                </div>
              );
            })}
            {result.optimalCombination.length === 0 && (
              <p className="text-sm text-zinc-500">選択されたメニューで食べられる組み合わせがありません</p>
            )}
          </div>
        </div>

        {/* 金額比較 */}
        <div className="rounded-sm border-2 border-zinc-200 bg-white p-5 shadow-[6px_6px_0_#18181b]">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-zinc-500">
            金額比較
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-zinc-600">単品合計</span>
              <span className="font-mono font-bold">¥{result.totalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">食べ放題料金</span>
              <span className="font-mono font-bold">¥{input.buffetPrice.toLocaleString()}</span>
            </div>
            <div className={`flex justify-between border-t-2 border-zinc-200 pt-3 ${isBuffet ? 'text-red-700' : 'text-zinc-950'}`}>
              <span className="font-bold">差額</span>
              <span className="font-mono text-lg font-black">
                {result.difference > 0 ? '+' : ''}¥{result.difference.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* 入力条件 */}
        <div className="rounded-sm border border-zinc-200 bg-zinc-50 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">入力条件</p>
          <div className="flex flex-wrap gap-4 font-mono text-sm text-zinc-600">
            <span>胃袋 {input.stomachCapacity.toLocaleString()}g</span>
            <span>滞在 {input.stayTime}分</span>
            <span>食べ放題 ¥{input.buffetPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* もう一度 */}
        <button
          className="w-full rounded-sm border-2 border-zinc-950 bg-white px-5 py-4 text-base font-black shadow-[4px_4px_0_#18181b] transition hover:bg-zinc-50 active:translate-x-1 active:translate-y-1 active:shadow-none"
          onClick={() => navigate('/')}
        >
          もう一度試す
        </button>
      </main>
    </div>
  );
}
