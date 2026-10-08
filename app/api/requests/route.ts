/* =========================================================
FILE: app/api/requests/route.ts
========================================================= */

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { RequestStatus } from "@/generated/prisma/client";
import { getRequestNotificationLink } from "@/lib/requests/request-status";

const createRequestSchema = z.object({
businessId: z.string().min(1, "النشاط مطلوب"),
serviceId: z.string().min(1).nullable().optional(),
title: z
.string()
.trim()
.min(3, "عنوان الطلب يجب أن يكون 3 أحرف على الأقل")
.max(150, "عنوان الطلب طويل جدًا"),
description: z
.string()
.trim()
.min(5, "يرجى كتابة تفاصيل الطلب")
.max(2000, "تفاصيل الطلب طويلة جدًا"),
});

export async function GET() {
try {
const session = await auth();


if (!session?.user?.id) {
  return NextResponse.json(
    { message: "يجب تسجيل الدخول أولًا" },
    { status: 401 },
  );
}

const userId = session.user.id;
const role = session.user.role;

const isOwner =
  role === "BUSINESS_OWNER" ||
  role === "ADMIN" ||
  role === "SUPER_ADMIN";

const requests = await prisma.serviceRequest.findMany({
  where: isOwner
    ? {
        business: {
          ownerId: userId,
        },
      }
    : {
        userId,
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
            city: true,
            district: true,
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

  orderBy: {
    createdAt: "desc",
  },
});

return NextResponse.json({
  viewer: {
    id: userId,
    role,
    mode: isOwner ? "OWNER" : "USER",
  },
  requests,
});


} catch (error) {
console.error("GET /api/requests error:", error);


return NextResponse.json(
  { message: "حدث خطأ أثناء تحميل الطلبات" },
  { status: 500 },
);


}
}

export async function POST(request: Request) {
try {
const session = await auth();


if (!session?.user?.id) {
  return NextResponse.json(
    { message: "يجب تسجيل الدخول لإنشاء طلب" },
    { status: 401 },
  );
}

const body = await request.json();
const data = createRequestSchema.parse(body);

const business = await prisma.business.findFirst({
  where: {
    id: data.businessId,
    status: "ACTIVE",
  },
  select: {
    id: true,
    name: true,
    ownerId: true,
  },
});

if (!business) {
  return NextResponse.json(
    { message: "النشاط غير موجود أو غير متاح حاليًا" },
    { status: 404 },
  );
}

if (business.ownerId === session.user.id) {
  return NextResponse.json(
    { message: "لا يمكنك إرسال طلب إلى نشاطك الخاص" },
    { status: 400 },
  );
}

if (data.serviceId) {
  const service = await prisma.service.findFirst({
    where: {
      id: data.serviceId,
      isActive: true,
      businesses: {
        some: {
          businessId: data.businessId,
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (!service) {
    return NextResponse.json(
      { message: "الخدمة المحددة غير مرتبطة بهذا النشاط" },
      { status: 400 },
    );
  }
}

const existingPendingRequest =
  await prisma.serviceRequest.findFirst({
    where: {
      userId: session.user.id,
      businessId: data.businessId,
      status: RequestStatus.PENDING,
    },
    select: {
      id: true,
    },
  });

if (existingPendingRequest) {
  return NextResponse.json(
    {
      message: "لديك طلب قيد الانتظار لهذا النشاط بالفعل",
      requestId: existingPendingRequest.id,
    },
    { status: 409 },
  );
}

const serviceRequest = await prisma.$transaction(async (tx) => {
  const created = await tx.serviceRequest.create({
    data: {
      userId: session.user.id,
      businessId: data.businessId,
      serviceId: data.serviceId ?? null,
      title: data.title,
      description: data.description,
      status: RequestStatus.PENDING,
    },

    include: {
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },

      service: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  await tx.notification.create({
    data: {
      userId: business.ownerId,
      type: "REQUEST",
      title: "طلب خدمة جديد",
      message: `لديك طلب خدمة جديد في ${business.name}: ${data.title}`,
      link: getRequestNotificationLink(created.id, "OWNER"),
    },
  });

  return created;
});

return NextResponse.json(
  {
    message: "تم إرسال الطلب بنجاح",
    request: serviceRequest,
  },
  { status: 201 },
);


} catch (error) {
if (error instanceof z.ZodError) {
return NextResponse.json(
{
message: "بيانات الطلب غير صحيحة",
errors: error.flatten().fieldErrors,
},
{ status: 400 },
);
}


console.error("POST /api/requests error:", error);

return NextResponse.json(
  { message: "حدث خطأ أثناء إنشاء الطلب" },
  { status: 500 },
);


}
}
