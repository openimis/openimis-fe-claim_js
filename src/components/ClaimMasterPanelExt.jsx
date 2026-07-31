import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";

import { Grid, Typography, Divider, Button } from "@mui/material";
import { useTheme, styled } from "@mui/material/styles";

import {
  PublishedComponent,
  FormattedMessage,
  ProgressOrError,
  TextInput,
  historyPush,
  withHistory,
  withModulesManager,
  getTimeDifferenceInDaysFromToday,
  formatMessage,
  GRID_RESPONSIVE_HALF,
  GRID_RESPONSIVE_STANDARD,
} from "@openimis/fe-core";
import {
  clearLastClaimAt,
  fetchLastClaimAt,
  clearLastClaimWithSameDiagnosis,
  fetchLastClaimWithSameDiagnosis,
} from "../actions";
import { DEFAULT, POLICY_ACTIVE_STATUS } from "../constants";
import AdditionalPanelHeaders from "./AdditionalPanelHeaders";
import AdditionalPanelInsuree from "./AdditionalPanelInsuree";
import AdditionalPanelClaim from "./AdditionalPanelClaim";

const StyledItemGrid = styled(Grid)(({ theme }) => ({
  ...theme?.paper?.item ?? {},
}));

const StyledTableTitle = styled(Typography)(({ theme }) => ({
  ...theme?.table?.header ?? {},
}));

const StyledInactiveLabel = styled(Typography)({
  color: "#e20606",
});

const StyledActiveLabel = styled(Typography)({
  color: "#4caf50",
});

const ACTIVE_LABEL = "ClaimMasterPanelExt.InsureePolicyEligibilitySummaryActive.header";
const INACTIVE_LABEL = "ClaimMasterPanelExt.InsureePolicyEligibilitySummaryInactive.header";
const DEFAULT_LABEL = "ClaimMasterPanelExt.InsureePolicyEligibilitySummary.header";

class ClaimMasterPanelExt extends Component {
  constructor(props) {
    super(props);
    this.isAdditionalPanelEnabled = props.modulesManager.getConf(
      "fe-claim",
      "ClaimMasterPanelExt.isAdditionalPanelEnabled",
      DEFAULT.IS_ADDITIONAL_PANEL_ENABLED,
    );
  }

  componentDidMount() {
    const { claim, clearLastClaimAt, fetchLastClaimAt, fetchLastClaimWithSameDiagnosis } = this.props;
    clearLastClaimAt();
    if (!!claim?.insuree && !!claim?.healthFacility) {
      fetchLastClaimAt(claim);
    }
    if (this.isAdditionalPanelEnabled && !!claim?.insuree?.chfId && !!claim?.icd) {
      fetchLastClaimWithSameDiagnosis(claim.icd, claim.insuree);
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { claim, fetchLastClaimAt, fetchLastClaimWithSameDiagnosis } = this.props;
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
      fetchLastClaimAt(claim);
      if (this.isAdditionalPanelEnabled && !!claim.insuree.chfId && !!claim.icd) {
        fetchLastClaimWithSameDiagnosis(claim.icd, claim.insuree.chfId);
      }
    }
  }

  componentWillUnmount() {
    const { clearLastClaimAt } = this.props;
    clearLastClaimAt();
  }

  goToClaimUuid(uuid) {
    const { modulesManager, history } = this.props;
    historyPush(modulesManager, history, "claim.route.claimEdit", [uuid], true);
  }

  valuatePolicyValidity = (currentPolicy) => {
    if (!currentPolicy?.length) {
      return { policyInfoLabel: INACTIVE_LABEL, PolicyInfoComponent: StyledInactiveLabel };
    }

    const validityPeriod = getTimeDifferenceInDaysFromToday(currentPolicy[0].expiryDate);
    const isPolicyActive = currentPolicy[0].status === POLICY_ACTIVE_STATUS;

    return {
      policyInfoLabel: validityPeriod >= 0 && isPolicyActive ? ACTIVE_LABEL : INACTIVE_LABEL,
      PolicyInfoComponent: validityPeriod >= 0 && isPolicyActive ? StyledActiveLabel : StyledInactiveLabel,
    };
  };

