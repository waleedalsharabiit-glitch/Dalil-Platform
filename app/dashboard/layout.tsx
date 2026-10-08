
import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

import DashboardHeader from "@/components/dashboard/dashboard-header";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      name: true,
      role: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const roleLabel =
    user.role === "BUSINESS_OWNER"
      ? "لوحة صاحب النشاط"
      : "لوحة المستخدم";

  return (
    <div className="min-h-screen bg-sky-50/60">
      <div className="flex min-h-screen">
        <DashboardSidebar role={user.role} />

        <div className="min-w-0 flex-1">
          <DashboardHeader
            name={user.name || "مستخدم"}
            roleLabel={roleLabel}
          />

          <main className="min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
