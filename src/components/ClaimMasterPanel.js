import React, { Fragment } from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { bindActionCreators } from "redux";
import {
  formatMessage,
  ControlledField,
  withModulesManager,
  FormPanel,
  PublishedComponent,
  Contributions,
  AmountInput,
  TextInput,
  ValidatedTextInput,
} from "@openimis/fe-core";
import { Grid } from "@material-ui/core";
import _ from "lodash";
import ClaimAdminPicker from "../pickers/ClaimAdminPicker";
import { claimedAmount, approvedAmount } from "../helpers/amounts";
import {
  claimCodeSetValid,
  claimCodeValidationCheck,
  claimCodeValidationClear,
  claimHealthFacilitySet,
  clearClaim,
} from "../actions";
import ClaimStatusPicker from "../pickers/ClaimStatusPicker";
import FeedbackStatusPicker from "../pickers/FeedbackStatusPicker";
import ReviewStatusPicker from "../pickers/ReviewStatusPicker";
import _debounce from "lodash/debounce";

const CLAIM_MASTER_PANEL_CONTRIBUTION_KEY = "claim.MasterPanel";

const styles = (theme) => ({
  paper: theme.paper.paper,
  paperHeader: theme.paper.header,
  paperHeaderAction: theme.paper.action,
  item: theme.paper.item,
});

class ClaimMasterPanel extends FormPanel {
  state = {
    claimCode: null,
    claimCodeError: null,
  };

  shouldValidate = (inputValue) => {
    const { savedClaimCode } = this.props;
    const shouldValidate = inputValue !== (savedClaimCode);
    return shouldValidate;
  };

  constructor(props) {
    super(props);
    this.codeMaxLength = props.modulesManager.getConf("fe-claim", "claimForm.codeMaxLength", 8);
    this.guaranteeIdMaxLength = props.modulesManager.getConf("fe-claim", "claimForm.guaranteeIdMaxLength", 50);
    this.showAdjustmentAtEnter = props.modulesManager.getConf("fe-claim", "claimForm.showAdjustmentAtEnter", false);
    this.insureePicker = props.modulesManager.getConf(
      "fe-claim",
      "claimForm.insureePicker",
      "insuree.InsureeChfIdPicker",
    );
    this.allowReferHF = props.modulesManager.getConf(
      "fe-claim",
      "claimForm.referHF",
      true,
    );
    this.claimTypeReferSymbol = props.modulesManager.getConf(
      "fe-claim",
      "claimForm.claimTypeReferSymbol",
      'R',
    );
    this.EMPTY_STRING = ""
  }

  componentWillUnmount = () => {
    this.props?.clearClaim();
  };

  computePriceAdjusted() {
    let totalServices = 0;
    let totalItems = 0;
    if (this.props.edited.services) {
      totalServices = this.props.edited.services.reduce(
        (total, currentItem) =>
          total + (!isNaN(parseFloat(currentItem.priceAdjusted)) ? parseFloat(currentItem.priceAdjusted) : 0),
        0,
      );
    }

    if (this.props.edited.items) {
      totalItems = this.props.edited.items.reduce(
        (total, currentItem) =>
          total + (!isNaN(parseFloat(currentItem.priceAdjusted)) ? parseFloat(currentItem.priceAdjusted) : 0),
        0,
      );
    }

    return totalServices + totalItems;
  }
  
