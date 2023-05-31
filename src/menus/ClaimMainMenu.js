import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { Keyboard, ScreenShare, Assignment } from "@material-ui/icons";
import { formatMessage, MainMenuContribution, withModulesManager } from "@openimis/fe-core";
import { RIGHT_ADD, RIGHT_SUBMIT, RIGHT_CLAIMREVIEW, RIGHT_PROCESS } from "../constants";
const CLAIM_MAIN_MENU_CONTRIBUTION_KEY = "claim.MainMenu";

class ClaimMainMenu extends Component {
  render() {
    const { rights } = this.props;
    let entries = [];
    if (!!rights.filter((r) => r >= RIGHT_ADD && r <= RIGHT_SUBMIT).length) {
      // RIGHT_SEARCH is shared by HF & HQ staff)
      entries.push({
        text: formatMessage(this.props.intl, "claim", "menu.healthFacilityClaims"),
        icon: <Keyboard />,
        route: "/claim/healthFacilities",
      });
    }
    if (!!rights.filter((r) => r >= RIGHT_CLAIMREVIEW && r <= RIGHT_PROCESS).length) {
      entries.push({
        text: formatMessage(this.props.intl, "claim", "menu.reviews"),
        icon: <Assignment />,
        route: "/claim/reviews",
      });
    }
    entries.push(
      ...this.props.modulesManager
        .getContribs(CLAIM_MAIN_MENU_CONTRIBUTION_KEY)
        .filter((c) => !c.filter || c.filter(rights)),
    );
    if (!entries.length) return null;
    return (
      <MainMenuContribution
        {...this.props}
        header={formatMessage(this.props.intl, "claim", "mainMenu")}
        icon={<ScreenShare />}
        entries={entries}
      />
    );
  }
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
});
export default withModulesManager(injectIntl(connect(mapStateToProps)(ClaimMainMenu)));
