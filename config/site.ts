const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const siteConfig = {
  name: "دليل",
  nameEn: "Dalil",
  description:
    "منصة ذكية للعثور على الخدمات والأعمال والأماكن المحلية بسهولة، مع تقييمات وتواصل مباشر وموقع جغرافي دقيق.",
  url: baseUrl,
  locale: "ar",
  direction: "rtl",
  defaultImage: "/og-image.svg",
  keywords: [
    "دليل",
    "Dalil",
    "خدمات محلية",
    "أماكن",
    "مطاعم",
    "صيدليات",
    "خدمات",
    "تقييمات محلات",
    "بحث عن خدمات",
    "مواقع محلية",
  ] as string[],
  socialLinks: [
    { name: "Instagram", href: "https://instagram.com/dalil" },
    { name: "Facebook", href: "https://facebook.com/dalil" },
    { name: "X", href: "https://x.com/dalil" },
    { name: "WhatsApp", href: "https://wa.me/966500000000" },
  ],
} as const;