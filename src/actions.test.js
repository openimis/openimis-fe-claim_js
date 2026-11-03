import { describe, it, expect, vi } from "vitest";

// The fe-core barrel cannot be loaded whole in a module test (UserPicker import
// cycle); saveReview only needs the mutation helpers, and graphql returns the
// request instead of performing it so the payload can be inspected.
vi.mock("@openimis/fe-core", () => ({
  formatMutation: (operationName, input) => ({
    clientMutationId: "test-mutation-id",
    payload: `mutation { ${operationName}(input: { ${input} }) { clientMutationId } }`,
  }),
  decodeId: (id) => atob(id).split(":")[1],
  formatGQLString: (value) => value,
  graphql: (payload, types, meta) => ({ payload, types, meta }),
}));

import { saveReview } from "./actions";

const reviewedClaim = () => ({
  uuid: "11111111-2222-3333-4444-555555555555",
  code: "C-1",
  adjustment: null,
  items: [],
  services: [
    {
      id: 7,
      service: { id: btoa("ServiceGQLType:5") },
      qtyApproved: 3,
      priceApproved: 12.5,
      justification: null,
      status: 2,
      rejectionReason: 1,
    },
  ],
});

describe("saveReview", () => {
  it("saves the review without delivering it", () => {
    const { payload } = saveReview(reviewedClaim(), "save");

    expect(payload).toContain("saveClaimReview");
    expect(payload).not.toMatch(/submitReview:\s*true/);
    expect(payload).toContain('qtyApproved: "3.00"');
  });

  // OP-3207: delivering from the review page must carry the on-screen review,
  // so it goes through saveClaimReview with submitReview instead of deliverClaimsReview.
  it("saves and delivers the review when asked to submit", () => {
    const { payload } = saveReview(reviewedClaim(), "submit", true);

    expect(payload).toContain("saveClaimReview");
    expect(payload).toMatch(/submitReview:\s*true/);
    expect(payload).toContain('qtyApproved: "3.00"');
    expect(payload).toContain('priceApproved: "12.50"');
    expect(payload).toMatch(/status:\s*2/);
    expect(payload).toMatch(/rejectionReason:\s*1/);
  });
});
