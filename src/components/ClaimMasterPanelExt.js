import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Grid, Typography, Divider } from "@material-ui/core";
import { PublishedComponent, FormattedMessage, ProgressOrError, TextInput } from "@openimis/fe-core";
import { clearLastClaimAt, fetchLastClaimAt } from "../actions";
import { getTimeDifferenceInDaysFromToday } from "@openimis/fe-core";

const styles = (theme) => ({
  tableHeader: theme.table.header,
  item: theme.paper.item,
  activeLabel: {
    padding: 10,
  },
  inactiveLabel: {
    padding: 10,
    color: "#e20606",
  },
});

const ACTIVE_LABEL = "ClaimMasterPanelExt.InsureePolicyEligibilitySummaryActive.header";
const INACTIVE_LABEL = "ClaimMasterPanelExt.InsureePolicyEligibilitySummaryInactive.header";
const DEFAULT_LABEL =  "ClaimMasterPanelExt.InsureePolicyEligibilitySummary.header";

class ClaimMasterPanelExt extends Component {
  componentDidMount() {
    this.props.clearLastClaimAt();
    const { claim } = this.props;
    if (!!claim && !!claim.insuree && !!claim.healthFacility) {
      this.props.fetchLastClaimAt(claim);
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { claim } = this.props;
    if (
      !!claim &&
      !!claim.insuree &&
      !!claim.healthFacility &&
      (!prevProps.claim ||
        !prevProps.claim.insuree ||
        !prevProps.claim.healthFacility ||
        prevProps.claim.insuree.chfId !== claim.insuree.chfId ||
        prevProps.claim.healthFacility.chfId !== claim.healthFacility.chfId)
    ) {
      this.props.fetchLastClaimAt(claim);
    }
  }

  componentWillUnmount() {
    this.props.clearLastClaimAt();
  }

  getPolicyStatusLabel(timeDelta) { return timeDelta >= 0 ? ACTIVE_LABEL : INACTIVE_LABEL; };

  getPolicyStatusLabelStyle(timeDelta, classes) { return timeDelta >= 0 ? classes.activeLabel : classes.inactiveLabel; }

  render() {
    const { classes, claim, fetchingLastClaimAt, errorLastClaimAt, fetchedLastClaimAt, lastClaimAt } = this.props;
    const timeDelta = getTimeDifferenceInDaysFromToday(this.props.currentPolicy ? this.props.currentPolicy?.[0]?.expiryDate : null);
    const policyStatusLabel = this.props.currentPolicy ? this.getPolicyStatusLabel(timeDelta) : DEFAULT_LABEL;
    const policyStatusLabelStyle = this.props.currentPolicy ? this.getPolicyStatusLabelStyle(timeDelta, classes) : classes.item;
    return (
      <Grid container>
        <Grid item xs={6} className={classes.item}>
          <Typography className={policyStatusLabelStyle}>
            <FormattedMessage module="claim" id={policyStatusLabel} />
          </Typography>
          <Divider />
        </Grid>
        <Grid item xs={6} className={classes.item}>
          <Typography className={classes.tableTitle}>
            <FormattedMessage module="claim" id="ClaimMasterPanelExt.InsureeLastVisit.header" />
          </Typography>
          <Divider />
        </Grid>
        <Grid item xs={6} className={classes.item}>
          <PublishedComponent
            pubRef="policy.InsureePolicyEligibilitySummary"
            insuree={!!claim ? claim.insuree : null}
          />
        </Grid>
        <Grid item xs={6} className={classes.item}>
          <ProgressOrError progress={fetchingLastClaimAt} error={errorLastClaimAt} />
          {!!fetchedLastClaimAt && !lastClaimAt && (
            <FormattedMessage module="claim" id="ClaimMasterPanelExt.InsureeLastVisit.noOtheClaim" />
          )}
          {!!fetchedLastClaimAt && lastClaimAt?.uuid === claim.uuid && (
            <FormattedMessage module="claim" id="ClaimMasterPanelExt.InsureeLastVisit.thisClaimIsLastVisit" />
          )}
          {!!fetchedLastClaimAt && !!lastClaimAt && lastClaimAt?.uuid !== claim.uuid && (
            <Grid container>
              <Grid xs={4} item className={classes.item}>
                <TextInput
                  module="claim"
                  label="ClaimMasterPanelExt.InsureeLastVisit.claimCode"
                  readOnly={true}
                  value={lastClaimAt.code}
                />
              </Grid>
              <Grid xs={4} item className={classes.item}>
                <PublishedComponent
                  pubRef="core.DatePicker"
                  value={lastClaimAt.dateFrom}
                  module="claim"
                  label="ClaimMasterPanelExt.InsureeLastVisit.lastClaimAtFrom"
                  readOnly={true}
                />
              </Grid>
              <Grid xs={4} item className={classes.item}>
                <PublishedComponent
                  pubRef="core.DatePicker"
                  value={lastClaimAt.dateTo}
                  module="claim"
                  label="ClaimMasterPanelExt.InsureeLastVisit.lastClaimAtTo"
                  readOnly={true}
                />
              </Grid>
            </Grid>
          )}
        </Grid>
      </Grid>
    );
  }
}

const mapStateToProps = (state) => ({
  fetchingLastClaimAt: state.claim.fetchingLastClaimAt,
  fetchedLastClaimAt: state.claim.fetchedLastClaimAt,
  lastClaimAt: state.claim.lastClaimAt,
  errorLastClaimAt: state.claim.errorLastClaimAt,
  currentPolicy: state.policy.policies,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ fetchLastClaimAt, clearLastClaimAt }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(withStyles(styles)(ClaimMasterPanelExt)));
