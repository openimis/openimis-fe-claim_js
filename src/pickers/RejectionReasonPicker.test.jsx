import React from "react";
import { describe, expect, it, vi } from "vitest";

// fe-core's barrel imports itself, so the real helpers come from their defining modules.
vi.mock("@openimis/fe-core", async () => {
  const selectInput = await vi.importActual("@openimis/fe-core/components/inputs/SelectInput");
  const i18n = await vi.importActual("@openimis/fe-core/helpers/i18n");
  return { SelectInput: selectInput.default, formatMessage: i18n.formatMessage };
});

const { default: RejectionReasonPicker } = await import("./RejectionReasonPicker");
const { REJECTION_REASONS } = await import("../constants");
const { default: en } = await import("../translations/en.json");
const { renderWithProviders, screen, userEvent } = await import("@openimis/fe-core/testing");

const renderPicker = (props = {}) =>
  renderWithProviders(<RejectionReasonPicker onChange={() => {}} withLabel={false} {...props} />, { messages: en });

const openOptions = async () => {
  await userEvent.click(screen.getByRole("combobox"));
  return screen.getAllByRole("option").map((option) => option.textContent);
};

describe("RejectionReasonPicker", () => {
  it("offers every rejection reason, translated, after an empty choice", async () => {
    renderPicker();
    const options = await openOptions();

    expect(options).toHaveLength(REJECTION_REASONS.length + 1);
    expect(options[1]).toBe("Rejected by a medical officer");
    expect(options[2]).toBe("Accepted");
    expect(options.at(-1)).toBe("No active policy covers the patient at the date of care");
  });

  it("can leave out the empty choice", async () => {
    renderPicker({ withNull: false });

    expect(await openOptions()).toHaveLength(REJECTION_REASONS.length);
  });

  it("reports the chosen reason with its description", async () => {
    const onChange = vi.fn();
    renderPicker({ onChange });
    await openOptions();

    await userEvent.click(screen.getByRole("option", { name: "Item/Service duplicated" }));

    expect(onChange).toHaveBeenCalledWith(6, "Item/Service duplicated");
  });

  it("reports the bare code when compact", async () => {
    const onChange = vi.fn();
    renderPicker({ onChange, compact: true });
    await openOptions();

    await userEvent.click(screen.getByRole("option", { name: "Rejected by a medical officer" }));

    expect(onChange).toHaveBeenCalledWith(-1, -1);
  });

  it("shows the code of a read-only compact reason and explains it on hover", async () => {
    renderPicker({ readOnly: true, compact: true, value: 6 });

    await userEvent.hover(screen.getByText("6"));

    expect(await screen.findByRole("tooltip")).toHaveTextContent("Item/Service duplicated");
  });

  it("shows its label", () => {
    renderPicker({ withLabel: true });

    expect(screen.getByText("Rejection Reason")).toBeInTheDocument();
  });

  it("shows the code of a read-only reason outside compact mode", () => {
    renderPicker({ readOnly: true, value: 6 });

    expect(screen.getByText("6")).toBeInTheDocument();
  });
});
