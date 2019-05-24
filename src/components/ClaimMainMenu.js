import React, { Component } from "react";
import { Healing, Subscriptions, Assignment } from "@material-ui/icons";
import { MainMenuContribution } from "@openimis/fe-core";

class ClaimMainMenu extends Component {
  render() {
    return (
      <MainMenuContribution
        {...this.props}
        header="Claim"
        entries={[
          {
            text: "Health Facility Claims",
            icon: <Healing />,
            route: "/claim/claims"
          },
          { text: "Review", icon: <Assignment />, route: "/claim/review" },
          { text: "Batch Run", icon: <Subscriptions /> }
        ]}
      />
    );
  }
}
export default ClaimMainMenu;
