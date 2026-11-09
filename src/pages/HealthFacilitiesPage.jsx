import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { Fab, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import _ from "lodash";
import {
  withHistory,
  historyPush,
  withModulesManager,
  formatMessage,
  formatMessageWithValues,
  journalize,
  coreConfirm,
  Helmet,
  clearCurrentPaginationPage,
  GetIconComponent,
} from "@openimis/fe-core";
import ClaimSearcher from "../components/ClaimSearcher";
import { claimAdminDefaultFilters } from "../components/ClaimFilter";
import { submit, del, selectHealthFacility, submitAll, selectClaimAdmin, fetchOwnClaimAdmin } from "../actions";
import {
  RIGHT_ADD,
  RIGHT_HF_ADD,
  RIGHT_HF_SEARCH,
  RIGHT_SEARCH,
  RIGHT_SUBMIT,
  RIGHT_DELETE,
  MODULE_NAME,
} from "../constants";
const AddIcon = GetIconComponent("Add")

const CLAIM_HF_FILTER_CONTRIBUTION_KEY = "claim.HealthFacilitiesFilter";
const CLAIM_SEARCHER_ACTION_CONTRIBUTION_KEY = "claim.SelectionAction";

const StyledDiv = styled("div")(({ theme }) => ({
  ...theme?.page ?? {},
}));

const StyledFabDiv = styled("div")(({ theme }) => ({
  ...theme?.fab ?? {},
}));

class HealthFacilitiesPage extends Component {
  constructor(props) {
    super(props);
    let defaultFilters = props.modulesManager.getConf("fe-claim", "healthFacilities.defaultFilters", {
      "claimStatus": {
        "value": 2,
        "filter": "status: 2",
      },
    });
    // A user linked to a claim administrator can only act as that one, so the pane opens
    // on it instead of offering a picker holding a single option; a configured default and
    // the cached filters of the last search both still win.
    defaultFilters = { ...claimAdminDefaultFilters(props.userClaimAdmin), ...defaultFilters };
    this.canSubmitClaimWithZero = props.modulesManager.getConf("fe-claim", "canSubmitClaimWithZero", false);
    this.state = {
      defaultFilters,
      ownClaimAdmin: null,
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      this.setState({ reset: this.state.reset + 1 });
    }
  }

  canSubmitSelected = (selection) =>
    !!selection &&
    selection.length &&
    selection.filter((s) => s.status === 2 && (!!this.canSubmitClaimWithZero || s.claimed > 0)).length ===
      selection.length;

  canSubmitAll = (selection) => !selection || selection.length == 0;

  submitSelected = (selection) => {
    if (selection.length === 1) {
      this.props.submit(
        selection,
        formatMessageWithValues(this.props.intl, "claim", "SubmitClaim.mutationLabel", { code: selection[0].code }),
      );
    } else {
      this.props.submit(
        selection,
        formatMessageWithValues(this.props.intl, "claim", "SubmitClaims.mutationLabel", { count: selection.length }),
        selection.map((c) => c.code),
      );
    }
  };

  submitAll = (selection) => {
    let filters = this.props.selectedFilters;
    if (selection.length === 0) {
      this.props.submitAll(
        filters,
        formatMessageWithValues(this.props.intl, "claim", "SubmitAllClaims.mutationLabel", { "claims": "All" }),
      );
    }
  };

  canDeleteSelected = (selection) =>
    !!selection && selection.length && selection.filter((s) => s.status === 2).length === selection.length;

  deleteSelected = (selection) => {
    let confirm = null;
    let confirmedAction = null;
    if (selection.length === 1) {
      confirmedAction = () =>
        this.props.del(
          selection,
          formatMessageWithValues(this.props.intl, "claim", "DeleteClaim.mutationLabel", { code: selection[0].code }),
        );
      confirm = (e) =>
        this.props.coreConfirm(
          formatMessage(this.props.intl, "claim", "deleteClaim.confirm.title"),
          formatMessageWithValues(this.props.intl, "claim", "deleteClaim.confirm.message", {
            code: selection[0].code,
          }),
          { onConfirm: confirmedAction },
        );
    } else {
      confirmedAction = () =>
        this.props.del(
          selection,
          formatMessageWithValues(this.props.intl, "claim", "DeleteClaims.mutationLabel", { count: selection.length }),
          selection.map((c) => c.code),
        );
      confirm = (e) =>
        this.props.coreConfirm(
          formatMessage(this.props.intl, "claim", "deleteClaims.confirm.title"),
          formatMessageWithValues(this.props.intl, "claim", "deleteClaims.confirm.message", {
            count: selection.length,
          }),
          { onConfirm: confirmedAction },
        );
    }

    confirm();
  };

  onDoubleClick = (c, newTab = false) => {
    historyPush(this.props.modulesManager, this.props.history, "claim.route.claimEdit", [c.uuid], newTab);
  };

  // The filter selection wins when set, so a user allowed to query several claim
  // administrators keeps acting on the one they searched for; users restricted to their
  // own record fall back to it and never have to pick themselves. `user.claim_admin`
  // comes with the session (current_user serialises the whole record, health facility
  // and location path included), so it needs no round trip; the query is only there for
  // the users whose tblUsers.ClaimAdminId is empty and whose link is resolved by login
  // name - see fetchOwnClaimAdmin.
  newClaimAdmin = () => this.props.claimAdmin ?? this.props.userClaimAdmin ?? this.state.ownClaimAdmin;

  newClaimHealthFacility = () => this.props.claimHealthFacility ?? this.newClaimAdmin()?.healthFacility;

  onAdd = () => {
    this.props.selectClaimAdmin(this.newClaimAdmin());
    this.props.selectHealthFacility(this.newClaimHealthFacility());
    historyPush(this.props.modulesManager, this.props.history, "claim.route.claimEdit");
  };

  canAdd = () => Boolean(this.newClaimAdmin()) && Boolean(this.newClaimHealthFacility());

  componentDidMount = async () => {
    const { module } = this.props;
    if (module !== MODULE_NAME) this.props.clearCurrentPaginationPage();

    if (!this.props.userClaimAdmin) {
      const ownClaimAdmin = await this.props.fetchOwnClaimAdmin(this.props.modulesManager);
      if (ownClaimAdmin) this.setState({ ownClaimAdmin });
    }
  };

  componentWillUnmount = () => {
    const { location, history } = this.props;
    const {
      location: { pathname },
    } = history;
    const urlPath = location.pathname;
    if (!pathname.includes(urlPath)) this.props.clearCurrentPaginationPage();
  };

  render() {
    const { intl, rights, generatingPrint } = this.props;
    if (!rights.includes(RIGHT_SEARCH) && !rights.includes(RIGHT_HF_SEARCH)) return null;
    const hasAddRight = rights.includes(RIGHT_ADD) || rights.includes(RIGHT_HF_ADD);
    let actions = [];
    if (rights.includes(RIGHT_SUBMIT)) {
      actions.push({ label: "claimSummaries.submitAll", enabled: this.canSubmitAll, action: this.submitAll });
      actions.push({
        label: "claimSummaries.submitSelected",
        enabled: this.canSubmitSelected,
        action: this.submitSelected,
      });
    }
    if (rights.includes(RIGHT_DELETE)) {
      actions.push({
        label: "claimSummaries.deleteSelected",
        enabled: this.canDeleteSelected,
        action: this.deleteSelected,
      });
    }
    return (
      <StyledDiv className="page">
        <Helmet title={formatMessage(this.props.intl, "location", "location.healthFacilities.page.title")} />
        <ClaimSearcher
          defaultFilters={this.state.defaultFilters}
          cacheFiltersKey="claimHealthFacilitiesPageFiltersCache"
          onDoubleClick={this.onDoubleClick}
          actions={actions}
          processing={generatingPrint}
          filterPaneContributionsKey={CLAIM_HF_FILTER_CONTRIBUTION_KEY}
          actionsContributionKey={CLAIM_SEARCHER_ACTION_CONTRIBUTION_KEY}
        />
        {!generatingPrint && hasAddRight && (
          <Tooltip
            title={
              !this.canAdd()
                ? formatMessage(intl, "claim", "newClaim.adminAndHFRequired")
                : formatMessage(intl, "claim", "newClaim.tooltip")
            }
          >
            <StyledFabDiv className="fab">
              <Fab data-cy="create-claim-button" color="primary" disabled={!this.canAdd()} onClick={this.onAdd}>
                <AddIcon />
              </Fab>
            </StyledFabDiv>
          </Tooltip>
        )}
      </StyledDiv>
    );
  }
}

const mapStateToProps = (state) => ({
  state,
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  claimAdmin: state.claim.claimAdmin,
  claimHealthFacility: state.claim.claimHealthFacility,
  userHealthFacilityFullPath: !!state.loc ? state.loc.userHealthFacilityFullPath : null,
  submittingMutation: state.claim.submittingMutation,
  mutation: state.claim.mutation,
  filtersCache: state.core.filtersCache,
  selectedFilters: state.core.filtersCache.claimHealthFacilitiesPageFiltersCache,
  module: state.core?.savedPagination?.module,
  userClaimAdmin: state.core?.user?.claim_admin,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      selectClaimAdmin,
      selectHealthFacility,
      fetchOwnClaimAdmin,
      journalize,
      coreConfirm,
      submit,
      submitAll,
      del,
      clearCurrentPaginationPage,
    },
    dispatch,
  );
};

export { CLAIM_HF_FILTER_CONTRIBUTION_KEY };
export { HealthFacilitiesPage };
export default injectIntl(
  withModulesManager(
    withHistory(connect(mapStateToProps, mapDispatchToProps)(HealthFacilitiesPage)),
  ),
);
