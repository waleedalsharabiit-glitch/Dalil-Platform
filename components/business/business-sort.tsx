"use client";

import { SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface BusinessSortProps {
  value: string;
}

export default function BusinessSort({ value }: BusinessSortProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(nextValue: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextValue === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", nextValue);
    }

    const query = params.toString();

    router.push(query ? `/businesses?${query}` : "/businesses");
  }

  return (
    <div className="flex items-center gap-2">
      <SlidersHorizontal className="h-4 w-4 text-slate-400" />

      <select
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-sky-400"
      >
        <option value="newest">الأحدث</option>
        <option value="verified">الموثقة أولًا</option>
        <option value="name">الاسم</option>
      </select>
    </div>
  );
}
