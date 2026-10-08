import Link from "next/link";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";

export default async function MyReviewsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const reviews = await prisma.review.findMany({
    where: { userId: session.user.id },
    include: { business: { select: { name: true, slug: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return <div className="min-h-screen bg-slate-50" dir="rtl"><SiteHeader /><main className="mx-auto max-w-4xl px-4 py-10 sm:px-6"><h1 className="flex items-center gap-3 text-2xl font-black text-slate-900"><Star className="fill-amber-400 text-amber-400" />مراجعاتي</h1><p className="mt-2 text-sm text-slate-500">تقييماتك المنشورة على الأنشطة.</p>{reviews.length ? <div className="mt-7 space-y-4">{reviews.map((review) => <article key={review.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><Link href={`/businesses/${review.business.slug}`} className="font-bold text-slate-900 hover:text-sky-700">{review.business.name}</Link><div className="mt-2 flex gap-1">{Array.from({ length: 5 }, (_, index) => <Star key={index} className={`h-4 w-4 ${index < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />)}</div></div><time className="text-xs text-slate-400">{review.updatedAt.toLocaleDateString("ar-SA")}</time></div>{review.comment && <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{review.comment}</p>}</article>)}</div> : <section className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><Star className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-4 font-bold text-slate-800">لم تضف مراجعات بعد</h2><p className="mt-2 text-sm text-slate-500">شارك تجربتك مع الأنشطة التي زرتها.</p><Link href="/businesses" className="mt-5 inline-flex rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white">اكتشف الأنشطة</Link></section>}</main><SiteFooter /></div>;
}
