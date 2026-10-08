
// components/search/search-box.tsx

import { Search, Sparkles } from "lucide-react";

export default function SearchBox({ defaultQuery = "" }: { defaultQuery?: string }) {
  return (
    <form
      action="/search"
      method="GET"
      className="mx-auto w-full max-w-3xl"
    >
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center">
          <Search
            size={21}
            className="mr-3 shrink-0 text-sky-500"
          />

          <input
            name="q"
            type="search"
            defaultValue={defaultQuery}
            placeholder="ماذا تبحث عنه؟ مثال: صيانة لابتوب، مطعم، صيدلية..."
            className="h-12 min-w-0 flex-1 bg-transparent px-3 text-right text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>

        <button
          type="submit"
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition hover:bg-sky-600"
        >
          <Search size={18} />
          بحث
        </button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/80">
        <Sparkles size={14} />

        <span>
          اكتب احتياجك بلغتك الطبيعية للعثور على الخدمة المناسبة
        </span>
      </div>
    </form>
  );
}
