import React, { Fragment } from "react";
import { useTheme, styled } from "@mui/material/styles";
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
  GRID_RESPONSIVE_SMALL,
  GRID_RESPONSIVE_STANDARD,
  GRID_RESPONSIVE_LARGE,
  GRID_RESPONSIVE_HALF,
} from "@openimis/fe-core";
import { Grid, Checkbox, FormControlLabel } from "@mui/material";
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
import {
  CLAIM_DETAIL_REJECTED_STATUS,
  DEFAULT,
  DEFAULT_ADDITIONAL_DIAGNOSIS_NUMBER,
  IN_PATIENT_STRING,
  REFERRAL,
} from "../constants";

const CLAIM_MASTER_PANEL_CONTRIBUTION_KEY = "claim.MasterPanel";

const StyledItemGrid = styled(Grid)(({ theme }) => ({
  ...(theme?.paper?.item ?? {}),
}));

class ClaimMasterPanel extends FormPanel {
  state = {
    claimCode: null,
    claimCodeError: null,
  };

  constructor(props) {
    super(props);
    this.codeMaxLength = props.modulesManager.getConf("fe-claim", "claimForm.codeMaxLength", 8);
    this.guaranteeIdMaxLength = props.modulesManager.getConf("fe-claim", "claimForm.guaranteeIdMaxLength", 50);
    this.showAdjustmentAtEnter = props.modulesManager.getConf("fe-claim", "claimForm.showAdjustmentAtEnter", false);
    this.autoGenerateClaimCode = props.modulesManager.getConf(
      "fe-claim",
      "claimForm.autoGenerateClaimCode",
      DEFAULT.AUTOGENERATE_CLAIM_CODE,
    );
    this.insureePicker = props.modulesManager.getConf(
      "fe-claim",
      "claimForm.insureePicker",
      "insuree.InsureeChfIdPicker",
    );
    this.isReferHFMandatory = props.modulesManager.getConf("fe-claim", "claimForm.isReferHFMandatory", false);
    this.claimTypeReferSymbol = props.modulesManager.getConf("fe-claim", "claimForm.claimTypeReferSymbol", "R");
    this.numberOfAdditionalDiagnosis = props.modulesManager.getConf(
      "fe-claim",
      "claimForm.numberOfAdditionalDiagnosis",
      DEFAULT_ADDITIONAL_DIAGNOSIS_NUMBER,
    );
    this.isExplanationMandatoryForIPD = props.modulesManager.getConf(
      "fe-claim",
      "claimForm.isExplanationMandatoryForIPD",
      false,
    );
    this.isCareTypeMandatory = props.modulesManager.getConf("fe-claim", "claimForm.isCareTypeMandatory", false);
    this.isClaimedDateFixed = props.modulesManager.getConf("fe-claim", "claimForm.isClaimedDateFixed", false);
    this.EMPTY_STRING = "";
    this.showPreAuthorization = props.modulesManager.getConf("fe-claim", "showPreAuthorization", false);
    this.showPatientCondition = props.modulesManager.getConf("fe-claim", "showPatientCondition", false);
    this.fields = props.modulesManager.getConf("fe-claim", "fields", "{}");
    this.isVisitDateToMandatory = props.modulesManager.getConf("fe-claim", "claimForm.isVisitDateToMandatory", false);
    this.ComplexProductWithoutPriceImpact = props.modulesManager.getConf(
      "fe-claim",
      "claimForm.ComplexProductWithoutPriceImpact",
      true,
    );
    this.isProgramAvailable = props.modulesManager.getConf("fe-core", "isProgramAvailable", false);
  }

  shouldValidate = (inputValue) => {
    if (this.autoGenerateClaimCode) return false;

    const { savedClaimCode, edited } = this.props;
    if (edited.restore && !edited?.uuid) return true;

    const shouldValidate = inputValue !== savedClaimCode;
    return shouldValidate;
  };

  componentWillUnmount = () => {
    this.props?.clearClaim();
  };

