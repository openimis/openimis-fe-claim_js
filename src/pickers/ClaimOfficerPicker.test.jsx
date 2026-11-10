import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const core = vi.hoisted(() => ({
  graphqlWithVariables: vi.fn((operation, variables, type, meta) => ({ operation, variables, type, meta })),
}));

// fe-core's barrel imports itself, so the real helpers come from their defining modules.
vi.mock("@openimis/fe-core", async () => {
  const autocomplete = await vi.importActual("@openimis/fe-core/components/inputs/Autocomplete");
  return {
    ...(await vi.importActual("@openimis/fe-core/helpers/api")),
    ...(await vi.importActual("@openimis/fe-core/helpers/i18n")),
    ...(await vi.importActual("@openimis/fe-core/helpers/modules")),
    Autocomplete: autocomplete.default,
    ...core,
  };
});

const { default: ClaimOfficerPicker } = await import("./ClaimOfficerPicker");
const { default: reducer } = await import("../reducer");
const { globalId, makeStore, mockModulesManager, renderWithProviders, screen, userEvent, waitFor } = await import(
  "@openimis/fe-core/testing"
);

const officer = (id, code, lastName) => ({ id: globalId("ClaimOfficerGQLType", id), code, lastName, otherNames: "Jo" });
const OFFICERS = [officer(1, "E1", "Doe"), officer(2, "E2", "Roe")];

const modulesManager = mockModulesManager({
  getConf: (_module, key, fallback) => (key === "debounceTime" ? 0 : fallback),
});

const renderPicker = (props = {}) => {
  const initial = reducer(undefined, { type: "@@INIT" });
  const store = makeStore({
    reducers: { claim: reducer },
    preloadedState: { claim: { ...initial, claimOfficers: { ...initial.claimOfficers, items: OFFICERS } } },
  });
  return renderWithProviders(<ClaimOfficerPicker onChange={() => {}} {...props} />, {
    store,
    modulesManager,
    messages: { "claim.ClaimOfficerPicker.label": "Enrolment Officer" },
  });
};

describe("ClaimOfficerPicker", () => {
  beforeEach(() => core.graphqlWithVariables.mockClear());

  it("loads the officers once when it mounts", () => {
    renderPicker();

    expect(core.graphqlWithVariables).toHaveBeenCalledTimes(1);
    expect(core.graphqlWithVariables.mock.calls[0][1]).toEqual({});
  });

  it("offers the loaded officers by code and name", async () => {
    renderPicker();

    await userEvent.click(screen.getByRole("combobox", { name: "Enrolment Officer" }));

    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["E1 Doe Jo", "E2 Roe Jo"]);
  });

  it("reports the chosen officer with its label", async () => {
    const onChange = vi.fn();
    renderPicker({ onChange });

    await userEvent.click(screen.getByRole("combobox", { name: "Enrolment Officer" }));
    await userEvent.click(screen.getByRole("option", { name: "E2 Roe Jo" }));

    expect(onChange).toHaveBeenCalledWith(OFFICERS[1], "E2 Roe Jo");
  });

  // Currently fails: typing only updates local `variables`; the effect that fetches runs
  // once on mount, so officers beyond the first 20 can never be found.
  it.fails("searches the server with what the user types", async () => {
    renderPicker();

    await userEvent.type(screen.getByRole("combobox", { name: "Enrolment Officer" }), "Smith");

    await waitFor(
      () => expect(core.graphqlWithVariables).toHaveBeenLastCalledWith(
        expect.any(String),
        { search: "Smith" },
        "CLAIM_ENROLMENT_OFFICERS",
        { skip: true },
      ),
      { timeout: 300 },
    );
  });
});
