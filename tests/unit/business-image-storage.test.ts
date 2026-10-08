import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { processBusinessImageUpload } from "@/lib/storage/business-image-storage";

describe("processBusinessImageUpload", () => {
  it("stores uploaded image files as optimized webp assets", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "dalil-upload-"));
    const uploadRoot = path.join(tempRoot, "public", "uploads");

    try {
      const svgImage = Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#0ea5e9"/></svg>',
      );

      const result = await processBusinessImageUpload({
        businessId: "business-123",
        file: new File([svgImage], "cover.svg", { type: "image/svg+xml" }),
        altText: "واجهة النشاط",
        baseDir: uploadRoot,
      });

      assert.match(result.url, /\/uploads\/businesses\/business-123\//);
      assert.equal(result.url.endsWith(".webp"), true);
      assert.ok(result.width > 0);
      assert.ok(result.height > 0);

      const savedFilePath = path.join(
        uploadRoot,
        result.url.replace(/^\/uploads\//, ""),
      );
      const savedFile = await readFile(savedFilePath);
      assert.ok(savedFile.length > 0);
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });
});