  computePriceAdjusted() {
    const calculateTotal = (items) => {
      return items.reduce((total, currentItem) => {
        if (currentItem.status === CLAIM_DETAIL_REJECTED_STATUS) return 0;
        const price =
          parseFloat(currentItem.priceAdjusted) ||
          parseFloat(currentItem.priceApproved) ||
          parseFloat(currentItem.priceAsked) ||
          0;
        const priceTimesQty = price * (parseInt(currentItem?.qtyApproved) || parseInt(currentItem?.qtyProvided) || 0);
        return total + priceTimesQty;
      }, 0);
    };

    const totalServices = this.props.edited?.services ? calculateTotal(this.props.edited.services) : 0;
    const totalItems = this.props.edited?.items ? calculateTotal(this.props.edited.items) : 0;

    return totalServices + totalItems;
  }

  render() {
    const {
      intl,
      edited,
      reset,
      readOnly = false,
      forReview,
      forFeedback,
      isCodeValid,
      isCodeValidating,
      codeValidationError,
      userHealthFacilityFullPath,
      restore,
      isRestored,
      isDuplicate,
    } = this.props;
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
            <StyledItemGrid size={GRID_RESPONSIVE_STANDARD} className="item">
              <PublishedComponent
                pubRef="location.HealthFacilityPicker"
                value={edited.healthFacility}
                reset={reset}
                readOnly={true}
                required={true}
                inputProps={{"data-cy": "claim-hf-picker"}}
              />
            </StyledItemGrid>
          }
        />
        <ControlledField
          module="claim"
          id="Claim.insuree"
          field={
            <StyledItemGrid size={GRID_RESPONSIVE_STANDARD} className="item">
              <PublishedComponent
                pubRef={this.insureePicker}
                value={edited.insuree}
                reset={reset || isDuplicate}
                onChange={(v, s) => this.updateAttribute("insuree", v)}
                readOnly={ro}
                required={true}
                inputProps={{"data-cy": "claim-insuree-picker"}}
              />
            </StyledItemGrid>
          }
        />
        <ControlledField
          module="claim"
          id="Claim.visitDateFrom"
          field={
            <StyledItemGrid size={GRID_RESPONSIVE_STANDARD} className="item">
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
                slotProps={{
                  day: {
                    'data-cy': 'claim-vdate-from-picker',
                  }
                }}
              />
            </StyledItemGrid>
          }
        />
        <ControlledField
          module="claim"
          id="Claim.visitDateTo"
          field={
            <StyledItemGrid size={GRID_RESPONSIVE_STANDARD} className="item">
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
                required={this.isVisitDateToMandatory}
                slotProps={{
                  day: {
                    'data-cy': 'claim-vdate-to-picker',
                  }
                }}                
              />
            </StyledItemGrid>
          }
        />
        <ControlledField
          module="claim"
          id="Claim.claimedDate"
          field={
            <StyledItemGrid size={GRID_RESPONSIVE_STANDARD} className="item">
              <PublishedComponent
                pubRef="core.DatePicker"
                value={edited.dateClaimed ?? new Date()}
                module="claim"
                label="claimedDate"
                reset={reset}
                onChange={(d) => this.updateAttribute("dateClaimed", d)}
                readOnly={this.isClaimedDateFixed ?? ro}
                required={true}
                minDate={!!edited.dateTo ? edited.dateTo : edited.dateFrom}
                slotProps={{
                  day: {
                    'data-cy': 'claim-claimed-date-picker',
                  }
                }}
              />
            </StyledItemGrid>
          }
        />
        <ControlledField
          module="claim"
          id="Claim.visitType"
          field={
            <StyledItemGrid size={GRID_RESPONSIVE_STANDARD} className="item">
              <PublishedComponent
                pubRef="medical.VisitTypePicker"
                name="visitType"
                withNull={false}
                value={edited.visitType}
                reset={reset}
                onChange={(v, s) => this.updateAttribute("visitType", v)}
                readOnly={ro}
                required={true}
                inputProps={{ "data-cy": "claim-visit-type-picker" }}
              />
            </StyledItemGrid>
          }
        />
        <ControlledField
          module="claim"
          id="Claim.careType"
          field={
            <StyledItemGrid size={GRID_RESPONSIVE_STANDARD} className="item">
              <PublishedComponent
                pubRef="claim.CareTypePicker"
                name="careType"
                withNull={false}
                value={edited.careType}
                reset={reset}
                onChange={(value) => this.updateAttribute("careType", value)}
                readOnly={ro}
                required={this.isCareTypeMandatory}
                inputProps={{ "data-cy": "claim-care-type-picker" }}
              />
            </StyledItemGrid>
          }
        />
        {!forFeedback && (
          <ControlledField
            module="claim"
            id="Claim.mainDiagnosis"
            field={
              <StyledItemGrid size={GRID_RESPONSIVE_STANDARD} className="item">
                <PublishedComponent
                  pubRef="medical.DiagnosisPicker"
                  name="mainDiagnosis"
                  label={formatMessage(intl, "claim", "mainDiagnosis")}
                  value={edited.icd}
                  reset={reset}
                  onChange={(v, s) => this.updateAttribute("icd", v)}
                  readOnly={ro}
                  required
                  dataCy="claim-main-diagnosis-picker"
                />
              </StyledItemGrid>
            }
          />
        )}
        {(!!edited.visitType && edited.visitType == REFERRAL) ||
        (!!edited.patientCondition && edited.patientCondition == REFERRAL) ? (
          <ControlledField
            module="claim"
            id="Claim.referHealthFacility"
            field={
              <StyledItemGrid size={GRID_RESPONSIVE_STANDARD} className="item">
                <PublishedComponent
                  pubRef="location.HealthFacilityReferPicker"
                  label={formatMessage(intl, "claim", "ClaimMasterPanel.referHFLabel")}
                  value={
                    (edited.visitType === this.claimTypeReferSymbol
                      ? !!edited.referFrom
                        ? edited.referFrom
                        : edited.referHF
                      : edited.referTo) ?? this.EMPTY_STRING
                  }
                  reset={reset}
                  readOnly={ro}
                  required={this.isReferHFMandatory && edited.visitType === this.claimTypeReferSymbol}
                  filterOptions={(options) =>
                    options?.filter((option) => option.uuid !== userHealthFacilityFullPath?.uuid)
                  }
                  filterSelectedOptions={true}
                  onChange={(d) => this.updateAttribute("referHF", d)}
                  dataCy={"claim-hf-referer-picker"}
                />
              </StyledItemGrid>
            }
          />
        ) : null}

