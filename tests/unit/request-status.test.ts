import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getRequestNotificationLink,
  requestStatusMeta,
  requestStatusOptions,
} from "@/lib/requests/request-status";

describe("request status metadata", () => {
  it("includes human readable labels and all status filters", () => {
    assert.equal(requestStatusMeta.PENDING.label, "قيد الانتظار");
    assert.equal(requestStatusMeta.ACCEPTED.label, "مقبول");
    assert.equal(requestStatusMeta.REJECTED.label, "مرفوض");
    assert.deepEqual(
      requestStatusOptions.map((item) => item.value),
      ["ALL", "PENDING", "ACCEPTED", "REJECTED", "CANCELLED", "COMPLETED"],
    );
  });

  it("creates the correct notification route for the target user", () => {
    assert.equal(getRequestNotificationLink("req_123", "USER"), "/requests?status=ACCEPTED");
    assert.equal(getRequestNotificationLink("req_123", "OWNER"), "/dashboard/requests/req_123");
  });
});
