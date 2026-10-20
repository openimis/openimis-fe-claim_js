import { afterEach, describe, expect, it, vi } from "vitest";

// fe-core's barrel imports itself, so the real helpers come from their defining modules.
vi.mock("@openimis/fe-core", async () => vi.importActual("@openimis/fe-core/helpers/utils"));

const { calculateAge, calculateDuration } = await import("./utils");

const formatMessage = (key) => key.split(".").pop();

afterEach(() => vi.useRealTimers());

describe("calculateAge", () => {
  it("says the date of birth is missing", () => {
    expect(calculateAge(null, "2026-09-30", formatMessage)).toBe("dobNotProvided");
  });

  it.each([
    ["days under a week", "2026-09-25", "5 days"],
    ["weeks under a month", "2026-09-10", "2 weeks"],
    ["months under a year", "2026-03-30", "6 months"],
    ["whole years after that", "1990-06-15", "36 years"],
  ])("counts %s", (_label, dob, expected) => {
    expect(calculateAge(dob, "2026-09-30", formatMessage)).toBe(expected);
  });

  it("measures up to today when the claim has no date yet", () => {
    vi.useFakeTimers({ now: new Date("2026-09-30T12:00:00Z") });

    expect(calculateAge("2016-09-01", undefined, formatMessage)).toBe("10 years");
  });

  // Currently fails: years are whole multiples of 365 days, so the leap days in a long
  // life make the insuree a year older several days before their birthday.
  it.fails("does not add the year before the birthday", () => {
    expect(calculateAge("1990-10-02", "2026-09-30", formatMessage)).toBe("35 years");
  });
});

describe("calculateDuration", () => {
  it("counts the days between the start and end of the visit", () => {
    expect(calculateDuration("2026-09-10", "2026-09-01", formatMessage)).toBe("9 days");
  });

  it("counts a same-day visit as one day", () => {
    expect(calculateDuration("2026-09-01", "2026-09-01", formatMessage)).toBe("1 days");
  });

  it("counts an open visit up to today", () => {
    vi.useFakeTimers({ now: new Date("2026-09-30T00:00:00Z") });

    expect(calculateDuration(null, "2026-09-20T00:00:00Z", formatMessage)).toBe("10 days");
  });
});
