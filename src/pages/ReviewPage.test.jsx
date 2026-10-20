import React from "react";
import { describe, it, expect, vi } from "vitest";
import { act, render } from "@testing-library/react";

// The fe-core barrel cannot be loaded whole in a module test (UserPicker import
// cycle); the page only needs its HOCs (identity here) and the label formatter.
vi.mock("@openimis/fe-core", () => ({
  withModulesManager: (component) => component,
  withHistory: (component) => component,
  formatMessageWithValues: (intl, module, id) => id,
  historyPush: () => {},
  journalize: () => {},
}));

// The form is irrelevant here: capture the callbacks the page hands it.
let formProps;
vi.mock("../components/ClaimForm", () => ({
  default: (props) => {
    formProps = props;
    return null;
  },
}));

import { ReviewPage } from "./ReviewPage";

const editedClaim = () => ({
  uuid: "11111111-2222-3333-4444-555555555555",
  code: "C-1",
  items: [],
  services: [{ id: 7, qtyApproved: 3, status: 2 }],
});

const renderPage = () => {
  const props = {
    intl: {},
    match: { params: { claim_uuid: editedClaim().uuid } },
    saveReview: vi.fn(),
    deliverReview: vi.fn(),
  };
  render(<ReviewPage {...props} />);
  return props;
};

describe("ReviewPage", () => {
  it("saves the review without delivering it", () => {
    const props = renderPage();
    const claim = editedClaim();

    act(() => formProps.save(claim));

    expect(props.saveReview).toHaveBeenCalledTimes(1);
    expect(props.saveReview.mock.calls[0][0]).toBe(claim);
    expect(props.saveReview.mock.calls[0][2]).toBeFalsy();
    expect(props.deliverReview).not.toHaveBeenCalled();
  });

  // OP-3207: submitting must save the on-screen review, not only flag the
  // claim as delivered with whatever was last saved.
  it("saves and delivers the on-screen review on submit", () => {
    const props = renderPage();
    const claim = editedClaim();

    act(() => formProps.deliverReview(claim));

    expect(props.saveReview).toHaveBeenCalledTimes(1);
    expect(props.saveReview.mock.calls[0][0]).toBe(claim);
    expect(props.saveReview.mock.calls[0][2]).toBe(true);
    expect(props.deliverReview).not.toHaveBeenCalled();
  });
});
