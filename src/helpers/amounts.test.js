import { describe, expect, it } from "vitest";

import { approvedAmount, claimedAmount } from "./amounts";

const serviceRow = (packagetype, overrides = {}, service = {}) => ({
  service: { id: "s-1", code: "S1", price: 10, packagetype, ...service },
  ...overrides,
});

describe("claimedAmount", () => {
  it("is zero for the blank row the form keeps at the end", () => {
    expect(claimedAmount({})).toBe(0);
  });

  describe("items", () => {
    it("multiplies the quantity by the asked price", () => {
      expect(claimedAmount({ item: { id: "i-1" }, qtyProvided: 3, priceAsked: "2.50" })).toBe(7.5);
    });

    it.each([
      ["no quantity", { qtyProvided: null, priceAsked: 5 }],
      ["no price", { qtyProvided: 2, priceAsked: null }],
      ["a cleared quantity", { qtyProvided: undefined, priceAsked: 5 }],
    ])("is zero with %s", (_label, amounts) => {
      expect(claimedAmount({ item: { id: "i-1" }, ...amounts })).toBe(0);
    });
  });

  describe("simple services", () => {
    it("multiplies the quantity by the asked price", () => {
      expect(claimedAmount(serviceRow("S", { qtyProvided: 2, priceAsked: "12.5" }))).toBe(25);
    });

    it("is zero for a row with no service chosen yet", () => {
      expect(claimedAmount({ qtyProvided: 1 })).toBe(0);
      expect(claimedAmount({ service: {}, qtyProvided: 1 })).toBe(0);
    });

    // Currently fails: unlike items, a simple service has no guard on the quantity, so a
    // cleared quantity makes the line, and the claim total, NaN.
    it.fails("is zero with a cleared quantity, like an item", () => {
      expect(claimedAmount(serviceRow("S", { qtyProvided: undefined, priceAsked: 10 }))).toBe(0);
    });

    // Currently fails: the line total is written back into service.price, the unit price a
    // later pick of the same service falls back to when it has no pricelist entry.
    it.fails("leaves the service's unit price untouched", () => {
      const row = serviceRow("S", { qtyProvided: 3, priceAsked: 10 });
      claimedAmount(row);

      expect(row.service.price).toBe(10);
    });
  });

  describe("package services", () => {
    it("charges the service price of a manually priced package whatever its contents", () => {
      const row = serviceRow("P", { qtyProvided: 1, services: [{ qtyDisplayed: 9, priceAsked: 100 }] }, {
        manualPrice: true,
        price: "40.5",
      });

      expect(claimedAmount(row)).toBe(40.5);
    });

    it("sums the displayed contents of a saved P package", () => {
      const row = serviceRow("P", {
        services: [{ qtyDisplayed: 2, priceAsked: 5 }, { qtyDisplayed: 0, priceAsked: 7 }],
        items: [{ qtyDisplayed: 3, priceAsked: 1 }],
      });

      expect(claimedAmount(row)).toBe(13);
    });

    it("sums the asked contents of a newly picked P package", () => {
      const row = serviceRow("P", {}, {
        serviceserviceSet: [{ qtyAsked: 2, priceAsked: 5 }, { priceAsked: 7 }],
        servicesLinked: [{ qtyAsked: 4, priceAsked: 0.5 }],
      });

      expect(claimedAmount(row)).toBe(12);
    });

    it("caps each content of an F package at the quantity the package provides", () => {
      const row = serviceRow("F", {
        services: [{ qtyDisplayed: 5, qtyProvided: 3, priceAsked: 10 }],
        items: [{ qtyDisplayed: 1, qtyProvided: 3, priceAsked: 2 }, { qtyDisplayed: 4, qtyProvided: 1, priceAsked: 2 }],
      });

      expect(claimedAmount(row)).toBe(34);
    });

    it("caps the asked contents of a newly picked F package the same way", () => {
      const row = serviceRow("F", {}, {
        serviceserviceSet: [{ qtyAsked: 5, qtyProvided: 3, priceAsked: 10 }],
        servicesLinked: [{ qtyAsked: 2, qtyProvided: 3, priceAsked: 1 }, { qtyAsked: 5, qtyProvided: 1, priceAsked: 2 }],
      });

      expect(claimedAmount(row)).toBe(34);
    });

    it("is zero for a package with no contents", () => {
      expect(claimedAmount(serviceRow("P"))).toBe(0);
    });

  });
});

