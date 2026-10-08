import test from "node:test";
import assert from "node:assert/strict";

import {
  getReviewSummary,
  sortReviews,
  type ReviewLike,
} from "@/lib/reviews/review-metrics";

const sampleReviews: ReviewLike[] = [
  { id: "1", rating: 4, createdAt: new Date("2024-01-10T00:00:00Z") },
  { id: "2", rating: 5, createdAt: new Date("2024-02-10T00:00:00Z") },
  { id: "3", rating: 3, createdAt: new Date("2024-03-10T00:00:00Z") },
  { id: "4", rating: 5, createdAt: new Date("2024-01-05T00:00:00Z") },
];

test("sortReviews orders newest first by default", () => {
  const sorted = sortReviews(sampleReviews, "newest");
  assert.deepEqual(sorted.map((review) => review.id), ["3", "2", "1", "4"]);
});

test("sortReviews can order by rating descending", () => {
  const sorted = sortReviews(sampleReviews, "highest");
  assert.deepEqual(sorted.map((review) => review.id), ["2", "4", "1", "3"]);
});

test("getReviewSummary calculates the rating average and counts", () => {
  const summary = getReviewSummary(sampleReviews);
  assert.equal(summary.average, 4.3);
  assert.deepEqual(summary.distribution, {
    5: 2,
    4: 1,
    3: 1,
    2: 0,
    1: 0,
  });
});