  render() {
    const {
      claim,
      fetchingLastClaimAt,
      errorLastClaimAt,
      fetchedLastClaimAt,
      lastClaimAt,
      restore,
      isRestored,
      intl,
      fetchedSameDiagnosisClaim,
      fetchingSameDiagnosisClaim,
      sameDiagnosisClaim,
      errorSameDiagnosisClaim,
      currentPolicy,
      dateTo,
      dateFrom,
      insuree,
    } = this.props;
    const { policyInfoLabel, PolicyInfoComponent } = this.valuatePolicyValidity(currentPolicy);

    return (
      <Grid container spacing={2}>
        <StyledItemGrid size={GRID_RESPONSIVE_HALF} className="item">
          <PolicyInfoComponent>
            <FormattedMessage module="claim" id={policyInfoLabel} />
          </PolicyInfoComponent>
          <Divider />
        </StyledItemGrid>
        <StyledItemGrid size={GRID_RESPONSIVE_HALF} className="item">
          <StyledTableTitle>
            <FormattedMessage module="claim" id="ClaimMasterPanelExt.InsureeLastVisit.header" />
          </StyledTableTitle>
          <Divider />
        </StyledItemGrid>
        <StyledItemGrid size={GRID_RESPONSIVE_HALF} className="item">
          <PublishedComponent
            pubRef="policy.InsureePolicyEligibilitySummary"
            insuree={!!claim ? claim.insuree : null}
            targetDate={!!claim ? claim.dateFrom ?? claim.dateTo : null}
          />
        </StyledItemGrid>
        <StyledItemGrid size={GRID_RESPONSIVE_HALF} className="item">
          <ProgressOrError progress={fetchingLastClaimAt} error={errorLastClaimAt} />
          {!!fetchedLastClaimAt && !lastClaimAt && (
            <FormattedMessage module="claim" id="ClaimMasterPanelExt.InsureeLastVisit.noOtheClaim" />
          )}
          {!!fetchedLastClaimAt && lastClaimAt?.uuid === claim.uuid && (
            <FormattedMessage module="claim" id="ClaimMasterPanelExt.InsureeLastVisit.thisClaimIsFirstVisit" />
          )}
          {!!fetchedLastClaimAt && !!lastClaimAt && lastClaimAt?.uuid !== claim.uuid && (
            <Grid container spacing={2}>
              <Grid size={GRID_RESPONSIVE_STANDARD} className="item">
                <TextInput
                  module="claim"
                  label="ClaimMasterPanelExt.InsureeLastVisit.claimCode"
                  readOnly={true}
                  value={lastClaimAt.code}
                />
              </Grid>
              <Grid size={GRID_RESPONSIVE_STANDARD} className="item">
                <PublishedComponent
                  pubRef="core.DatePicker"
                  value={lastClaimAt.dateFrom}
                  module="claim"
                  label="ClaimMasterPanelExt.InsureeLastVisit.lastClaimAtFrom"
                  readOnly={true}
                />
              </Grid>
              <Grid size={GRID_RESPONSIVE_STANDARD} className="item">
                <PublishedComponent
                  pubRef="core.DatePicker"
                  value={lastClaimAt.dateTo}
                  module="claim"
                  label="ClaimMasterPanelExt.InsureeLastVisit.lastClaimAtTo"
                  readOnly={true}
                />
              </Grid>
              <Button variant="contained" color="primary" onClick={() => this.goToClaimUuid(lastClaimAt.uuid)}>
                {formatMessage(intl, "claim", "ClaimMasterPanelExt.InsureeInfo.goToClaim.Button")}
              </Button>
            </Grid>
          )}
        </StyledItemGrid>
        {this.isAdditionalPanelEnabled && <AdditionalPanelHeaders />}
        {this.isAdditionalPanelEnabled && (
          <AdditionalPanelInsuree
            dateTo={dateTo}
            dateFrom={dateFrom}
            insuree={insuree}
            dateClaimed={claim?.dateClaimed}
            isEdited={claim?.uuid}
          />
        )}
        {this.isAdditionalPanelEnabled && (
          <StyledItemGrid size={GRID_RESPONSIVE_HALF} className="item">
            <ProgressOrError progress={fetchingSameDiagnosisClaim} error={errorSameDiagnosisClaim} />
            {!!fetchedSameDiagnosisClaim && !sameDiagnosisClaim && (
              <FormattedMessage module="claim" id="ClaimMasterPanelExt.sameDiagnosisClaim.noClaim" />
            )}
            {!!fetchedSameDiagnosisClaim && sameDiagnosisClaim?.uuid === claim.uuid && (
              <FormattedMessage module="claim" id="ClaimMasterPanelExt.sameDiagnosisClaim.onlyThis" />
            )}
            {!!fetchedSameDiagnosisClaim && !!sameDiagnosisClaim && sameDiagnosisClaim?.uuid !== claim.uuid && (
              <AdditionalPanelClaim sameDiagnosisClaim={sameDiagnosisClaim} />
            )}
          </StyledItemGrid>
        )}
        {isRestored && restore?.uuid && (
          <StyledItemGrid size={GRID_RESPONSIVE_HALF} className="item">
            <Typography>
              <FormattedMessage module="claim" id="ClaimMasterPanelExt.restore" />
            </Typography>
            <Button variant="contained" color="primary" onClick={() => this.goToClaimUuid(restore.uuid)}>
              {restore?.code}
            </Button>
          </StyledItemGrid>
        )}
      </Grid>
    );
  }
}

const mapStateToProps = (state) => ({
  fetchingLastClaimAt: state.claim.fetchingLastClaimAt,
  fetchedLastClaimAt: state.claim.fetchedLastClaimAt,
  lastClaimAt: state.claim.lastClaimAt,
  errorLastClaimAt: state.claim.errorLastClaimAt,
  fetchingSameDiagnosisClaim: state.claim.fetchingSameDiagnosisClaim,
  fetchedSameDiagnosisClaim: state.claim.fetchedSameDiagnosisClaim,
  sameDiagnosisClaim: state.claim.sameDiagnosisClaim,
  errorSameDiagnosisClaim: state.claim.errorSameDiagnosisClaim,
  currentPolicy: state.policy.policies,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    { fetchLastClaimAt, clearLastClaimAt, fetchLastClaimWithSameDiagnosis, clearLastClaimWithSameDiagnosis },
    dispatch,
  );
};

export { StyledItemGrid };
export { ClaimMasterPanelExt };
export default withHistory(
  withModulesManager(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(ClaimMasterPanelExt)),
  ),
);
