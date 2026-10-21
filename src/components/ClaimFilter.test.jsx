import { describe, it, expect, vi } from "vitest";

// The fe-core barrel cannot be loaded whole in a module test (UserPicker import
// cycle); only the filter builders are under test here.
vi.mock("@openimis/fe-core", () => ({
  withModulesManager: (component) => component,
  formatMessage: (intl, module, id) => id,
}));
vi.mock("../actions", () => ({}));

import { claimStatusFilter } from "./ClaimFilter";

describe("claimStatusFilter", () => {
  it("filters on a picked status", () => {
    expect(claimStatusFilter(4)).toEqual({ id: "claimStatus", value: 4, filter: "status: 4" });
  });

  // OP-3239: Error is status 0, which is falsy; picking it must still filter
  it("filters on the Error status (0)", () => {
    expect(claimStatusFilter(0)).toEqual({ id: "claimStatus", value: 0, filter: "status: 0" });
  });

  it("clears the filter when no status is picked", () => {
    expect(claimStatusFilter(null)).toEqual({ id: "claimStatus", value: null, filter: null });
    expect(claimStatusFilter(undefined).filter).toBeNull();
  });
});
