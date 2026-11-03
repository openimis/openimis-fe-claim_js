import React from "react";
import { describe, it, expect, vi } from "vitest";
import { act, render } from "@testing-library/react";

// The fe-core barrel cannot be loaded whole in a module test (UserPicker import
// cycle); the dialog only needs these, and the table itself is irrelevant here.
vi.mock("@openimis/fe-core", () => ({
  GetIconComponent: () => () => null,
  FormattedMessage: () => null,
  withModulesManager: (component) => component,
  ProgressOrError: () => null,
  Table: () => null,
  TextInput: () => null,
  PublishedComponent: () => null,
  withTooltip: (component) => component,
  formatMessage: (intl, module, id) => id,
  formatMessageWithValues: (intl, module, id) => id,
  journalize: vi.fn(),
  coreConfirm: vi.fn(),
  coreAlert: vi.fn(),
}));

vi.mock("../actions", () => ({
  fetchClaimAttachments: vi.fn(),
  downloadAttachment: vi.fn(),
  deleteAttachment: vi.fn(),
  createAttachment: vi.fn(),
  updateAttachment: vi.fn(),
}));

vi.mock("../pickers/AttachmentGeneralTypePicker", () => ({ default: () => null }));

import { AttachmentsDialog } from "./AttachmentsDialog";

const ATTACHMENT = { id: "att-1", title: "Scan", filename: "scan.pdf" };
const OTHER = { id: "att-2", title: "Invoice", filename: "invoice.pdf" };
const CLAIM = { code: "C-1" };

const renderDialog = () => {
  const ref = React.createRef();
  const props = {
    intl: {},
    modulesManager: { getConf: (module, key, fallback) => fallback },
    rights: [],
    claim: CLAIM,
    deleteAttachment: vi.fn(),
    coreConfirm: vi.fn(),
    journalize: vi.fn(),
    confirmed: null,
    submittingMutation: false,
  };
  const ui = (extra) => <AttachmentsDialog ref={ref} {...props} {...extra} />;
  const view = render(ui());
  act(() => ref.current.setState({ claimAttachments: [ATTACHMENT, OTHER, {}] }));
  const rerender = (extra) => act(() => view.rerender(ui(extra)));
  return { ref, props, rerender };
};

describe("AttachmentsDialog delete", () => {
  it("deletes once when its own dialog is confirmed", () => {
    const { ref, props } = renderDialog();

    act(() => ref.current.delete(ATTACHMENT, 0));
    expect(props.deleteAttachment).not.toHaveBeenCalled();
    act(() => props.coreConfirm.mock.calls.at(-1)?.[2]?.onConfirm());

    expect(props.deleteAttachment).toHaveBeenCalledTimes(1);
    expect(props.deleteAttachment.mock.calls[0][0]).toEqual(ATTACHMENT);
  });

  it('does not delete when another dialog in the app is answered "Yes"', () => {
    const { ref, props, rerender } = renderDialog();

    act(() => ref.current.delete(ATTACHMENT, 0));
    // Stands in for any other dialog in the app being answered.
    rerender({ confirmed: true });

    expect(props.deleteAttachment).not.toHaveBeenCalled();
  });

  it("keeps a cancelled attachment in the list when a later mutation completes", () => {
    const { ref, rerender } = renderDialog();

    act(() => ref.current.delete(ATTACHMENT, 0));
    rerender({ submittingMutation: true });
    rerender({ submittingMutation: false });

    expect(ref.current.state.claimAttachments).toContainEqual(ATTACHMENT);
  });
});
