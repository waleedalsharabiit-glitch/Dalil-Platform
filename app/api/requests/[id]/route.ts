
/* =========================================================
FILE: app/api/requests/[id]/route.ts
========================================================= */

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { RequestStatus } from "@/generated/prisma/client";
import {
  getRequestNotificationLink,
  requestStatusMeta,
} from "@/lib/requests/request-status";

interface RouteProps {
params: Promise<{
id: string;
}>;
}

const updateRequestSchema = z.object({
status: z.enum([
"PENDING",
"ACCEPTED",
"REJECTED",
"CANCELLED",
"COMPLETED",
]),
});

const statusLabels: Record<RequestStatus, string> = {
PENDING: requestStatusMeta.PENDING.label,
ACCEPTED: requestStatusMeta.ACCEPTED.label,
REJECTED: requestStatusMeta.REJECTED.label,
CANCELLED: requestStatusMeta.CANCELLED.label,
COMPLETED: requestStatusMeta.COMPLETED.label,
};

function isAdmin(role: string | undefined) {
return role === "ADMIN" || role === "SUPER_ADMIN";
}

function isBusinessOwner(role: string | undefined) {
return role === "BUSINESS_OWNER";
}

function canOwnerMove(
current: RequestStatus,
next: RequestStatus,
) {
if (current === "PENDING") {
return next === "ACCEPTED" || next === "REJECTED";
}

if (current === "ACCEPTED") {
return next === "COMPLETED" || next === "CANCELLED";
}

return false;
}

function canUserMove(
current: RequestStatus,
next: RequestStatus,
) {
if (next !== "CANCELLED") {
return false;
}

return current === "PENDING" || current === "ACCEPTED";
}

function canAdminMove(
current: RequestStatus,
next: RequestStatus,
) {
if (current === "COMPLETED") {
return false;
}

if (current === "REJECTED" || current === "CANCELLED") {
return false;
}

return [
"PENDING",
"ACCEPTED",
"REJECTED",
"CANCELLED",
"COMPLETED",
].includes(next);
}

export async function GET(
_: Request,
{ params }: RouteProps,
) {
try {
const session = await auth();


if (!session?.user?.id) {
  return NextResponse.json(
    { message: "يجب تسجيل الدخول أولًا" },
    { status: 401 },
  );
}

const { id } = await params;

const serviceRequest =
  await prisma.serviceRequest.findUnique({
    where: {
      id,
    },

    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
        },
      },

      business: {
        select: {
          id: true,
          name: true,
          slug: true,
          ownerId: true,
          phone: true,
          whatsapp: true,
          website: true,
          status: true,
          isVerified: true,

          images: {
            where: {
              isPrimary: true,
            },
            take: 1,
            select: {
              url: true,
              altText: true,
            },
          },

          locations: {
            take: 1,
            select: {
              address: true,
              city: true,
              district: true,
              latitude: true,
              longitude: true,
            },
          },
        },
      },

      service: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

if (!serviceRequest) {
  return NextResponse.json(
    { message: "الطلب غير موجود" },
    { status: 404 },
  );
}

const isOwner =
  serviceRequest.business.ownerId === session.user.id;

const isUser =
  serviceRequest.userId === session.user.id;

const admin = isAdmin(session.user.role);

if (!isOwner && !isUser && !admin) {
  return NextResponse.json(
    { message: "ليس لديك صلاحية لعرض هذا الطلب" },
    { status: 403 },
  );
}

return NextResponse.json({
  viewer: {
    id: session.user.id,
    role: session.user.role,
    isOwner,
    isUser,
    isAdmin: admin,
  },
  request: serviceRequest,
});


} catch (error) {
console.error("GET /api/requests/[id] error:", error);


return NextResponse.json(
  { message: "حدث خطأ أثناء تحميل الطلب" },
  { status: 500 },
);


}
}

