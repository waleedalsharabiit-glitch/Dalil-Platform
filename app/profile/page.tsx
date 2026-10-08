
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import ProfileForm from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profile");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
  id: true,
  name: true,
  email: true,
  phone: true,
  image: true,
  role: true,
  isActive: true,
},
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-sky-600 via-sky-500 to-cyan-500 p-7 text-white shadow-xl shadow-sky-100 sm:p-10">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-black backdrop-blur">
              الحساب الشخصي
            </span>

            <h1 className="mt-4 text-3xl font-black sm:text-4xl">
              ملفك الشخصي
            </h1>

            <p className="mt-3 text-sm leading-7 text-sky-50 sm:text-base">
              حدّث بيانات حسابك ومعلومات التواصل الخاصة بك من مكان واحد.
            </p>
          </div>
        </div>

        <ProfileForm initialUser={user} />
      </div>
    </main>
  );
}

