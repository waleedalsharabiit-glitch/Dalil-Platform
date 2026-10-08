import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const categoriesCount = await prisma.category.count();

    return NextResponse.json({
      success: true,
      database: "connected",
      categoriesCount,
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    return NextResponse.json(
      {
        success: false,
        database: "disconnected",
      },
      { status: 500 },
    );
  }
}