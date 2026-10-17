import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL غير موجود.");
if (!new URL(url).hostname.endsWith("neon.tech")) {
  throw new Error("توقف للحماية: قاعدة البيانات ليست Neon.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

const photo = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

const categories = [
  ["restaurants","مطاعم ومأكولات","utensils","photo-1517248135467-4c7edcad34c4"],
  ["pharmacies","صيدليات وصحة","heart-pulse","photo-1576091160399-112ba8d25d1d"],
  ["phone-repair","صيانة الهواتف","smartphone","photo-1511707171634-5f897ff02aa9"],
  ["computers-networks","كمبيوتر وشبكات","monitor","photo-1519389950473-47ba0277781c"],
  ["security-cameras","كاميرات وأنظمة أمنية","camera","photo-1558008258-3256797b43f3"],
  ["electricity","كهرباء وطاقة","zap","photo-1497366754035-f200968a6e72"],
  ["plumbing","سباكة ومياه","wrench","photo-1581578732484-cc9c0b5d8d7b"],
  ["automotive","سيارات وقطع غيار","car","photo-1486262715619-67b85e0b08d3"],
  ["metalwork-carpentry","حدادة ونجارة","hammer","photo-1504307651254-35680f356dfd"],
  ["printing","طباعة ومكتبات","printer","photo-1455390582262-044cdead277a"],
  ["fashion","ملابس وأزياء","shirt","photo-1441986300917-64674bd600d8"],
  ["groceries","مواد غذائية وبقالات","shopping-basket","photo-1542838132-92c53300491e"],
  ["furniture","أثاث ومفروشات","sofa","photo-1555041469-a586c61ea9bc"],
  ["education","تعليم وتدريب","graduation-cap","photo-1523580494863-6f3031224c94"],
  ["professional-services","خدمات مهنية","briefcase-business","photo-1521737711867-e3b97375f902"],
  ["home-maintenance","صيانة منزلية وتنظيف","house","photo-1581578732484-cc9c0b5d8d7b"],
  ["real-estate","عقارات وإسكان","building-2","photo-1560518883-ce09059eeffa"],
  ["construction","مقاولات وبناء","hard-hat","photo-1503387762-592deb58ef4e"],
  ["transport-delivery","نقل وتوصيل","truck","photo-1519003722824-194d4455a60c"],
  ["beauty-personal-care","تجميل وعناية شخصية","sparkles","photo-1560066984-138dadb4c035"],
  ["media-photography","تصوير وتصميم","camera","photo-1516035069371-29a1b244cc32"],
  ["events-venues","مناسبات وقاعات","calendar-days","photo-1511795409834-ef04bbd61622"],
  ["hotels-tourism","فنادق وسياحة","bed-double","photo-1566073771259-6a8506099945"],
  ["agriculture-animals","زراعة وحيوانات","sprout","photo-1500382017468-9049fed747ef"],
  ["sports-entertainment","رياضة وترفيه","dumbbell","photo-1534438327276-14e5300c3a48"],
  ["wholesale-trade","تجارة الجملة والتوريد","boxes","photo-1586528116311-ad8dd3c8310d"],
  ["finance-accounting","محاسبة وخدمات مالية","calculator","photo-1554224155-6726b3ff858f"],
  ["legal-services","خدمات قانونية","scale","photo-1589829545856-d10d557cf95f"],
  ["marketing-advertising","تسويق وإعلان","megaphone","photo- реклам"],
  ["telecom-internet","اتصالات وإنترنت","wifi","photo-1516321318423-f06f85e504b3"],
  ["water-solar-energy","طاقة شمسية وفلاتر مياه","sun","photo-1509391366360-2e959784a276"],
  ["business-services","خدمات الشركات والأعمال","building","photo-1497366811353-6870744d04b2"],
] as const;

const services: [string, string, string][] = [
  ["fast-food","وجبات سريعة","restaurants"],
  ["family-restaurants","مطاعم عائلية","restaurants"],
  ["cafes-drinks","مقاهٍ ومشروبات","restaurants"],
  ["bakeries-sweets","مخابز وحلويات","restaurants"],
  ["food-delivery","توصيل الطعام","restaurants"],
  ["mobile-phone-repair","صيانة الهواتف","phone-repair"],
  ["phone-screen-repair","تغيير شاشات الهواتف","phone-repair"],
  ["phone-accessories","إكسسوارات الهواتف","phone-repair"],
  ["laptop-repair","صيانة اللابتوب","computers-networks"],
  ["computer-sales","بيع أجهزة الكمبيوتر","computers-networks"],
  ["computer-monitors","شاشات الكمبيوتر","computers-networks"],
  ["ssd-ram-upgrade","ترقية SSD وRAM","computers-networks"],
  ["mikrotik-equipment","أجهزة MikroTik","computers-networks"],
  ["routers-switches","راوترات وسويتشات","computers-networks"],
  ["network-installation","تركيب الشبكات","computers-networks"],
  ["software-installation","تثبيت البرامج والأنظمة","computers-networks"],
  ["printer-repair","صيانة الطابعات","computers-networks"],
  ["cctv-installation","تركيب كاميرات المراقبة","security-cameras"],
  ["electrical-repair","إصلاح الأعطال الكهربائية","electricity"],
  ["solar-installation","تركيب الطاقة الشمسية","electricity"],
  ["air-conditioning","تركيب وصيانة المكيفات","electricity"],
  ["plumbing-repair","إصلاح السباكة","plumbing"],
  ["water-pump-installation","تركيب مضخات المياه","plumbing"],
  ["car-mechanics","ميكانيكا السيارات","automotive"],
  ["car-electrical","كهرباء السيارات","automotive"],
  ["auto-parts","قطع غيار السيارات","automotive"],
  ["car-wash","غسيل السيارات","automotive"],
  ["welding","الحدادة واللحام","metalwork-carpentry"],
  ["carpentry","أعمال النجارة","metalwork-carpentry"],
  ["document-printing","طباعة وتصوير المستندات","printing"],
  ["stationery","قرطاسية وأدوات مكتبية","printing"],
  ["tailoring","خياطة وتفصيل الملابس","fashion"],
  ["grocery-delivery","توصيل البقالة","groceries"],
  ["home-furniture","بيع الأثاث المنزلي","furniture"],
  ["private-tutoring","دروس خصوصية","education"],
  ["programming-training","تدريب البرمجة","education"],
  ["website-development","تصميم وتطوير المواقع","computers-networks"],
  ["mobile-app-development","تطوير تطبيقات الجوال","computers-networks"],
  ["graphic-design","تصميم جرافيك","marketing-advertising"],
  ["digital-marketing","التسويق الرقمي","marketing-advertising"],
  ["social-media-management","إدارة حسابات التواصل","marketing-advertising"],
  ["home-cleaning","تنظيف المنازل","home-maintenance"],
  ["pest-control","مكافحة الحشرات","home-maintenance"],
  ["painting-decor","دهانات وديكورات","construction"],
  ["building-materials","مواد البناء","construction"],
  ["property-rentals","تأجير العقارات","real-estate"],
  ["property-sales","بيع العقارات","real-estate"],
  ["furniture-moving","نقل الأثاث","transport-delivery"],
  ["parcel-delivery","شحن وتوصيل الطرود","transport-delivery"],
  ["barbershop","حلاقة رجالية","beauty-personal-care"],
  ["beauty-salon","صالونات تجميل","beauty-personal-care"],
  ["event-photography","تصوير المناسبات","media-photography"],
  ["wedding-halls","قاعات الأفراح","events-venues"],
  ["hotel-booking","حجز الفنادق","hotels-tourism"],
  ["farm-supplies","مستلزمات زراعية","agriculture-animals"],
  ["gym-memberships","اشتراكات النوادي الرياضية","sports-entertainment"],
  ["wholesale-supplies","توريد بضائع بالجملة","wholesale-trade"],
  ["accounting-services","خدمات المحاسبة","finance-accounting"],
  ["legal-consulting","استشارات قانونية","legal-services"],
  ["internet-installation","تركيب الإنترنت","telecom-internet"],
  ["water-filters","فلاتر وتنقية المياه","water-solar-energy"],
  ["business-consulting","استشارات الأعمال","business-services"],
];

async function main() {
  const ids = new Map<string, string>();
  let categoryCount = 0;
  let serviceCount = 0;

  for (const [slug, name, icon, photoId] of categories) {
    const result = await prisma.category.upsert({
      where: { slug },
      update: {
        name,
        icon,
        image: photo(photoId === "photo- реклам" ? "photo-1552664730-d307ca884978" : photoId),
        isActive: true,
      },
      create: {
        slug,
        name,
        icon,
        image: photo(photoId === "photo- реклам" ? "photo-1552664730-d307ca884978" : photoId),
        isActive: true,
      },
    });
    ids.set(slug, result.id);
    categoryCount++;
  }

  for (const [slug, name, categorySlug] of services) {
    let categoryId = ids.get(categorySlug);
    if (!categoryId) {
      categoryId = (await prisma.category.findUnique({
        where: { slug: categorySlug },
        select: { id: true },
      }))?.id;
    }
    if (!categoryId) {
      console.warn(`تُركت الخدمة ${name}: التصنيف ${categorySlug} غير موجود.`);
      continue;
    }

    await prisma.service.upsert({
      where: { slug },
      update: { name, isActive: true },
      create: { slug, name, categoryId, isActive: true },
    });
    serviceCount++;
  }

  console.log(`اكتملت العملية: ${categoryCount} تصنيفًا، و${serviceCount} خدمة.`);
  console.log(`إجمالي التصنيفات: ${await prisma.category.count()}`);
  console.log(`إجمالي الخدمات: ${await prisma.service.count()}`);
}

main()
  .catch((error) => {
    console.error("فشل التحديث:", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
