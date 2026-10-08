import { NextResponse } from "next/server";
import { z } from "zod";

import { searchBusinesses } from "@/lib/search/search-businesses";

const querySchema = z.string().trim().min(2).max(300);

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) {
    return NextResponse.json({ message: "اكتب عبارة بحث من حرفين إلى 300 حرف" }, { status: 400 });
  }

  try {
    return NextResponse.json(await searchBusinesses(parsed.data));
  } catch (error) {
    console.error("GET /api/search error:", error);
    return NextResponse.json({ message: "تعذر البحث الآن" }, { status: 500 });
  }
}
