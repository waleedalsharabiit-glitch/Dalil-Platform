import test from "node:test";
import assert from "node:assert/strict";

import { buildCategoryTree } from "@/lib/categories/category-navigation";

test("buildCategoryTree groups child categories under parents", () => {
  const tree = buildCategoryTree([
    { id: "1", name: "تقنية", slug: "tech", parentId: null },
    { id: "2", name: "هواتف", slug: "phones", parentId: "1" },
    { id: "3", name: "أجهزة", slug: "devices", parentId: "1" },
    { id: "4", name: "مطاعم", slug: "restaurants" },
  ]);

  const techNode = tree.find((node) => node.slug === "tech");
  const restaurantsNode = tree.find((node) => node.slug === "restaurants");

  assert.ok(techNode);
  assert.ok(restaurantsNode);
  assert.equal(tree.length, 2);
  assert.deepEqual(
    techNode?.children.map((child) => child.slug),
    ["devices", "phones"],
  );
  assert.equal(restaurantsNode?.children.length ?? 0, 0);
});
