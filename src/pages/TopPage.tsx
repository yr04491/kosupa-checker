import { type SyntheticEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { testFirestoreConnection } from "../lib/accessTest";

const INITIAL_INPUT = {
  stomachCapacity: 800,
  stayTime: 90,
  buffetPrice: 3000,
};

const INPUT_STORAGE_KEY = "kosupa-checker:input";

export default function TopPage() {
  const navigate = useNavigate();
  const [stomachCapacity, setStomachCapacity] = useState(
    INITIAL_INPUT.stomachCapacity,
  );
  const [stayTime, setStayTime] = useState(INITIAL_INPUT.stayTime);
  const [buffetPrice, setBuffetPrice] = useState(INITIAL_INPUT.buffetPrice);
  const [error, setError] = useState("");

  useEffect(() => {
    testFirestoreConnection();
  }, []);

  const pricePerGram = useMemo(() => {
    if (stomachCapacity <= 0) return 0;
    return Math.round((buffetPrice / stomachCapacity) * 10) / 10;
  }, [buffetPrice, stomachCapacity]);

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (stomachCapacity <= 0 || stayTime <= 0 || buffetPrice <= 0) {
      setError("すべて1以上の数値で入力してください。");
      return;
    }

    sessionStorage.setItem(
      INPUT_STORAGE_KEY,
      JSON.stringify({
        stomachCapacity,
        stayTime,
        buffetPrice,
      }),
    );

    navigate("/menu");
  };

  return (
    <div className="min-h-screen bg-stone-50 text-zinc-950">
      <main className="mx-auto grid min-h-screen w-full max-w-6xl gap-10 px-5 py-8 md:grid-cols-[1fr_420px] md:items-center md:px-8 lg:gap-16">
        <section className="space-y-8">
          <div className="space-y-5">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-red-700">
              Kosupa Checker
            </p>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-black leading-tight text-zinc-950 sm:text-5xl">
                その食べ放題ほんとうにお得？胃袋と時間からコスパをチェック！
              </h1>
              <p className="max-w-xl text-base leading-8 text-zinc-700">
                胃袋容量・滞在時間・食べ放題料金を入力して、メニュー選択へ進みます。
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="border-l-4 border-red-700 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-bold text-zinc-500">胃袋容量</p>
              <p className="mt-1 font-mono text-xl font-black">
                {stomachCapacity.toLocaleString()}g
              </p>
            </div>
            <div className="border-l-4 border-zinc-900 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-bold text-zinc-500">滞在時間</p>
              <p className="mt-1 font-mono text-xl font-black">
                {stayTime.toLocaleString()}分
              </p>
            </div>
            <div className="border-l-4 border-amber-500 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-bold text-zinc-500">1gあたり</p>
              <p className="mt-1 font-mono text-xl font-black">
                {pricePerGram.toLocaleString()}円
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-sm border-2 border-zinc-200 bg-white p-5 shadow-[8px_8px_0_#18181b] sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-zinc-200 pb-5">
            <div>
              <p className="font-mono text-xs font-bold text-zinc-500">
                Phase 1
              </p>
              <h2 className="mt-1 text-2xl font-black">入力フォーム</h2>
            </div>
            <div className="rounded-sm bg-zinc-950 px-3 py-2 font-mono text-xs font-bold text-white">
              /
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-bold text-zinc-800">胃袋容量</span>
              <div className="mt-2 flex overflow-hidden rounded-sm border border-zinc-300 bg-white focus-within:border-zinc-950 focus-within:ring-2 focus-within:ring-red-200">
                <input
                  className="w-full px-4 py-3 text-lg font-bold outline-none"
                  min="1"
                  inputMode="numeric"
                  type="number"
                  value={stomachCapacity}
                  onChange={(event) =>
                    setStomachCapacity(Number(event.target.value))
                  }
                />
                <span className="grid w-14 place-items-center border-l border-zinc-200 bg-zinc-50 text-sm font-bold text-zinc-600">
                  g
                </span>
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-zinc-800">滞在時間</span>
              <div className="mt-2 flex overflow-hidden rounded-sm border border-zinc-300 bg-white focus-within:border-zinc-950 focus-within:ring-2 focus-within:ring-red-200">
                <input
                  className="w-full px-4 py-3 text-lg font-bold outline-none"
                  min="1"
                  inputMode="numeric"
                  type="number"
                  value={stayTime}
                  onChange={(event) => setStayTime(Number(event.target.value))}
                />
                <span className="grid w-14 place-items-center border-l border-zinc-200 bg-zinc-50 text-sm font-bold text-zinc-600">
                  分
                </span>
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-zinc-800">
                食べ放題料金
              </span>
              <div className="mt-2 flex overflow-hidden rounded-sm border border-zinc-300 bg-white focus-within:border-zinc-950 focus-within:ring-2 focus-within:ring-red-200">
                <input
                  className="w-full px-4 py-3 text-lg font-bold outline-none"
                  min="1"
                  inputMode="numeric"
                  type="number"
                  value={buffetPrice}
                  onChange={(event) =>
                    setBuffetPrice(Number(event.target.value))
                  }
                />
                <span className="grid w-14 place-items-center border-l border-zinc-200 bg-zinc-50 text-sm font-bold text-zinc-600">
                  円
                </span>
              </div>
            </label>

            {error && (
              <p className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </p>
            )}

            <button
              className="w-full rounded-sm bg-red-700 px-5 py-4 text-base font-black text-white shadow-[4px_4px_0_#18181b] transition hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-200 active:translate-x-1 active:translate-y-1 active:shadow-none"
              type="submit"
            >
              メニュー選択へ進む
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
