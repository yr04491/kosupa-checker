import type { Menu } from '../types';

// メニュー1件にUI用の状態（選択中・好み度）を付与した型
export interface UIMenuItem extends Menu {
  isSelected: boolean;
  preference: number;
}

type MenuCardProps = {
  item: UIMenuItem;
  onToggleSelect: (menuId: string) => void;
  onChangePreference: (menuId: string, preference: number) => void;
};

export function MenuCard({ item, onToggleSelect, onChangePreference }: MenuCardProps) {
  return (
    <div
      className={`rounded-sm border-2 p-5 transition-all ${
        item.isSelected
          ? 'border-zinc-950 bg-white shadow-[4px_4px_0_#18181b]'
          : 'border-zinc-200 bg-zinc-50 opacity-50'
      }`}
    >
      {/* メニュー名とカテゴリ */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 cursor-pointer" onClick={() => onToggleSelect(item.menuId)}>
          <h3 className="text-base font-black text-zinc-950 leading-tight">{item.name}</h3>
          {item.category && (
            <span className="inline-block mt-1 font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              {item.category}
            </span>
          )}
        </div>
        <input
          type="checkbox"
          checked={item.isSelected}
          onChange={() => onToggleSelect(item.menuId)}
          className="h-4 w-4 rounded-sm border-2 border-zinc-950 text-zinc-950 focus:ring-0 focus:ring-offset-0 cursor-pointer"
        />
      </div>

      {/* ステータス（価格・重量・時間） */}
      <div className="grid grid-cols-3 gap-2 border-t border-b border-zinc-100 py-2.5 my-3 font-mono text-xs text-zinc-600">
        <div>
          <span className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Price</span>
          <span className="font-bold text-zinc-950">¥{item.price}</span>
        </div>
        <div>
          <span className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Weight</span>
          <span className="font-bold text-zinc-950">{item.weight}g</span>
        </div>
        <div>
          <span className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Time</span>
          <span className="font-bold text-zinc-950">{item.servingTime}分</span>
        </div>
      </div>

      {/* 好み度（1〜5） */}
      <div className={`transition-opacity duration-200 ${item.isSelected ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
        <label className="block font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
          Preference
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onChangePreference(item.menuId, num)}
              className={`h-7 w-7 font-mono text-xs font-bold border rounded-sm transition-all ${
                item.preference === num
                  ? 'bg-zinc-950 border-zinc-950 text-white font-black scale-105 shadow-[2px_2px_0_#000]'
                  : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
