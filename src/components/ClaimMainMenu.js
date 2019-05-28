import React, { Component } from "react";
import { Keyboard, ScreenShare, Subscriptions, Assignment } from "@material-ui/icons";
import { MainMenuContribution } from "@openimis/fe-core";

class ClaimMainMenu extends Component {
  render() {
    return (
      <MainMenuContribution
        {...this.props}
        header="Claims"
        icon={<ScreenShare/>}
        entries={[
          {
            text: "Health Facility Claims",
            icon: <Keyboard />,
            route: "/claim/claims"
          },
          { text: "Review", icon: <Assignment />, route: "/claim/review" },
          { text: "Batch Run", icon: <Subscriptions />, route: "/claim/batch" }
        ]}
      />
    );
  }
}
export { ClaimMainMenu };
