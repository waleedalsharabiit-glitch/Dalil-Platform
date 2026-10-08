import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",
]);

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export interface ProcessBusinessImageUploadInput {
  file: File;
  businessId: string;
  altText?: string | null;
  baseDir?: string;
  categoryName?: string | null;
}

export interface BusinessImageVariants {
  hero: string;
  card: string;
  thumbnail: string;
}

export interface ProcessedBusinessImage {
  url: string;
  variants: BusinessImageVariants;
  altText: string | null;
  size: number;
  width: number;
  height: number;
  mimeType: string;
  fileName: string;
}

function buildVariantUrls(businessId: string, fileName: string): BusinessImageVariants {
  const base = `/uploads/businesses/${businessId}`;
  const withoutExt = fileName.replace(/\.webp$/i, "");

  return {
    hero: `${base}/${fileName}`,
    card: `${base}/${withoutExt}-card.webp`,
    thumbnail: `${base}/${withoutExt}-thumb.webp`,
  };
}

export interface ImageDimensionProfile {
  width: number;
  height: number;
  fit: "cover" | "inside";
  quality: number;
}

export function getBusinessImageDimensionProfile(categoryName?: string | null): ImageDimensionProfile {
  const normalizedName = (categoryName ?? "")
    .trim()
    .toLowerCase();

  if (/مطعم|مقهي|كافيه|فندق|حلويات|سياحة|نادي/.test(normalizedName)) {
    return { width: 1600, height: 1000, fit: "cover", quality: 82 };
  }

  if (/صالون|تجميل|مركز/.test(normalizedName)) {
    return { width: 1200, height: 1500, fit: "cover", quality: 80 };
  }

  if (/سياحة|رحلات|فعاليات|استراحة|ترفيه/.test(normalizedName)) {
    return { width: 1600, height: 900, fit: "cover", quality: 80 };
  }

  if (/نظافة|صيانة|إصلاح|تكييف|سبا|مكتب|استشارات|محام|طبيب|صيدلية/.test(normalizedName)) {
    return { width: 1400, height: 1000, fit: "cover", quality: 82 };
  }

  return { width: 1600, height: 1200, fit: "cover", quality: 82 };
}

export function getImageUrlWithVariant(imageUrl: string | null | undefined, variant: "card" | "thumbnail") {
  if (!imageUrl || !imageUrl.includes("/uploads/businesses/")) {
    return imageUrl ?? null;
  }

  return imageUrl.replace(/\.webp$/i, `-${variant}.webp`);
}

export async function deleteStoredBusinessImageFiles(imageUrl: string) {
  if (!imageUrl || !imageUrl.startsWith("/uploads/")) {
    return;
  }

  const basePath = path.join(process.cwd(), "public", imageUrl.replace(/^\//, ""));

  try {
    await unlink(basePath);
  } catch {
    // ignore missing files; the original may have already been removed
  }

  const directory = path.dirname(basePath);
  const filename = path.basename(basePath, ".webp");

  const companionFiles = [
    path.join(directory, `${filename}-card.webp`),
    path.join(directory, `${filename}-thumb.webp`),
  ];

  for (const companionFile of companionFiles) {
    try {
      await unlink(companionFile);
    } catch {
      // companion may not exist
    }
  }
}

export async function processBusinessImageUpload({
  file,
  businessId,
  altText,
  baseDir = path.join(process.cwd(), "public", "uploads"),
  categoryName,
}: ProcessBusinessImageUploadInput): Promise<ProcessedBusinessImage> {
  if (!(file instanceof File)) {
    throw new Error("ملف الصورة غير صالح");
  }

  if (file.size === 0) {
    throw new Error("لا يمكن رفع ملف فارغ");
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
  }

  const mimeType = file.type || "application/octet-stream";

  if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
    throw new Error(
      "نوع الملف غير مدعوم، استخدم JPG أو PNG أو WebP أو AVIF",
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const metadata = await sharp(buffer).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("تعذر قراءة صورة صالحة");
  }

  const businessDir = path.join(baseDir, "businesses", businessId);
  await mkdir(businessDir, { recursive: true });

  const profile = getBusinessImageDimensionProfile(categoryName);
  const fileName = `${randomUUID()}.webp`;
  const variants = buildVariantUrls(businessId, fileName);

  const heroBuffer = await sharp(buffer)
    .rotate()
    .resize({
      width: profile.width,
      height: profile.height,
      fit: profile.fit,
      withoutEnlargement: true,
    })
    .webp({ quality: profile.quality, effort: 6 })
    .toBuffer();

  const cardBuffer = await sharp(buffer)
    .rotate()
    .resize({
      width: 900,
      height: 900,
      fit: "cover",
      withoutEnlargement: true,
    })
    .webp({ quality: 78, effort: 5 })
    .toBuffer();

  const thumbnailBuffer = await sharp(buffer)
    .rotate()
    .resize({
      width: 360,
      height: 360,
      fit: "cover",
      withoutEnlargement: true,
    })
    .webp({ quality: 72, effort: 4 })
    .toBuffer();

  await writeFile(path.join(businessDir, fileName), heroBuffer);
  await writeFile(path.join(businessDir, `${fileName.replace(/\.webp$/i, "")}-card.webp`), cardBuffer);
  await writeFile(path.join(businessDir, `${fileName.replace(/\.webp$/i, "")}-thumb.webp`), thumbnailBuffer);

  return {
    url: variants.hero,
    variants,
    altText: altText?.trim() || null,
    size: heroBuffer.length,
    width: metadata.width,
    height: metadata.height,
    mimeType: "image/webp",
    fileName,
  };
}