        <ControlledField
          module="claim"
          id="Claim.code"
          field={
            <StyledItemGrid size={GRID_RESPONSIVE_STANDARD} className="item">
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
                readOnly={readOnly || !!forReview || !!forFeedback || this.autoGenerateClaimCode}
                required={!this.autoGenerateClaimCode}
                setValidAction={claimCodeSetValid}
                shouldValidate={this.shouldValidate}
                validationError={codeValidationError}
                value={
                  this.state.data?.code
                    ? this.state.data.code
                    : this.autoGenerateClaimCode && !isRestored
                    ? formatMessage(intl, "claim", "ClaimMasterPanel.autogenerate")
                    : ""
                }
                inputProps={{
                  "maxLength": this.codeMaxLength,
                  "data-cy": "claim-code-validated-input"
                }}
              />
            </StyledItemGrid>
          }
        />
        { this.isProgramAvailable && (
          <ControlledField
          module="claim"
          id="Claim.program"
          field={
            <Grid item xs={3} className={classes.item}>
              <PublishedComponent
                pubRef="claim.ClaimProgramPicker"
                name="program"
                label={formatMessage(intl, "claim", "programPicker.label")}
                value={edited.program}
                reset={reset}
                readOnly={!!edited && edited[`uuid`] ? true : ro}
                onChange={(v) => this.updateAttribute("program", v)}
              />
            </Grid>
          }
        />
        )}
        {this.fields.guaranteeNo !== "N" && (
          <ControlledField
            module="claim"
            id="Claim.guarantee"
            field={
              <StyledItemGrid size={GRID_RESPONSIVE_STANDARD} className="item">
                <TextInput
                  module="claim"
                  label="guaranteeId"
                  value={edited.guaranteeId}
                  reset={reset}
                  onChange={(v) => this.updateAttribute("guaranteeId", v)}
                  readOnly={ro}
                  inputProps={{
                    "maxLength": this.guaranteeIdMaxLength,
                    "data-cy": "claim-guarantee-id"
                  }}
                  required={this.fields.guaranteeNo === "M"}
                />
              </StyledItemGrid>
            }
          />
        )}
        {!!forFeedback && (
          <Fragment>
            <ControlledField
              module="claim"
              id="Claim.status"
              field={
                <StyledItemGrid size={GRID_RESPONSIVE_STANDARD} className="item">
                  <ClaimStatusPicker readOnly={true} value={edited.status} />
                </StyledItemGrid>
              }
            />
            <ControlledField
              module="claim"
              id="Claim.feedbackStatus"
              field={
                <StyledItemGrid size={GRID_RESPONSIVE_STANDARD} className="item">
                  <FeedbackStatusPicker readOnly={true} value={edited.feedbackStatus} />
                </StyledItemGrid>
              }
            />
            <ControlledField
              module="claim"
              id="Claim.reviewStatus"
              field={
                <StyledItemGrid size={GRID_RESPONSIVE_STANDARD} className="item">
                  <ReviewStatusPicker readOnly={true} value={edited.reviewStatus} />
                </StyledItemGrid>
              }
            />
          </Fragment>
        )}
        {!forFeedback && (
          <ControlledField
            module="claim"
            id="Claim.claimed"
            field={
              <StyledItemGrid size={GRID_RESPONSIVE_STANDARD} className="item">
                <AmountInput value={edited.claimed} module="claim" label="claimed" readOnly={true} />
              </StyledItemGrid>
            }
          />
        )}
        {(forReview || edited.status >= 4) && !forFeedback && (
          <Fragment>
            <ControlledField
              module="claim"
              id="Claim.approved"
              field={
                <StyledItemGrid size={GRID_RESPONSIVE_SMALL} className="item">
                  <AmountInput value={edited.approved || null} module="claim" label="approved" readOnly={true} />
                </StyledItemGrid>
              }
            />
            <ControlledField
              module="claim"
              id="Claim.valuated"
              field={
                <StyledItemGrid size={GRID_RESPONSIVE_SMALL} className="item">
                  <AmountInput value={this.computePriceAdjusted()} module="claim" label="valuated" readOnly={true} />
                </StyledItemGrid>
              }
            />
          </Fragment>
        )}

