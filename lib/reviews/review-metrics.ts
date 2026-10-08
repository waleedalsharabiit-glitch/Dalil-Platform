export type ReviewSort = "newest" | "highest" | "lowest";

export type ReviewLike = {
  id: string;
  rating: number;
  createdAt: Date | string;
};

export function sortReviews<T extends ReviewLike>(
  reviews: readonly T[],
  sort: ReviewSort = "newest",
): T[] {
  const items = [...reviews];

  if (sort === "highest") {
    items.sort((a, b) => {
      const ratingDiff = b.rating - a.rating;
      if (ratingDiff !== 0) return ratingDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return items;
  }

  if (sort === "lowest") {
    items.sort((a, b) => {
      const ratingDiff = a.rating - b.rating;
      if (ratingDiff !== 0) return ratingDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return items;
  }

  items.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return items;
}

export function getReviewSummary<T extends ReviewLike>(reviews: readonly T[]) {
  const total = reviews.length;
  const average = total
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / total
    : 0;

  const distribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  } as Record<1 | 2 | 3 | 4 | 5, number>;

  for (const review of reviews) {
    const normalized = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[normalized] += 1;
  }

  return {
    total,
    average: Number(average.toFixed(1)),
    distribution,
  };
}
