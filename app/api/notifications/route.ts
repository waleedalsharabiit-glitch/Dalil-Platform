/* =========================================================
FILE: app/api/notifications/route.ts
========================================================= */

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
try {
const session = await auth();


if (!session?.user?.id) {
  return NextResponse.json(
    { message: "يجب تسجيل الدخول أولًا" },
    { status: 401 },
  );
}

const [notifications, unreadCount] =
  await prisma.$transaction([
    prisma.notification.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    }),

    prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    }),
  ]);

return NextResponse.json({
  notifications,
  unreadCount,
});


} catch (error) {
console.error(
"GET /api/notifications error:",
error,
);


return NextResponse.json(
  { message: "تعذر تحميل الإشعارات" },
  { status: 500 },
);


}
}

export async function PATCH(request: Request) {
try {
const session = await auth();


if (!session?.user?.id) {
  return NextResponse.json(
    { message: "يجب تسجيل الدخول أولًا" },
    { status: 401 },
  );
}

const body = await request.json();

if (body.all === true) {
  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return NextResponse.json({
    message: "تم تعليم جميع الإشعارات كمقروءة",
  });
}

if (
  typeof body.id !== "string" ||
  !body.id
) {
  return NextResponse.json(
    { message: "معرف الإشعار مطلوب" },
    { status: 400 },
  );
}

const notification =
  await prisma.notification.findFirst({
    where: {
      id: body.id,
      userId: session.user.id,
    },
  });

if (!notification) {
  return NextResponse.json(
    { message: "الإشعار غير موجود" },
    { status: 404 },
  );
}

await prisma.notification.update({
  where: {
    id: notification.id,
  },
  data: {
    isRead: true,
  },
});

return NextResponse.json({
  message: "تم تعليم الإشعار كمقروء",
});


} catch (error) {
console.error(
"PATCH /api/notifications error:",
error,
);


return NextResponse.json(
  { message: "تعذر تحديث الإشعار" },
  { status: 500 },
);


}
}