export async function PATCH(
request: Request,
{ params }: RouteProps,
) {
try {
const session = await auth();


if (!session?.user?.id) {
  return NextResponse.json(
    { message: "يجب تسجيل الدخول أولًا" },
    { status: 401 },
  );
}

const { id } = await params;

const body = await request.json();
const data = updateRequestSchema.parse(body);

const existing =
  await prisma.serviceRequest.findUnique({
    where: {
      id,
    },

    select: {
      id: true,
      userId: true,
      status: true,
      title: true,

      business: {
        select: {
          id: true,
          name: true,
          ownerId: true,
        },
      },
    },
  });

if (!existing) {
  return NextResponse.json(
    { message: "الطلب غير موجود" },
    { status: 404 },
  );
}

const current = existing.status;
const next = data.status as RequestStatus;

const owner =
  existing.business.ownerId === session.user.id;

const user =
  existing.userId === session.user.id;

const admin = isAdmin(session.user.role);

if (!owner && !user && !admin) {
  return NextResponse.json(
    { message: "ليس لديك صلاحية لتعديل هذا الطلب" },
    { status: 403 },
  );
}

if (admin) {
  if (!canAdminMove(current, next)) {
    return NextResponse.json(
      { message: "انتقال حالة الطلب غير مسموح" },
      { status: 400 },
    );
  }
} else if (owner && isBusinessOwner(session.user.role)) {
  if (!canOwnerMove(current, next)) {
    return NextResponse.json(
      {
        message:
          "يمكن لصاحب النشاط قبول أو رفض الطلب المعلق، ثم إكمال الطلب المقبول أو إلغاؤه",
      },
      { status: 400 },
    );
  }
} else if (user) {
  if (!canUserMove(current, next)) {
    return NextResponse.json(
      { message: "يمكنك إلغاء الطلب فقط أثناء تنفيذه" },
      { status: 400 },
    );
  }
} else {
  return NextResponse.json(
    { message: "ليس لديك الصلاحية المناسبة لهذا الإجراء" },
    { status: 403 },
  );
}

if (current === next) {
  return NextResponse.json(
    { message: "الطلب موجود بالفعل في هذه الحالة" },
    { status: 400 },
  );
}

const updated =
  await prisma.$transaction(async (tx) => {
    const result =
      await tx.serviceRequest.update({
        where: {
          id,
        },

        data: {
          status: next,
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              ownerId: true,
              phone: true,
              whatsapp: true,
              website: true,
              status: true,
              isVerified: true,
              images: {
                where: {
                  isPrimary: true,
                },
                take: 1,
                select: {
                  url: true,
                  altText: true,
                },
              },
              locations: {
                take: 1,
                select: {
                  address: true,
                  city: true,
                  district: true,
                  latitude: true,
                  longitude: true,
                },
              },
            },
          },

          service: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

    const notificationUserId =
      user && !owner
        ? existing.business.ownerId
        : existing.userId;

    const notificationLink = getRequestNotificationLink(
      existing.id,
      owner ? "USER" : "OWNER",
    );

    await tx.notification.create({
      data: {
        userId: notificationUserId,
        type: "REQUEST",
        title: `تحديث حالة الطلب: ${statusLabels[next]}`,
        message: `تم تحديث طلب "${existing.title}" إلى ${statusLabels[next]}.`,
        link: notificationLink,
      },
    });

    return result;
  });

return NextResponse.json({
  message: `تم تحديث الطلب إلى ${statusLabels[next]}`,
  request: updated,
});


} catch (error) {
if (error instanceof z.ZodError) {
return NextResponse.json(
{
message: "حالة الطلب غير صحيحة",
errors: error.flatten().fieldErrors,
},
{ status: 400 },
);
}


console.error("PATCH /api/requests/[id] error:", error);

return NextResponse.json(
  { message: "حدث خطأ أثناء تحديث الطلب" },
  { status: 500 },
);


}
}
