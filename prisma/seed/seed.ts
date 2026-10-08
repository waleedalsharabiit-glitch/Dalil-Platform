import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Starting Dalil database seed...\n");

  // ============================================================
  // 1. Passwords
  // ============================================================

  const passwords = {
    superAdmin:
      process.env.SEED_SUPER_ADMIN_PASSWORD ??
      "Dalil_SuperAdmin_ChangeMe_2026!",
    admin:
      process.env.SEED_ADMIN_PASSWORD ??
      "Dalil_Admin_ChangeMe_2026!",
    owner:
      process.env.SEED_OWNER_PASSWORD ??
      "Dalil_Owner_ChangeMe_2026!",
    user:
      process.env.SEED_USER_PASSWORD ??
      "Dalil_User_ChangeMe_2026!",
  };

  const [
    superAdminPassword,
    adminPassword,
    ownerPassword,
    userPassword,
  ] = await Promise.all([
    bcrypt.hash(passwords.superAdmin, 12),
    bcrypt.hash(passwords.admin, 12),
    bcrypt.hash(passwords.owner, 12),
    bcrypt.hash(passwords.user, 12),
  ]);

  // ============================================================
  // 2. System Users
  // ============================================================

  console.log("👤 Creating system users...");

  const superAdmin = await prisma.user.upsert({
    where: {
      email: "superadmin@dalil.local",
    },
    update: {
      name: "مدير النظام الأعلى",
      password: superAdminPassword,
      role: "SUPER_ADMIN",
      isActive: true,
    },
    create: {
      name: "مدير النظام الأعلى",
      email: "superadmin@dalil.local",
      password: superAdminPassword,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@dalil.local",
    },
    update: {
      name: "مدير دليل",
      password: adminPassword,
      role: "ADMIN",
      isActive: true,
    },
    create: {
      name: "مدير دليل",
      email: "admin@dalil.local",
      password: adminPassword,
      role: "ADMIN",
      isActive: true,
    },
  });

  const owner = await prisma.user.upsert({
    where: {
      email: "owner@dalil.local",
    },
    update: {
      name: "مالك نشاط تجريبي",
      password: ownerPassword,
      role: "BUSINESS_OWNER",
      isActive: true,
    },
    create: {
      name: "مالك نشاط تجريبي",
      email: "owner@dalil.local",
      password: ownerPassword,
      role: "BUSINESS_OWNER",
      isActive: true,
    },
  });

  const user = await prisma.user.upsert({
    where: {
      email: "user@dalil.local",
    },
    update: {
      name: "مستخدم تجريبي",
      password: userPassword,
      role: "USER",
      isActive: true,
    },
    create: {
      name: "مستخدم تجريبي",
      email: "user@dalil.local",
      password: userPassword,
      role: "USER",
      isActive: true,
    },
  });

  console.log(`   ✓ SUPER_ADMIN: ${superAdmin.email}`);
  console.log(`   ✓ ADMIN: ${admin.email}`);
  console.log(`   ✓ BUSINESS_OWNER: ${owner.email}`);
  console.log(`   ✓ USER: ${user.email}`);

  // ============================================================
  // 3. Categories
  // ============================================================

  console.log("\n📂 Creating categories...");

  const categories = [
    {
      name: "مطاعم ومطابخ",
      slug: "restaurants",
      description: "المطاعم والمطابخ ومنافذ بيع الطعام",
      icon: "utensils",
    },
    {
      name: "صيدليات",
      slug: "pharmacies",
      description: "الصيدليات ومنافذ بيع المنتجات الصحية",
      icon: "pill",
    },
    {
      name: "صيانة الجوالات",
      slug: "phone-repair",
      description: "محلات صيانة وإصلاح الهواتف والجوالات",
      icon: "smartphone",
    },
    {
      name: "الكمبيوتر والشبكات",
      slug: "computers-networks",
      description: "محلات الكمبيوتر وقطع الغيار والشبكات",
      icon: "monitor",
    },
    {
      name: "الكاميرات والمراقبة",
      slug: "security-cameras",
      description: "أنظمة كاميرات المراقبة والأمن",
      icon: "camera",
    },
    {
      name: "الكهرباء",
      slug: "electricity",
      description: "خدمات ومحلات الكهرباء",
      icon: "zap",
    },
    {
      name: "السباكة",
      slug: "plumbing",
      description: "خدمات ومحلات السباكة",
      icon: "wrench",
    },
    {
      name: "السيارات",
      slug: "automotive",
      description: "صيانة السيارات وقطع الغيار والخدمات المتعلقة بها",
      icon: "car",
    },
    {
      name: "الحدادة والنجارة",
      slug: "metalwork-carpentry",
      description: "خدمات الحدادة والنجارة والأعمال المعدنية والخشبية",
      icon: "hammer",
    },
    {
      name: "الطباعة والتصوير",
      slug: "printing",
      description: "الطباعة والتصوير والخدمات المكتبية",
      icon: "printer",
    },
    {
      name: "الملابس والأزياء",
      slug: "fashion",
      description: "محلات الملابس والأزياء والإكسسوارات",
      icon: "shirt",
    },
    {
      name: "البقالات والمواد الغذائية",
      slug: "groceries",
      description: "البقالات ومحلات المواد الغذائية",
      icon: "shopping-cart",
    },
    {
      name: "الأثاث والمفروشات",
      slug: "furniture",
      description: "الأثاث والمفروشات والديكور",
      icon: "sofa",
    },
    {
      name: "الخدمات التعليمية",
      slug: "education",
      description: "المراكز التعليمية والدروس والتدريب",
      icon: "graduation-cap",
    },
    {
      name: "الخدمات المهنية",
      slug: "professional-services",
      description: "المكاتب والخدمات المهنية والاستشارية",
      icon: "briefcase",
    },
  ];

  const categoryMap = new Map<string, string>();

  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: {
        slug: category.slug,
      },
      update: {
        name: category.name,
        description: category.description,
        icon: category.icon,
        isActive: true,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        isActive: true,
      },
    });

    categoryMap.set(category.slug, created.id);
  }

  console.log(`   ✓ ${categories.length} categories`);

  // ============================================================
  // 4. Services
  // ============================================================

  console.log("\n🔧 Creating services...");

  const services = [
    // Restaurants
    {
      name: "وجبات سريعة",
      slug: "fast-food",
      category: "restaurants",
    },
    {
      name: "مطاعم عائلية",
      slug: "family-restaurants",
      category: "restaurants",
    },
    {
      name: "مندي ومظبي",
      slug: "mandi",
      category: "restaurants",
    },
    {
      name: "حلويات",
      slug: "desserts",
      category: "restaurants",
    },

    // Pharmacies
    {
      name: "بيع الأدوية",
      slug: "medicines",
      category: "pharmacies",
    },
    {
      name: "مستلزمات طبية",
      slug: "medical-supplies",
      category: "pharmacies",
    },

    // Phone repair
    {
      name: "صيانة شاشات الجوال",
      slug: "phone-screen-repair",
      category: "phone-repair",
    },
    {
      name: "تغيير البطارية",
      slug: "phone-battery-replacement",
      category: "phone-repair",
    },
    {
      name: "إصلاح السوفتوير",
      slug: "phone-software-repair",
      category: "phone-repair",
    },

    // Computers
    {
      name: "صيانة الكمبيوتر",
      slug: "computer-repair",
      category: "computers-networks",
    },
    {
      name: "بيع قطع الكمبيوتر",
      slug: "computer-parts",
      category: "computers-networks",
    },
    {
      name: "بيع اللابتوبات",
      slug: "laptops",
      category: "computers-networks",
    },
    {
      name: "تركيب الشبكات",
      slug: "network-installation",
      category: "computers-networks",
    },
    {
      name: "إعداد أجهزة MikroTik",
      slug: "mikrotik-setup",
      category: "computers-networks",
    },

    // Security
    {
      name: "تركيب كاميرات المراقبة",
      slug: "cctv-installation",
      category: "security-cameras",
    },
    {
      name: "صيانة كاميرات المراقبة",
      slug: "cctv-repair",
      category: "security-cameras",
    },

    // Electricity
    {
      name: "تمديدات كهربائية",
      slug: "electrical-installation",
      category: "electricity",
    },
    {
      name: "صيانة كهربائية",
      slug: "electrical-repair",
      category: "electricity",
    },

    // Plumbing
    {
      name: "إصلاح تسربات المياه",
      slug: "water-leak-repair",
      category: "plumbing",
    },
    {
      name: "تمديدات السباكة",
      slug: "plumbing-installation",
      category: "plumbing",
    },

    // Automotive
    {
      name: "ميكانيكا السيارات",
      slug: "car-mechanics",
      category: "automotive",
    },
    {
      name: "كهرباء السيارات",
      slug: "auto-electrical",
      category: "automotive",
    },
    {
      name: "قطع غيار السيارات",
      slug: "auto-parts",
      category: "automotive",
    },

    // Printing
    {
      name: "طباعة مستندات",
      slug: "document-printing",
      category: "printing",
    },
    {
      name: "تصوير مستندات",
      slug: "document-copying",
      category: "printing",
    },
    {
      name: "طباعة ملونة",
      slug: "color-printing",
      category: "printing",
    },

    // Fashion
    {
      name: "ملابس رجالية",
      slug: "mens-clothing",
      category: "fashion",
    },
    {
      name: "ملابس نسائية",
      slug: "womens-clothing",
      category: "fashion",
    },
    {
      name: "أحذية",
      slug: "shoes",
      category: "fashion",
    },

    // Groceries
    {
      name: "مواد غذائية",
      slug: "food-products",
      category: "groceries",
    },
    {
      name: "مشروبات",
      slug: "beverages",
      category: "groceries",
    },

    // Furniture
    {
      name: "أثاث منزلي",
      slug: "home-furniture",
      category: "furniture",
    },
    {
      name: "مطابخ",
      slug: "kitchens",
      category: "furniture",
    },

    // Education
    {
      name: "دروس خصوصية",
      slug: "private-lessons",
      category: "education",
    },
    {
      name: "دورات تدريبية",
      slug: "training-courses",
      category: "education",
    },

    // Professional
    {
      name: "خدمات محاسبية",
      slug: "accounting",
      category: "professional-services",
    },
    {
      name: "استشارات تقنية",
      slug: "it-consulting",
      category: "professional-services",
    },
  ];

  let serviceCount = 0;

  for (const service of services) {
    const categoryId = categoryMap.get(service.category);

    if (!categoryId) {
      throw new Error(
        `Category "${service.category}" not found for service "${service.name}".`,
      );
    }

    await prisma.service.upsert({
      where: {
        slug: service.slug,
      },
      update: {
        name: service.name,
        categoryId,
        isActive: true,
      },
      create: {
        name: service.name,
        slug: service.slug,
        categoryId,
        isActive: true,
      },
    });

    serviceCount++;
  }

  console.log(`   ✓ ${serviceCount} services`);

  // ============================================================
  // 5. Summary
  // ============================================================

  const [
    usersCount,
    categoriesCount,
    servicesCount,
    businessesCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.category.count(),
    prisma.service.count(),
    prisma.business.count(),
  ]);

  console.log("\n========================================");
  console.log("🎉 Dalil seed completed successfully!");
  console.log("========================================");
  console.log(`Users:      ${usersCount}`);
  console.log(`Categories: ${categoriesCount}`);
  console.log(`Services:   ${servicesCount}`);
  console.log(`Businesses: ${businessesCount}`);
  console.log("========================================\n");
}

main()
  .catch((error) => {
    console.error("\n❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });