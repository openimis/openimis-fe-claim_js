import { describe, it, expect } from "vitest";

import { CLAIM_STATUS } from "./constants";
import en from "./translations/en.json";

describe("CLAIM_STATUS", () => {
  // OP-3239: a claim saved with a field error has status Error (0) in the backend
  it("includes the Error status (0)", () => {
    expect(CLAIM_STATUS).toContain(0);
  });

  it("has a label for every status", () => {
    const missing = CLAIM_STATUS.filter((status) => !en[`claim.claimStatus.${status}`]);
    expect(missing).toEqual([]);
  });
});