        {!forFeedback && (
          <Fragment>
            {Array.from({ length: this.numberOfAdditionalDiagnosis }, (_, diagnosisIndex) => (
              <ControlledField
                key={`Claim.secDiagnosis${diagnosisIndex + 1}`}
                module="claim"
                id={`Claim.secDiagnosis${diagnosisIndex + 1}`}
                field={
                  <StyledItemGrid size={GRID_RESPONSIVE_STANDARD} className="item">
                    <PublishedComponent
                      pubRef="medical.DiagnosisPicker"
                      name={`secDiagnosis${diagnosisIndex + 1}`}
                      label={formatMessage(intl, "claim", `secDiagnosis${diagnosisIndex + 1}`)}
                      value={edited[`icd${diagnosisIndex + 1}`]}
                      reset={reset}
                      onChange={(value) => this.updateAttribute(`icd${diagnosisIndex + 1}`, value)}
                      readOnly={ro}
                    />
                  </StyledItemGrid>
                }
              />
            ))}
          </Fragment>
        )}
        <ControlledField
          module="claim"
          id="Claim.admin"
          field={
            <StyledItemGrid size={GRID_RESPONSIVE_STANDARD} className="item">
              <ClaimAdminPicker
                value={edited.admin}
                onChange={(v, s) => this.updateAttribute("admin", v)}
                readOnly
                required
              />
            </StyledItemGrid>
          }
        />
        {!forFeedback && (
          <Fragment>
            <ControlledField
              module="claim"
              id="Claim.explanation"
              field={
                <StyledItemGrid size={GRID_RESPONSIVE_HALF} className="item">
                  <TextInput
                    module="claim"
                    label="explanation"
                    value={edited.explanation}
                    reset={reset}
                    onChange={(v) => this.updateAttribute("explanation", v)}
                    readOnly={ro}
                    required={this.isExplanationMandatoryForIPD && edited.careType === IN_PATIENT_STRING ? true : false}
                    inputProps={{"data-cy": "claim-explanation-input"}}
                  />
                </StyledItemGrid>
              }
            />
            {(!!forReview || this.showAdjustmentAtEnter || edited.status >= 4) && (
              <ControlledField
                module="claim"
                id="Claim.adjustment"
                field={
                  <StyledItemGrid size={GRID_RESPONSIVE_STANDARD} className="item">
                    <TextInput
                      module="claim"
                      label="adjustment"
                      value={edited.adjustment}
                      reset={reset}
                      onChange={(v) => this.updateAttribute("adjustment", v)}
                      readOnly={readOnly || edited.reviewStatus >= 8}
                      inputProps={{"data-cy": "claim-adjustement-input"}}
                    />
                  </StyledItemGrid>
                }
              />
            )}
          </Fragment>
        )}
        {this.showPatientCondition && (
          <StyledItemGrid size={GRID_RESPONSIVE_STANDARD} className="item">
            <PublishedComponent
              pubRef="claim.PatientConditionPicker"
              name="patientCondition"
              value={edited.patientCondition}
              required
              onChange={(v) => this.updateAttribute("patientCondition", v)}
              inputProps={{"data-cy": "claim-patient-condition-picker"}}
            />
          </StyledItemGrid>
        )}
        {(edited.visitType == "R" || edited.patientCondition == "R") && (
          <StyledItemGrid size={GRID_RESPONSIVE_STANDARD} className="item">
            <TextInput
              id="claim.referralCode"
              module="insuree"
              label="claim.referralCode"
              value={edited.referralCode}
              required={edited.visitType == "R" || edited.patientCondition == "R"}
              onChange={(v) => this.updateAttribute("referralCode", v)}
            />
          </StyledItemGrid>
        )}
        {this.showPreAuthorization && (
          <StyledItemGrid size={GRID_RESPONSIVE_STANDARD} className="item">
            <FormControlLabel
              control={
                <Checkbox
                  id="Claim.preAuthorization"
                  color="primary"
                  checked={edited?.preAuthorization}
                  onChange={(e) => this.updateAttribute("preAuthorization", e.target.checked)}
                />
              }
              label={formatMessage(intl, "claim", "pre-authorization")}
            />
          </StyledItemGrid>
        )}
        <Contributions
          claim={edited}
          readOnly={ro}
          insuree={edited.insuree}
          dateTo={edited.dateTo}
          dateFrom={edited.dateFrom}
          updateAttribute={this.updateAttribute}
          updateAttributes={this.updateAttributes}
          updateExts={this.updateExts}
          updateExt={this.updateExt}
          restore={restore}
          isRestored={isRestored}
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
  return bindActionCreators(
    {
      claimHealthFacilitySet,
      clearClaim,
    },
    dispatch,
  );
};

export { CLAIM_MASTER_PANEL_CONTRIBUTION_KEY };
export { ClaimMasterPanel };
export default withModulesManager(injectIntl(connect(mapStateToProps, mapDispatchToProps)(ClaimMasterPanel)));
