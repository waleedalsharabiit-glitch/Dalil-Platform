-- Review ratings must be between 1 and 5.
ALTER TABLE "Review"
ADD CONSTRAINT "Review_rating_range_check"
CHECK ("rating" >= 1 AND "rating" <= 5);

-- Report target must match report type.
ALTER TABLE "Report"
ADD CONSTRAINT "Report_target_consistency_check"
CHECK (
  ("type" = 'BUSINESS'
    AND "businessId" IS NOT NULL
    AND "reviewId" IS NULL
    AND "reportedUserId" IS NULL)
  OR
  ("type" = 'REVIEW'
    AND "businessId" IS NULL
    AND "reviewId" IS NOT NULL
    AND "reportedUserId" IS NULL)
  OR
  ("type" = 'USER'
    AND "businessId" IS NULL
    AND "reviewId" IS NULL
    AND "reportedUserId" IS NOT NULL)
);