import React, { Profiler } from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { IntlProvider } from "react-intl";
import { configureStore } from "@reduxjs/toolkit";

// The fe-core barrel cannot be loaded whole in a module test (UserPicker import
// cycle). The table is replaced by a stub recording the rows the panel hands it.
let tableItems;
vi.mock("@openimis/fe-core", async () => ({
  injectIntl: (await import("@openimis/fe-core/testing")).injectIntl,
  AmountInput: () => null,
  decodeId: (id) => id,
  Error: () => null,
  formatAmount: (mm, intl, amount) => String(amount),
  formatMessage: (intl, module, id) => id,
  formatMessageWithValues: (intl, module, id) => id,
  NumberInput: () => null,
  PublishedComponent: () => null,
  TableService: (props) => {
    tableItems = props.items;
    return null;
  },
  TextInput: () => null,
  withModulesManager: (component) => component,
  withTooltip: (component) => component,
  GetIconComponent: () => () => null,
}));

import ClaimChildPanel from "./ClaimChildPanel";

const modulesManager = { getConf: (module, key, defaultValue) => defaultValue };
const store = configureStore({ reducer: { medical_pricelist: (state = {}) => state } });

const claim = () => ({
  uuid: "11111111-2222-3333-4444-555555555555",
  status: 4,
  explanation: "",
  healthFacility: { servicesPricelist: { id: 1 }, itemsPricelist: { id: 2 } },
  services: [{ service: { id: 7 }, qtyProvided: 2, priceAsked: 10, status: 1 }],
  items: [{ item: { id: 9 }, qtyProvided: 1, priceAsked: 5, status: 1 }],
});

// Renders one panel of the review page and records its commits: one per render pass.
const renderPanel = (type, edited, extra = {}) => {
  const commits = [];
  const ui = (props) => (
    <Provider store={store}>
      <IntlProvider locale="en" messages={{}} onError={() => {}}>
        <Profiler id="panel" onRender={(id, phase) => commits.push(phase)}>
          <ClaimChildPanel
            modulesManager={modulesManager}
            type={type}
            forReview
            reset={0}
            onEditedChanged={() => {}}
            {...props}
          />
        </Profiler>
      </IntlProvider>
    </Provider>
  );
  const view = render(ui({ edited, ...extra }));
  return {
    commits,
    rerender: (props) => {
      commits.length = 0;
      view.rerender(ui(props));
    },
  };
};

describe("ClaimChildPanel", () => {
  it("shows the claim's rows", () => {
    const edited = claim();
    renderPanel("service", edited);

    expect(tableItems).toEqual(edited.services);
  });

  // OCM-42: every keystroke in the claim form re-reset both panels, each reset being
  // a setState from componentDidUpdate, hence a second, nested commit per keystroke.
  it("keeps its rows when a claim field it does not show changes", () => {
    const edited = claim();
    const { commits, rerender } = renderPanel("service", edited);
    const rows = tableItems;

    rerender({ edited: { ...edited, explanation: "checked" } });

    expect(commits).toEqual(["update"]);
    expect(tableItems).toBe(rows);
  });

  it("keeps its rows when only the other panel's rows change", () => {
    const edited = claim();
    const { commits, rerender } = renderPanel("item", edited);
    const rows = tableItems;

    rerender({ edited: { ...edited, services: [{ ...edited.services[0], qtyApproved: 2 }] } });

    expect(commits).toEqual(["update"]);
    expect(tableItems).toBe(rows);
  });

  it("takes the new rows when its own rows change", () => {
    const edited = claim();
    const { rerender } = renderPanel("service", edited);
    const services = [{ ...edited.services[0], qtyApproved: 2 }];

    rerender({ edited: { ...edited, services } });

    expect(tableItems).toEqual(services);
  });

  it("takes the rows of a reloaded claim", () => {
    const { rerender } = renderPanel("item", claim());
    const reloaded = { ...claim(), items: [{ item: { id: 3 }, qtyProvided: 4, priceAsked: 1, status: 1 }] };

    rerender({ edited: reloaded });

    expect(tableItems).toEqual(reloaded.items);
  });

  it("initialises its rows again when the form is reset", () => {
    // The same claim object, changed in place: only the reset counter tells the panel.
    const edited = claim();
    const { rerender } = renderPanel("service", edited);
    const services = [{ service: { id: 8 }, qtyProvided: 1, priceAsked: 3, status: 1 }];
    edited.services = services;

    rerender({ edited, reset: 1 });

    expect(tableItems).toBe(services);
  });

  it("adds the empty entry row when the claim becomes editable outside review", () => {
    const edited = { ...claim(), status: 4 };
    const { rerender } = renderPanel("item", edited, { forReview: false });

    rerender({ edited: { ...edited, status: 2 }, forReview: false });

    expect(tableItems[tableItems.length - 1]).toEqual({});
  });
});
