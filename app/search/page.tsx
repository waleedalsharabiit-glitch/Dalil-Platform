import dynamic from "next/dynamic";
import SiteHeader from "@/components/layout/site-header";

const SmartSearch = dynamic(
  () => import("@/components/search/smart-search"),
  {
    loading: () => (
      <div
        dir="rtl"
        className="flex min-h-[70vh] items-center justify-center bg-slate-50"
      >
        <div className="rounded-2xl border border-sky-100 bg-white px-6 py-4 text-sm font-bold text-sky-600 shadow-lg">
          جارٍ تجهيز البحث الذكي...
        </div>
      </div>
    ),
  },
);

export default function SmartSearchPage() {
  return (
    <>
      <SiteHeader />
      <SmartSearch />
    </>
  );
}