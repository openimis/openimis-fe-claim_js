import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { Fab, Tooltip } from "@material-ui/core";
import { withTheme, withStyles } from "@material-ui/core/styles";
import _ from "lodash";
import AddIcon from "@material-ui/icons/Add";
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
} from "@openimis/fe-core";
import ClaimSearcher from "../components/ClaimSearcher";
import { submit, del, selectHealthFacility, submitAll } from "../actions";
import { RIGHT_ADD, RIGHT_LOAD, RIGHT_SUBMIT, RIGHT_DELETE, MODULE_NAME } from "../constants";

const CLAIM_HF_FILTER_CONTRIBUTION_KEY = "claim.HealthFacilitiesFilter";
const CLAIM_SEARCHER_ACTION_CONTRIBUTION_KEY = "claim.SelectionAction";

const styles = (theme) => ({
  page: theme.page,
  fab: theme.fab,
});

class HealthFacilitiesPage extends Component {
  constructor(props) {
    super(props);
    let defaultFilters = props.modulesManager.getConf("fe-claim", "healthFacilities.defaultFilters", {
      "claimStatus": {
        "value": 2,
        "filter": "status: 2",
      },
    });
    this.canSubmitClaimWithZero = props.modulesManager.getConf("fe-claim", "canSubmitClaimWithZero", false);
    this.state = {
      defaultFilters,
      confirmedAction: null,
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      this.setState({ reset: this.state.reset + 1 });
    } else if (!prevProps.confirmed && this.props.confirmed) {
      this.state.confirmedAction();
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
        );
    }

    this.setState({ confirmedAction }, confirm);
  };

  onDoubleClick = (c, newTab = false) => {
    historyPush(this.props.modulesManager, this.props.history, "claim.route.claimEdit", [c.uuid], newTab);
  };

  onAdd = () => {
    historyPush(this.props.modulesManager, this.props.history, "claim.route.claimEdit");
  };

  canAdd = () => {
    if (!this.props.claimAdmin) return false;
    if (!this.props.claimHealthFacility) return false;
    return true;
  };

  componentDidMount = () => {
    const { module } = this.props;
    if (module !== MODULE_NAME) this.props.clearCurrentPaginationPage();
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
    const { intl, classes, rights, generatingPrint } = this.props;
    if (!rights.filter((r) => r >= RIGHT_ADD && r <= RIGHT_SUBMIT).length) return null;
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
      <div className={classes.page}>
        <Helmet title={formatMessage(this.props.intl, "location", "location.healthFacilities.page.title")} />
        <ClaimSearcher
          defaultFilters={this.state.defaultFilters}
          cacheFiltersKey="claimHealthFacilitiesPageFiltersCache"
          onDoubleClick={rights.includes(RIGHT_LOAD) ? this.onDoubleClick : null}
          actions={actions}
          processing={generatingPrint}
          filterPaneContributionsKey={CLAIM_HF_FILTER_CONTRIBUTION_KEY}
          actionsContributionKey={CLAIM_SEARCHER_ACTION_CONTRIBUTION_KEY}
        />
        {!generatingPrint && rights.includes(RIGHT_ADD) && (
          <Tooltip
            title={
              !this.canAdd()
                ? formatMessage(intl, "claim", "newClaim.adminAndHFRequired")
                : formatMessage(intl, "claim", "newClaim.tooltip")
            }
          >
            <div className={classes.fab}>
              <Fab color="primary" disabled={!this.canAdd()} onClick={this.onAdd}>
                <AddIcon />
              </Fab>
            </div>
          </Tooltip>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  claimAdmin: state.claim.claimAdmin,
  claimHealthFacility: state.claim.claimHealthFacility,
  userHealthFacilityFullPath: !!state.loc ? state.loc.userHealthFacilityFullPath : null,
  submittingMutation: state.claim.submittingMutation,
  mutation: state.claim.mutation,
  confirmed: state.core.confirmed,
  filtersCache: state.core.filtersCache,
  selectedFilters: state.core.filtersCache.claimHealthFacilitiesPageFiltersCache,
  module: state.core?.savedPagination?.module,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      selectHealthFacility,
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

export default injectIntl(
  withModulesManager(
    withHistory(connect(mapStateToProps, mapDispatchToProps)(withTheme(withStyles(styles)(HealthFacilitiesPage)))),
  ),
);