describe("approvedAmount", () => {
  it("is zero for a rejected line", () => {
    expect(approvedAmount({ item: {}, status: 2, qtyProvided: 3, priceAsked: 10 })).toBe(0);
    expect(approvedAmount(serviceRow("S", { status: 2, qtyProvided: 3, priceAsked: 10 }))).toBe(0);
  });

  it("is zero for the blank row the form keeps at the end", () => {
    expect(approvedAmount({})).toBe(0);
  });

  describe.each([
    ["items", (overrides) => ({ item: { id: "i-1" }, ...overrides })],
    ["simple services", (overrides) => serviceRow("S", overrides)],
  ])("%s", (_label, row) => {
    it("uses the approved quantity and price", () => {
      expect(approvedAmount(row({ qtyProvided: 3, priceAsked: 10, qtyApproved: 2, priceApproved: "7.5" }))).toBe(15);
    });

    it.each([
      ["not reviewed", null],
      ["emptied", ""],
    ])("falls back to what was claimed when the approval is %s", (_l, empty) => {
      expect(approvedAmount(row({ qtyProvided: 3, priceAsked: 10, qtyApproved: empty, priceApproved: empty }))).toBe(30);
    });

    it("can approve nothing", () => {
      expect(approvedAmount(row({ qtyProvided: 3, priceAsked: 10, qtyApproved: 0, priceApproved: null }))).toBe(0);
    });

    // Currently fails: only null and "" count as "not set"; the undefined the number input
    // reports when the reviewer clears it makes the approved total NaN.
    it.fails("falls back to what was claimed when the reviewer clears the approval", () => {
      expect(approvedAmount(row({ qtyProvided: 3, priceAsked: 10, qtyApproved: undefined, priceApproved: null }))).toBe(
        30,
      );
    });
  });

  describe("package services", () => {
    it("sums the displayed contents of a P package when nothing is adjusted", () => {
      const row = serviceRow("P", {
        services: [{ qtyDisplayed: 2, priceAsked: 5 }],
        items: [{ qtyDisplayed: 3, priceAsked: 1 }],
      });

      expect(approvedAmount(row)).toBe(13);
    });

    it("uses the adjusted quantity of a P package content", () => {
      const row = serviceRow("P", {
        services: [{ qtyDisplayed: 2, qtyAdjusted: 1, priceAsked: 5 }],
        items: [{ qtyDisplayed: 3, qtyAdjusted: 0, priceAsked: 1 }],
      });

      expect(approvedAmount(row)).toBe(5);
    });

    it("caps an adjusted F package content at the quantity the package provides", () => {
      const row = serviceRow("F", {
        services: [{ qtyDisplayed: 2, qtyAdjusted: 5, qtyProvided: 3, priceAsked: 10 }],
        items: [
          { qtyDisplayed: 2, qtyAdjusted: 1, qtyProvided: 3, priceAsked: 2 },
          { qtyDisplayed: 2, qtyAdjusted: 4, qtyProvided: 1, priceAsked: 2 },
        ],
      });

      expect(approvedAmount(row)).toBe(34);
    });

    // Currently fails: an unadjusted F content falls back to qtyDisplayed without the
    // qtyProvided cap that claimedAmount applies, so the approved total exceeds the claimed one.
    it.fails("never approves more of an unadjusted F package than was claimed", () => {
      const row = serviceRow("F", { services: [{ qtyDisplayed: 5, qtyProvided: 3, priceAsked: 10 }] });

      expect(approvedAmount(row)).toBe(claimedAmount(row));
    });

    it("uses the displayed quantity of an unadjusted F package content", () => {
      const row = serviceRow("F", { items: [{ qtyDisplayed: 2, qtyAdjusted: null, qtyProvided: 3, priceAsked: 5 }] });

      expect(approvedAmount(row)).toBe(10);
    });

    it("records the package total as the line's approved price", () => {
      const row = serviceRow("P", { services: [{ qtyDisplayed: 2, priceAsked: 5 }] });
      approvedAmount(row);

      expect(row.priceApproved).toBe(10);
    });

    it("is zero for a package with no contents", () => {
      expect(approvedAmount(serviceRow("F"))).toBe(0);
    });
  });
});
