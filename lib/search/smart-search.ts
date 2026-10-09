export type SmartSearchIntent = {
  originalQuery: string;
  normalizedQuery: string;
  categoryKeywords: string[];
  location: string | null;
  wantsNearby: boolean;
  searchTerms: string[];
};

const STOP_WORDS = new Set([
  "اريد",
  "ابحث",
  "عن",
  "لي",
  "من",
  "في",
  "الى",
  "على",
  "مع",
  "الذي",
  "التي",
  "يبيع",
  "بيع",
  "محل",
  "مكان",
  "نشاط",
  "نشاطا",
  "قريب",
  "قريبة",
  "قريباً",
  "مني",
  "بالقرب",
  "حول",
  "قريبين",
  "افضل",
  "أفضل",
  "ارخص",
  "رخيص",
  "رخيصة",
  "ابغى",
  "عايز",
  "احتاج",
  "احتاجه",
]);

const CATEGORY_GROUPS: {
  keywords: string[];
  aliases: string[];
}[] = [
  {
    keywords: ["مطعم", "مطاعم"],
    aliases: [
      "مطعم",
      "مطاعم",
      "مأكولات",
      "وجبات",
      "اكل",
      "أكل",
      "food",
      "restaurant",
    ],
  },
  {
    keywords: ["كمبيوتر", "حاسوب"],
    aliases: [
      "كمبيوتر",
      "حاسوب",
      "حاسبات",
      "كمبيوترات",
      "لابتوب",
      "لابتوبات",
      "حاسب",
      "computer",
      "laptop",
    ],
  },
  {
    keywords: ["صيدلية", "صيدليات"],
    aliases: [
      "صيدلية",
      "صيدليات",
      "دواء",
      "ادوية",
      "أدوية",
      "pharmacy",
    ],
  },
  {
    keywords: ["جوالات", "هواتف"],
    aliases: [
      "جوال",
      "جوالات",
      "هاتف",
      "هواتف",
      "موبايل",
      "موبايلات",
      "mobile",
      "phone",
    ],
  },
  {
    keywords: ["شبكات", "اتصالات"],
    aliases: [
      "شبكات",
      "اتصالات",
      "ميكروتك",
      "mikrotik",
      "network",
      "networking",
    ],
  },
  {
    keywords: ["صيانة", "إصلاح"],
    aliases: [
      "صيانة",
      "اصلاح",
      "إصلاح",
      "تصليح",
      "ورشة",
      "ورش",
      "repair",
    ],
  },
  {
    keywords: ["سوبرماركت", "بقالة"],
    aliases: [
      "سوبرماركت",
      "سوبر ماركت",
      "بقالة",
      "بقالات",
      "مواد غذائية",
      "grocery",
    ],
  },
  {
    keywords: ["ملابس"],
    aliases: [
      "ملابس",
      "ملابس رجالية",
      "ملابس نسائية",
      "ملابس اطفال",
      "ملابس أطفال",
      "clothing",
    ],
  },
  {
    keywords: ["كهرباء", "كهربائيات"],
    aliases: [
      "كهرباء",
      "كهربائيات",
      "ادوات كهربائية",
      "أدوات كهربائية",
      "electrical",
    ],
  },
];

const ADEN_DISTRICTS = [
  "الشيخ عثمان",
  "خور مكسر",
  "دار سعد",
  "المنصورة",
  "البريقة",
  "كريتر",
  "المعلا",
  "المعلا",
  "التواهي",
  "إنما",
  "انما",
];

export function normalizeArabic(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ـ/g, "")
    .replace(/[^\p{L}\p{N}.\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseSmartSearch(
  query: string,
): SmartSearchIntent {
  const normalizedQuery = normalizeArabic(query);

  const wantsNearby =
    /قريب مني|قريبه مني|بالقرب مني|بالقرب من موقعي|قريب|قريبة|بالقرب|حول موقعي|قرب موقعي/.test(
      normalizedQuery,
    );

  const foundCategoryGroups = CATEGORY_GROUPS.filter(
    (group) =>
      group.aliases.some((alias) =>
        normalizedQuery.includes(normalizeArabic(alias)),
      ),
  );

  const categoryKeywords = [
    ...new Set(
      foundCategoryGroups.flatMap((group) => group.aliases),
    ),
  ];

  const location = ADEN_DISTRICTS.find((district) =>
    normalizedQuery.includes(normalizeArabic(district)),
  ) ?? null;

 const cleanedQuery = normalizedQuery;

  const excludedPhrases = [
    ...STOP_WORDS,
    ...categoryKeywords,
    ...ADEN_DISTRICTS,
    "عدن",
    "اليمن",
    "في",
    "قريب مني",
    "بالقرب مني",
    "موقعي",
  ].map(normalizeArabic);

  const searchTerms = cleanedQuery
    .split(/\s+/)
    .filter((term) => {
      if (term.length < 2) return false;
      if (excludedPhrases.includes(term)) return false;
      return true;
    });

  return {
    originalQuery: query,
    normalizedQuery,
    categoryKeywords,
    location,
    wantsNearby,
    searchTerms: [...new Set(searchTerms)],
  };
}