  render() {
    const {
      intl,
      classes,
      edited,
      reset,
      readOnly = false,
      forReview,
      forFeedback,
      isCodeValid,
      isCodeValidating,
      codeValidationError,
      userHealthFacilityFullPath }
      = this.props;
    if (!edited) return null;
    let totalClaimed = 0;
    let totalApproved = 0;
    if (edited.items) {
      totalClaimed += edited.items.reduce((sum, r) => sum + claimedAmount(r), 0);
      totalApproved += edited.items.reduce((sum, r) => sum + approvedAmount(r), 0);
    }
    if (edited.services) {
      totalClaimed += edited.services.reduce((sum, r) => sum + claimedAmount(r), 0);
      totalApproved += edited.services.reduce((sum, r) => sum + approvedAmount(r), 0);
    }
    edited.claimed = _.round(totalClaimed, 2);
    edited.approved = _.round(totalApproved, 2);
    let ro = readOnly || !!forReview || !!forFeedback;
    return (
      <Grid container>
        <ControlledField
          module="claim"
          id="Claim.healthFacility"
          field={
            <Grid item xs={3} className={classes.item}>
              <PublishedComponent
                pubRef="location.HealthFacilityPicker"
                value={edited.healthFacility}
                reset={reset}
                readOnly={true}
                required={true}
              />
            </Grid>
          }
        />
        <ControlledField
          module="claim"
          id="Claim.insuree"
          field={
            <Grid item xs={3} className={classes.item}>
              <PublishedComponent
                pubRef={this.insureePicker}
                value={edited.insuree}
                reset={reset}
                onChange={(v, s) => this.updateAttribute("insuree", v)}
                readOnly={ro}
                required={true}
              />
            </Grid>
          }
        />
        <ControlledField
          module="claim"
          id="Claim.visitDateFrom"
          field={
            <Grid item xs={2} className={classes.item}>
              <PublishedComponent
                pubRef="core.DatePicker"
                value={edited.dateFrom}
                module="claim"
                label="visitDateFrom"
                reset={reset}
                onChange={(d) => this.updateAttribute("dateFrom", d)}
                readOnly={ro}
                required={true}
                maxDate={edited.dateTo < edited.dateClaimed ? edited.dateTo : edited.dateClaimed}
              />
            </Grid>
          }
        />
        <ControlledField
          module="claim"
          id="Claim.visitDateTo"
          field={
            <Grid item xs={2} className={classes.item}>
              <PublishedComponent
                pubRef="core.DatePicker"
                value={edited.dateTo}
                module="claim"
                label="visitDateTo"
                reset={reset}
                onChange={(d) => this.updateAttribute("dateTo", d)}
                readOnly={ro}
                minDate={edited.dateFrom}
                maxDate={edited.dateClaimed}
              />
            </Grid>
          }
        />
        <ControlledField
          module="claim"
          id="Claim.claimedDate"
          field={
            <Grid item xs={2} className={classes.item}>
              <PublishedComponent
                pubRef="core.DatePicker"
                value={edited.dateClaimed}
                module="claim"
                label="claimedDate"
                reset={reset}
                onChange={(d) => this.updateAttribute("dateClaimed", d)}
                readOnly={ro}
                required={true}
                minDate={!!edited.dateTo ? edited.dateTo : edited.dateFrom}
              />
            </Grid>
          }
        />
        <ControlledField
          module="claim"
          id="Claim.visitType"
          field={
            <Grid item xs={forFeedback || forReview ? 2 : 3} className={classes.item}>
              <PublishedComponent
                pubRef="medical.VisitTypePicker"
                name="visitType"
                withNull={false}
                value={edited.visitType}
                reset={reset}
                onChange={(v, s) => this.updateAttribute("visitType", v)}
                readOnly={ro}
                required={true}
              />
            </Grid>
          }
        />
        {!forFeedback && (
          <ControlledField
            module="claim"
            id="Claim.mainDiagnosis"
            field={
              <Grid item xs={3} className={classes.item}>
                <PublishedComponent
                  pubRef="medical.DiagnosisPicker"
                  name="mainDiagnosis"
                  label={formatMessage(intl, "claim", "mainDiagnosis")}
                  value={edited.icd}
                  reset={reset}
                  onChange={(v, s) => this.updateAttribute("icd", v)}
                  readOnly={ro}
                  required
                />
              </Grid>
            }
          />
        )}
        {!!this.allowReferHF && <ControlledField
          module="claim"
          id="Claim.referHealthFacility"
          field={
            <Grid item xs={3} className={classes.item}>
              <PublishedComponent
                pubRef="location.HealthFacilityReferPicker"
                label={formatMessage(intl, "claim", "ClaimMasterPanel.referHFLabel")}
                value={(edited.visitType === this.claimTypeReferSymbol ? edited.referFrom: edited.referTo) ?? this.EMPTY_STRING}
                reset={reset}
                readOnly={ro}
                required={edited.visitType === this.claimTypeReferSymbol ? true : false}
                filterOptions={(options)=>options?.filter((option)=>option.uuid !== userHealthFacilityFullPath?.uuid)}
                filterSelectedOptions={true}
                onChange={(d) => this.updateAttribute("referHF", d)}
              />
            </Grid>
          }
        />}
        <ControlledField
          module="claim"
          id="Claim.code"
          field={
            <Grid item xs={2} className={classes.item}>
              <ValidatedTextInput
                action={claimCodeValidationCheck}
                autoFocus={true}
                clearAction={claimCodeValidationClear}
                codeTakenLabel="claim.codeTaken"
                isValid={isCodeValid}
                isValidating={isCodeValidating}
                itemQueryIdentifier="claimCode"
                label="claim.code"
                module="claim"
                onChange={(code) => this.updateAttribute("code", code)}
                readOnly={readOnly || !!forReview || !!forFeedback}
                required={true}
                setValidAction={claimCodeSetValid}
                shouldValidate={this.shouldValidate}
                validationError={codeValidationError}
                value={!!this.state.data ? this.state.data.code : null}
                inputProps={{
                  "maxLength": this.codeMaxLength,
                }}
              />
            </Grid>
          }
        />
        <ControlledField
          module="claim"
          id="Claim.guarantee"
          field={
            <Grid item xs={!forReview && edited.status >= 4 && !forFeedback ? 1 : 2} className={classes.item}>
              <TextInput
                module="claim"
                label="guaranteeId"
                value={edited.guaranteeId}
                reset={reset}
                onChange={(v) => this.updateAttribute("guaranteeId", v)}
                readOnly={ro}
                inputProps={{
                  "maxLength": this.guaranteeIdMaxLength,
                }}
              />
            </Grid>
          }
        />
        {!!forFeedback && (
          <Fragment>
            <ControlledField
              module="claim"
              id="Claim.status"
              field={
                <Grid item xs={2} className={classes.item}>
                  <ClaimStatusPicker readOnly={true} value={edited.status} />
                </Grid>
              }
            />
            <ControlledField
              module="claim"
              id="Claim.feedbackStatus"
              field={
                <Grid item xs={2} className={classes.item}>
                  <FeedbackStatusPicker readOnly={true} value={edited.feedbackStatus} />
                </Grid>
              }
            />
            <ControlledField
              module="claim"
              id="Claim.reviewStatus"
              field={
                <Grid item xs={2} className={classes.item}>
                  <ReviewStatusPicker readOnly={true} value={edited.reviewStatus} />
                </Grid>
              }
            />
          </Fragment>
        )}
        {!forFeedback && (
          <ControlledField
            module="claim"
            id="Claim.claimed"
            field={
              <Grid item xs={forReview || edited.status >= 4 ? 1 : 2} className={classes.item}>
                <AmountInput value={edited.claimed} module="claim" label="claimed" readOnly={true} />
              </Grid>
            }
          />
        )}
        {(forReview || edited.status >= 4) && !forFeedback && (
          <Fragment>
            <ControlledField
              module="claim"
              id="Claim.approved"
              field={
                <Grid item xs={1} className={classes.item}>
                  <AmountInput value={edited.approved || null} module="claim" label="approved" readOnly={true} />
                </Grid>
              }
            />
            <ControlledField
              module="claim"
              id="Claim.valuated"
              field={
                <Grid item xs={1} className={classes.item}>
                  <AmountInput value={this.computePriceAdjusted()} module="claim" label="valuated" readOnly={true} />
                </Grid>
              }
            />
          </Fragment>
        )}
        {!forFeedback && (
          <Fragment>
            <ControlledField
              module="claim"
              id="Claim.secDiagnosis1"
              field={
                <Grid item xs={3} className={classes.item}>
                  <PublishedComponent
                    pubRef="medical.DiagnosisPicker"
                    name="secDiagnosis1"
                    label={formatMessage(intl, "claim", "secDiagnosis1")}
                    value={edited.icd1}
                    reset={reset}
                    onChange={(v, s) => this.updateAttribute("icd1", v)}
                    readOnly={ro}
                  />
                </Grid>
              }
            />
            <ControlledField
              module="claim"
              id="Claim.secDiagnosis2"
              field={
                <Grid item xs={3} className={classes.item}>
                  <PublishedComponent
                    pubRef="medical.DiagnosisPicker"
                    name="secDiagnosis2"
                    label={formatMessage(intl, "claim", "secDiagnosis2")}
                    value={edited.icd2}
                    reset={reset}
                    onChange={(v, s) => this.updateAttribute("icd2", v)}
                    readOnly={ro}
                  />
                </Grid>
              }
            />
            <ControlledField
              module="claim"
              id="Claim.secDiagnosis3"
              field={
                <Grid item xs={3} className={classes.item}>
                  <PublishedComponent
                    pubRef="medical.DiagnosisPicker"
                    name="secDiagnosis3"
                    label={formatMessage(intl, "claim", "secDiagnosis3")}
                    value={edited.icd3}
                    reset={reset}
                    onChange={(v, s) => this.updateAttribute("icd3", v)}
                    readOnly={ro}
                  />
                </Grid>
              }
            />
            <ControlledField
              module="claim"
              id="Claim.secDiagnosis4"
              field={
                <Grid item xs={3} className={classes.item}>
                  <PublishedComponent
                    pubRef="medical.DiagnosisPicker"
                    name="secDiagnosis4"
                    label={formatMessage(intl, "claim", "secDiagnosis4")}
                    value={edited.icd4}
                    reset={reset}
                    onChange={(v, s) => this.updateAttribute("icd4", v)}
                    readOnly={ro}
                  />
                </Grid>
              }
            />
          </Fragment>
        )}
        <ControlledField
          module="claim"
          id="Claim.admin"
          field={
            <Grid item xs={4} className={classes.item}>
              <ClaimAdminPicker
                value={edited.admin}
                onChange={(v, s) => this.updateAttribute("admin", v)}
                readOnly
                required
              />
            </Grid>
          }
        />
        {!forFeedback && (
          <Fragment>
            <ControlledField
              module="claim"
              id="Claim.explanation"
              field={
                <Grid item xs={this.showAdjustmentAtEnter ? 4 : 8} className={classes.item}>
                  <TextInput
                    module="claim"
                    label="explanation"
                    value={edited.explanation}
                    reset={reset}
                    onChange={(v) => this.updateAttribute("explanation", v)}
                    readOnly={ro}
                  />
                </Grid>
              }
            />
            {(!!forReview || this.showAdjustmentAtEnter || edited.status >= 4) && (
              <ControlledField
                module="claim"
                id="Claim.adjustment"
                field={
                  <Grid item xs={4} className={classes.item}>
                    <TextInput
                      module="claim"
                      label="adjustment"
                      value={edited.adjustment}
                      reset={reset}
                      onChange={(v) => this.updateAttribute("adjustment", v)}
                      readOnly={readOnly || edited.reviewStatus >= 8}
                    />
                  </Grid>
                }
              />
            )}
          </Fragment>
        )}
        <Contributions
          claim={edited}
          readOnly={ro}
          updateAttribute={this.updateAttribute}
          updateAttributes={this.updateAttributes}
          updateExts={this.updateExts}
          updateExt={this.updateExt}
          contributionKey={CLAIM_MASTER_PANEL_CONTRIBUTION_KEY}
        />
      </Grid>
    );
  }
}

const mapStateToProps = (state) => ({
  userHealthFacilityFullPath: !!state.loc ? state.loc.userHealthFacilityFullPath : null,
  fetchingClaimCodeCount: state.claim.fetchingClaimCodeCount,
  fetchedClaimCodeCount: state.claim.fetchedClaimCodeCount,
  claimCodeCount: state.claim.claimCodeCount,
  savedClaimCode: state.claim.claim?.code,
  errorClaimCodeCount: state.claim.errorClaimCodeCount,
  isCodeValid: state.claim.validationFields?.claimCode?.isValid,
  isCodeValidating: state.claim.validationFields?.claimCode?.isValidating,
  codeValidationError: state.claim.validationFields?.claimCode?.validationError,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({
    claimHealthFacilitySet,
    clearClaim,
  }, dispatch);
};

export default withModulesManager(
  injectIntl(connect(mapStateToProps, mapDispatchToProps)(withTheme(withStyles(styles)(ClaimMasterPanel)))),
);
