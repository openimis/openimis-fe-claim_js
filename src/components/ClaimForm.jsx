import React, { Component, Fragment } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import moment from "moment";
import { Fab, Badge, Button } from "@mui/material";
import { useTheme, styled } from "@mui/material/styles";
import CheckIcon from "@mui/icons-material/Check";
import ReplayIcon from "@mui/icons-material/Replay";
import PrintIcon from "@mui/icons-material/ListAlt";
import AttachIcon from "@mui/icons-material/AttachFile";
import RestorePageIcon from "@mui/icons-material/RestorePage";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import CachedIcon from "@mui/icons-material/Cached";
import QrCodeIcon from "@mui/icons-material/QrCode";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import {
  Contributions,
  Form,
  formatMessage,
  formatMessageWithValues,
  Helmet,
  journalize,
  ProgressOrError,
  PublishedComponent,
  toISODate,
  withHistory,
  withModulesManager,
  fetchMutation,
  parseData,
  coreAlert,
} from "@openimis/fe-core";
import { claimHealthFacilitySet, fetchClaim, generate, print, fetchClaimFacialAudits } from "../actions";
import {
  RIGHT_ADD,
  RIGHT_PRINT,
  CARE_TYPE_STATUS,
  IN_PATIENT_STRING,
  RIGHT_RESTORE,
  STATUS_REJECTED,
  STORAGE_KEY_ADMIN,
  STORAGE_KEY_CLAIM_HEALTH_FACILITY,
  DEFAULT,
  RIGHT_CLAIMREVIEW,
  REFERRAL,
} from "../constants";
import ClaimMasterPanel from "./ClaimMasterPanel";
import ClaimChildPanel from "./ClaimChildPanel";
import ClaimFeedbackPanel from "./ClaimFeedbackPanel";
import BiometricQRCodeDialog from "./BiometricQRCodeDialog";
import BiometricVerificationDetailsDialog from "./BiometricVerificationDetailsDialog";

const CLAIM_FORM_CONTRIBUTION_KEY = "claim.ClaimForm";

const StyledDiv = styled("div")(({ theme }) => ({
  ...theme?.page?.locked ?? {},
}));

class ClaimServicesPanel extends Component {
  render() {
    return <ClaimChildPanel {...this.props} type="service" picker="medical.ServicePicker" />;
  }
}

class ClaimItemsPanel extends Component {
  render() {
    return <ClaimChildPanel {...this.props} type="item" picker="medical.ItemPicker" />;
  }
}

class ClaimForm extends Component {
  state = {
    lockNew: false,
    reset: 0,
    claim_uuid: null,
    claim: this._newClaim(),
    newClaim: true,
    printParam: null,
    attachmentsClaim: null,
    forcedDirty: false,
    isDuplicate: false,
    isRestored: false,
    isSaved: false,
    qrCodeDialogOpen: false,
    verificationDetailsDialogOpen: false,
    biometricVerificationStatus: null, // null | 'pass' | 'fail'
  };

  constructor(props) {
    super(props);
    this.explanationRequiredIfQuantityAboveThreshold = props.modulesManager.getConf(
      "fe-claim",
      "explanationRequiredIfQuantityAboveThreshold",
      DEFAULT.EXPLANATION_REQUIRED_IF_ABOVE_THRESHOLD,
    );
    this.quantityExplanationThreshold = props.modulesManager.getConf(
      "fe-claim",
      "quantityExplanationThreshold",
      DEFAULT.QUANTITY_EXPLANATION_THRESHOLD,
    );
    this.canSaveClaimWithoutServiceNorItem = props.modulesManager.getConf(
      "fe-claim",
      "canSaveClaimWithoutServiceNorItem",
      true,
    );
    this.claimAttachments = props.modulesManager.getConf("fe-claim", "claimAttachments", true);
    this.claimTypeReferSymbol = props.modulesManager.getConf("fe-claim", "claimForm.claimTypeReferSymbol", "R");
    this.autoGenerateClaimCode = props.modulesManager.getConf(
      "fe-claim",
      "claimForm.autoGenerateClaimCode",
      DEFAULT.AUTOGENERATE_CLAIM_CODE,
    );
    this.isExplanationMandatoryForIPD = props.modulesManager.getConf(
      "fe-claim",
      "claimForm.isExplanationMandatoryForIPD",
      false,
    );
    this.isCareTypeMandatory = props.modulesManager.getConf("fe-claim", "claimForm.isCareTypeMandatory", false);
    this.quantityMaxValue = props.modulesManager.getConf(
      "fe-claim",
      "claimForm.quantityMaxValue",
      DEFAULT.QUANTITY_MAX_VALUE,
    );
    this.isReferHFMandatory = props.modulesManager.getConf("fe-claim", "claimForm.isReferHFMandatory", false);
    this.isVisitDateToMandatory = props.modulesManager.getConf("fe-claim", "claimForm.isVisitDateToMandatory", false);
    this.attachmentRequiredForReferral = props.modulesManager.getConf(
      "fe-claim",
      "attachmentRequiredForReferral",
      false,
    );
    this.showPatientCondition = props.modulesManager.getConf("fe-claim", "showPatientCondition", false);
  }

  _newClaim() {
    let claim = {};
    claim.healthFacility =
      this?.state?.claim?.healthFacility ??
      this.props.claimHealthFacility ??
      JSON.parse(localStorage.getItem(STORAGE_KEY_CLAIM_HEALTH_FACILITY));
    claim.admin =
      this?.state?.claim?.admin ?? this.props.claimAdmin ?? JSON.parse(localStorage.getItem(STORAGE_KEY_ADMIN));
    claim.status = this.props.modulesManager.getConf("fe-claim", "newClaim.status", 2);
    claim.dateClaimed = toISODate(moment().toDate());
    claim.dateFrom = toISODate(moment().toDate());
    claim.visitType = this.props.modulesManager.getConf("fe-claim", "newClaim.visitType", "O");
    claim.code = "";
    claim.preAuthorization = false;
    claim.jsonExt = {};
    return claim;
  }

  removeItemOrServiceFields(itemsOrServices) {
    if (!itemsOrServices) return null;
    return itemsOrServices.map((itemOrService) => {
      Object.keys(itemOrService).forEach((key) => {
        if (!["item", "service", "priceAsked", "qtyProvided"].includes(key)) {
          delete itemOrService[key];
        }
      });
      return itemOrService;
    });
  }

  _restoreClaim(claim) {
    const status = this.props.modulesManager.getConf("fe-claim", "newClaim.status", 2);
    const items = this.removeItemOrServiceFields(claim?.items);
    const services = this.removeItemOrServiceFields(claim?.services);
    return {
      ...claim,
      uuid: null,
      status: status,
      code: "",
      restore: { uuid: claim.uuid, code: claim.code },
      items: items,
      services: services,
      reviewStatus: null,
      feedbackStatus: null,
      adjustment: null,
      valuated: null,
      referFrom: null,
      referTo: null,
    };
  }

  _duplicateClaim(claim) {
    const restoredClaim = this._restoreClaim(claim);
    return { ...restoredClaim, insuree: null, code: "", restore: null };
  }

  componentDidMount() {
    if (!!this.props.claimHealthFacility) {
      this.props.claimHealthFacilitySet(this.props.claimHealthFacility);
      localStorage.setItem(STORAGE_KEY_CLAIM_HEALTH_FACILITY, JSON.stringify(this.props.claimHealthFacility));
    }
    if (this.props.claimAdmin) {
      localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(this.props.claimAdmin));
    }
    if (this.props.claim_uuid) {
      this.setState(
        (state, props) => ({ claim_uuid: props.claim_uuid }),
        (e) => this.props.fetchClaim(this.props.modulesManager, this.props.claim_uuid, this.props.forFeedback),
      );
    }
  }

  componentWillUnmount() {
    localStorage.removeItem(STORAGE_KEY_CLAIM_HEALTH_FACILITY);
    localStorage.removeItem(STORAGE_KEY_ADMIN);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.fetchedClaim !== this.props.fetchedClaim && !!this.props.fetchedClaim) {
      var claim = this.props.claim;
      claim.jsonExt = !!claim.jsonExt ? JSON.parse(claim.jsonExt) : {};
      this.setState(
        { claim, claim_uuid: claim.uuid, lockNew: false, newClaim: false },
        this.props.claimHealthFacilitySet(this.props.claim.healthFacility),
      );
      // Fetch facial audits when claim is loaded
      if (claim.uuid) {
        this.props.fetchClaimFacialAudits(claim.uuid);
      }
    } else if (prevProps.claim_uuid && !this.props.claim_uuid && this.state.isDuplicate) {
      this.setState({
        claim: this._duplicateClaim(this.state.claim),
        newClaim: true,
        lockNew: false,
        claim_uuid: null,
      });
    } else if (prevProps.claim_uuid && !this.props.claim_uuid && this.state.isRestored) {
      this.setState({ claim: this._restoreClaim(this.state.claim), newClaim: true, lockNew: false, claim_uuid: null });
    } else if (prevProps.claim_uuid && !this.props.claim_uuid) {
      this.setState({ claim: this._newClaim(), newClaim: true, lockNew: false, claim_uuid: null });
    } else if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      this.setState({ reset: this.state.reset + 1 });
    } else if (!prevProps.generating && !!this.props.generating) {
      this.props.generate(this.state.printParam);
    }

    // Calculate biometric verification status when facial audits are loaded
    if (prevProps.facialAudits !== this.props.facialAudits) {
      this.calculateBiometricStatus();
    }
  }

  calculateBiometricStatus = () => {
    const { facialAudits } = this.props;
    if (!facialAudits || facialAudits.length === 0) {
      this.setState({ biometricVerificationStatus: null });
      return;
    }

    // Calculate success rate: % of verifications that passed
    const passedCount = facialAudits.filter(audit => audit.isVerified).length;
    const successRate = (passedCount / facialAudits.length) * 100;

    // Determine pass/fail status based on success rate
    // Pass if >= 70% of verifications succeeded
    const status = successRate >= 70 ? 'pass' : 'fail';
    this.setState({ biometricVerificationStatus: status });
  };

  _add = () => {
    this.setState(
      (state) => ({
        claim: this._newClaim(),
        newClaim: true,
        lockNew: false,
        reset: state.reset + 1,
      }),
      (e) => {
        this.props.add();
        this.forceUpdate();
      },
    );
  };

  canSaveDetail = (detail, type, forReview) => {
    if (!detail[type]) return false;

    const qtyProvided = Number(detail.qtyProvided);
    if (isNaN(qtyProvided) || qtyProvided <= 0) return false;

    const priceAsked = Number(detail.priceAsked);
    if (isNaN(priceAsked) || priceAsked < 0) return false;

    if (
      this.explanationRequiredIfQuantityAboveThreshold &&
      type === "service" &&
      !detail.explanation &&
      qtyProvided > this.quantityExplanationThreshold
    ) {
      return false;
    }

    if (forReview && qtyProvided < detail.qtyApproved) return false;

    return true;
  };

  canSave = (forFeedback, forReview) => {
    if (!this.autoGenerateClaimCode && !this.state.claim.code) return false;
    if (this.state.lockNew) return false;
    if (!this.props.isClaimCodeValid) return false;
    if (!!this.state.claim.codeError) return false;
    if (!this.state.claim.healthFacility) return false;
    if (
      !!this.isReferHFMandatory &&
      this.state.claim.visitType === this.claimTypeReferSymbol &&
      !this.state.claim.referHF
    )
      return false;
    if(!!this.showPatientCondition && this.showPatientCondition == true && !this.state.claim.patientCondition) return false
    if (!this.state.claim.insuree) return false;
    if (!this.state.claim.admin) return false;
    if (!this.state.claim.dateClaimed) return false;
    if (!this.state.claim.dateFrom) return false;
    if (this.isVisitDateToMandatory){
      if( !this.state.claim.dateTo) return false;
    }
    if (this.state.claim.dateClaimed < this.state.claim.dateFrom) return false;
    if (!!this.state.claim.dateTo && this.state.claim.dateFrom > this.state.claim.dateTo) return false;
    if (!this.state.claim.icd) return false;
    if (
      (this.state.claim.visitType == REFERRAL || this.state.claim.patientCondition == REFERRAL) &&
      (!this.state.claim.referralCode || this.state.claim.referralCode == null || this.state.claim.referralCode == undefined)
    ){
      return false
    } 
    if (this.state.claim.services !== undefined) {
      if (this.state.claim.services.length && this.state.claim.services.filter((s) => !this.canSaveDetail(s, "service", forReview)).length - 1) {
        return false;
      }
    }

    if (this.isCareTypeMandatory){
      if (!CARE_TYPE_STATUS.includes(this.state.claim.careType)) return false;
    }
    if (this.isExplanationMandatoryForIPD) {
      if (this.state.claim.careType === IN_PATIENT_STRING && !this.state.claim.explanation) return false;
    }
    if (!forFeedback) {
      if (!this.state.claim.items && !this.state.claim.services) {
        return !!this.canSaveClaimWithoutServiceNorItem;
      }
      //if there are items or services, they have to be complete
      let items = [];
      if (!!this.state.claim.items) {
        items = [...this.state.claim.items];

        let isUnderMaximumAmount = true;

        items.forEach((item) => {
          if (parseFloat(item.qtyProvided) > parseFloat(item?.item?.maximumAmount ?? this.quantityMaxValue)) {
            isUnderMaximumAmount = false;
          }
        });

        if (!isUnderMaximumAmount) {
          return false;
        }

        if (!this.props.forReview) items.pop();
        if (items.length && items.filter((i) => !this.canSaveDetail(i, "item", forReview)).length) {
          return false;
        }
      }
      let services = [];
      if (!!this.state.claim.services) {
        services = [...this.state.claim.services];

        let isUnderMaximumAmount = true;

        services.forEach((item) => {
          if (parseFloat(item.qtyProvided) > parseFloat(item?.service?.maximumAmount ?? this.quantityMaxValue)) {
            isUnderMaximumAmount = false;
          }
        });

        if (!isUnderMaximumAmount) {
          return false;
        }

        if (!this.props.forReview) services.pop();
        if (services.length && services.filter((s) => !this.canSaveDetail(s, "service", forReview)).length) {
          return false;
        }
      }
      if (!items.length && !services.length) return !!this.canSaveClaimWithoutServiceNorItem;
    }
    return true;
  };

  reload = () => {
    const { fetchClaim, modulesManager, forFeedback } = this.props;
    const { claim_uuid: claimUuid } = this.state;

    fetchClaim(modulesManager, claimUuid, forFeedback);
  };

  onEditedChanged = (claim) => {
    this.setState({ claim, newClaim: false });
  };

  _save = (claim) => {
    if (this.attachmentRequiredForReferral && (claim.attachmentsCount == 0 || claim.attachmentsCount == undefined )&&(claim.visitType == REFERRAL || claim.patientCondition == REFERRAL)) {
      this.props.coreAlert(
        formatMessage(this.props.intl, "claim", "claim.missingAttachment"),
        formatMessage(this.props.intl, "claim", "claim.attachFile"),
      );
      this.setState({ reset: this.state.reset + 1 });
      return;
    }
    this.setState({ lockNew: true, isSaved: true }, () => {
      this.props
        .save(claim)
        .then(() => {
          if (this.autoGenerateClaimCode && !this.state.isRestored) {
            const {
              mutation: { clientMutationId },
              fetchMutation,
            } = this.props;

            if (clientMutationId) {
              fetchMutation(clientMutationId)
                .then((response) => {
                  const { autogeneratedCode } = parseData(response.payload.data.mutationLogs)[0];

                  this.setState((prevState) => ({
                    claim: { ...prevState.claim, code: autogeneratedCode },
                  }), () => {
                    // Open QR Code dialog after successful save with autogenerated code
                    if (this.state.claim?.insuree?.uuid && autogeneratedCode) {
                      this.handleOpenQRCodeDialog();
                    }
                  });
                })
                .catch((error) => {
                  console.error("[ERROR]: Error while fetching autogenerated code.", error);
                });
            }
          } else {
            // Open QR Code dialog after successful save when code is not autogenerated
            if (this.state.claim?.insuree?.uuid && this.state.claim?.code) {
              this.handleOpenQRCodeDialog();
            }
          }
        })
        .catch((error) => {
          console.error("[ERROR]: Failed to save claim", error);
        });
    });
  };

  _saveReview = (claim) => {
    this.setState(
      { lockNew: true, isSaved: true },
      () => this.props.save(claim),
    );
  }

  print = (claimUuid) => {
    this.setState({ printParam: claimUuid }, (e) => this.props.print());
  };

  handleOpenQRCodeDialog = () => {
    this.setState({ qrCodeDialogOpen: true });
  };

  handleCloseQRCodeDialog = () => {
    this.setState({ qrCodeDialogOpen: false });
  };

  handleOpenVerificationDetailsDialog = () => {
    this.setState({ verificationDetailsDialogOpen: true });
  };

  handleCloseVerificationDetailsDialog = () => {
    this.setState({ verificationDetailsDialogOpen: false });
  };

  _deliverReview = (claim) => {
    this.setState({ lockNew: !claim.uuid }, (e) => this.props.deliverReview(claim));
  };

  duplicate = () => {
    const routeRef = this.props.modulesManager.getRef("claim.route.claimEdit");
    this.props.history.replace(`/${routeRef}`);
    this.setState({ isDuplicate: true });
  };

  restore = () => {
    const routeRef = this.props.modulesManager.getRef("claim.route.claimEdit");
    this.props.history.replace(`/${routeRef}`);
    this.setState({ isRestored: true });
  };

  resetForm = () =>
    this.setState(() => ({
      lockNew: false,
      reset: 0,
      claim_uuid: null,
      claim: this._newClaim(),
      newClaim: true,
      printParam: null,
      attachmentsClaim: null,
      forcedDirty: false,
      isDuplicate: false,
      isRestored: false,
      isSaved: false,
    }));

  render() {
    const {
      rights,
      fetchingClaim,
      fetchedClaim,
      errorClaim,
      add,
      save,
      back,
      forReview = false,
      forFeedback = false,
      isHealthFacilityPage = false,
    } = this.props;
    const { claim, claim_uuid, lockNew, isSaved } = this.state;

    let readOnly =
      lockNew ||
      isSaved ||
      (!forReview && !forFeedback && claim.status !== 2) ||
      (forReview && (claim.reviewStatus >= 8 || claim.status !== 4)) ||
      (forFeedback && claim.status !== 4) ||
      !rights.filter((r) => r === RIGHT_CLAIMREVIEW).length;

    var actions = [];
    if (!!claim_uuid) {
      actions.push({
        doIt: (e) => this.reload(),
        icon: <ReplayIcon />,
        onlyIfDirty: !readOnly,
      });
    }
    if (!!claim_uuid && rights.includes(RIGHT_PRINT)) {
      actions.push({
        doIt: (e) => this.print(claim_uuid),
        icon: <Button startIcon={<PrintIcon />}>
        {formatMessage(this.props.intl, "claim", "claim.print.buttonText")}
        </Button>,
        onlyIfNotDirty: true,
      });
    }
    if (!!this.claimAttachments && (!readOnly || claim.attachmentsCount > 0)) {
      actions.push({
        doIt: (e) => this.setState({ attachmentsClaim: claim }),
        icon: (
          <Button
          startIcon={<Badge badgeContent={this.state.claim?.attachmentsCount ?? 0} color="primary">
          <AttachIcon />
          </Badge>}>
          {formatMessage(this.props.intl, "claim", "claimAttachments.buttonText")}          </Button>
        ),
      });
    }
    // Only show QR code button if claim is already saved (has UUID)
    // This ensures facial audits can be linked to an existing claim in the database
    if (!!claim.uuid && !!claim.insuree && !!claim.insuree.uuid && !!claim.code) {
      actions.push({
        doIt: (e) => this.handleOpenQRCodeDialog(),
        icon: (
          <Button
            startIcon={<QrCodeIcon sx={{ fontSize: 24 }} />}
            variant="outlined"
            color="primary"
            disableRipple
            sx={{
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'rgba(0, 98, 115, 0.08)',
              },
            }}
          >
            {formatMessage(this.props.intl, "claim", "biometricQRCode.buttonText")}
          </Button>
        ),
      });
    }

    // Show biometric verification details button if claim exists
    if (!!claim.uuid) {
      const { biometricVerificationStatus } = this.state;

      // Determine button style based on verification status
      let buttonColor = "secondary";
      let buttonVariant = "outlined";
      let hoverColor = 'rgba(156, 39, 176, 0.08)';
      let backgroundColor = 'transparent';

      if (biometricVerificationStatus === 'pass') {
        buttonColor = "success";
        buttonVariant = "contained";
        hoverColor = 'rgba(76, 175, 80, 0.8)';
        backgroundColor = '#4caf50'; // Green
      } else if (biometricVerificationStatus === 'fail') {
        buttonColor = "error";
        buttonVariant = "contained";
        hoverColor = 'rgba(244, 67, 54, 0.8)';
        backgroundColor = '#f44336'; // Red
      }

      actions.push({
        doIt: (e) => this.handleOpenVerificationDetailsDialog(),
        icon: (
          <Button
            startIcon={<VerifiedUserIcon sx={{ fontSize: 24 }} />}
            variant={buttonVariant}
            color={buttonColor}
            disableRipple
            sx={{
              borderRadius: 1,
              backgroundColor: buttonVariant === 'contained' ? backgroundColor : 'transparent',
              '&:hover': {
                backgroundColor: hoverColor,
              },
            }}
          >
            {formatMessage(this.props.intl, "claim", "biometricVerification.buttonText")}
          </Button>
        ),
      });
    }

    const tooltips = [
      {
        condition:
          rights.includes(RIGHT_RESTORE) &&
          claim_uuid &&
          isHealthFacilityPage &&
          this.state.claim?.status === STATUS_REJECTED,
        content: (
          <span>
            <Fab color="primary" onClick={(e) => this.restore()}>
              <RestorePageIcon />
              
            </Fab>
          </span>
        ),
        tooltip: formatMessage(this.props.intl, "claim", "claim.edit.restore"),
      },
      {
        condition: isSaved,
        content: (
          <span>
            <Fab color="primary" onClick={(e) => this.resetForm()}>
              <CachedIcon />
            </Fab>
          </span>
        ),
        tooltip: formatMessage(this.props.intl, "claim", "claim.edit.renew"),
      },
      {
        condition: claim_uuid && isHealthFacilityPage,
        content: (
          <span>
            <Fab color="primary" disabled={!this.canSave(forFeedback, forReview)} onClick={(e) => this.duplicate()}>
              <FileCopyIcon />
            </Fab>
          </span>
        ),
        tooltip: formatMessage(this.props.intl, "claim", "claim.edit.duplicate"),
      },
    ];

    const editingProps = {
      isDuplicate: this.state.isDuplicate,
      isRestored: this.state.isRestored || this.state.claim?.restore,
      restore: this.state.claim?.restore,
      edited_id: claim_uuid,
      edited: this.state.claim,
      reset: this.state.reset,
      back: back,
      forcedDirty: this.state.forcedDirty,
      add: !!add && !this.state.newClaim ? this._add : null,
      save: !!save && this.state.claim.status !== STATUS_REJECTED && !readOnly ? forReview ? this._saveReview : this._save : null,
      fab: forReview && this.state.claim.reviewStatus < 8 && <CheckIcon />,
      fabAction: this._deliverReview,
      fabTooltip: formatMessage(this.props.intl, "claim", "claim.Review.deliverReview.fab.tooltip"),
      canSave: (e) => this.canSave(forFeedback, forReview),
      reload: (claim_uuid || readOnly) && this.reload,
      actions: actions,
      readOnly: readOnly,
      forReview: forReview,
      forFeedback: forFeedback,
      onEditedChanged: this.onEditedChanged,
    };
    return (
      <StyledDiv className={readOnly ? "lockedPage" : null}>
        <Helmet
          title={formatMessageWithValues(this.props.intl, "claim", "claim.edit.page.title", {
            code: this.state.claim?.code,
          })}
        />
        <ProgressOrError progress={fetchingClaim} error={errorClaim} />
        {(!!fetchedClaim || !claim_uuid) && (
          <Fragment>
            <PublishedComponent
              pubRef="claim.AttachmentsDialog"
              readOnly={!rights.includes(RIGHT_ADD) || readOnly}
              claim={this.state.attachmentsClaim}
              close={(e) => this.setState({ attachmentsClaim: null })}
              onUpdated={() => this.setState({ forcedDirty: true })}
            />
            <BiometricQRCodeDialog
              open={this.state.qrCodeDialogOpen}
              onClose={this.handleCloseQRCodeDialog}
              insuree={this.state.claim?.insuree}
              claimCode={this.state.claim?.code}
              intl={this.props.intl}
            />
            <BiometricVerificationDetailsDialog
              open={this.state.verificationDetailsDialogOpen}
              onClose={this.handleCloseVerificationDetailsDialog}
              claimUuid={this.state.claim?.uuid}
              intl={this.props.intl}
            />
            <Form
              module="claim"
              title="edit.title"
              titleParams={{ code: this.state.claim.code }}
              HeadPanel={ClaimMasterPanel}
              Panels={!!forFeedback ? [ClaimFeedbackPanel] : [ClaimServicesPanel, ClaimItemsPanel]}
              openDirty={save || forReview}
              additionalTooltips={tooltips}
              {...editingProps}
            />
            <Contributions contributionKey={CLAIM_FORM_CONTRIBUTION_KEY} {...editingProps} />
          </Fragment>
        )}
      </StyledDiv>
    );
  }
}

const mapStateToProps = (state, props) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  userHealthFacilityFullPath: !!state.loc ? state.loc.userHealthFacilityFullPath : null,
  claim: state.claim.claim,
  fetchingClaim: state.claim.fetchingClaim,
  fetchedClaim: state.claim.fetchedClaim,
  errorClaim: state.claim.errorClaim,
  submittingMutation: state.claim.submittingMutation,
  mutation: state.claim.mutation,
  claimAdmin: state.claim.claimAdmin,
  claimHealthFacility: state.claim.claimHealthFacility,
  generating: state.claim.generating,
  isClaimCodeValid: state.claim.validationFields?.claimCode?.isValid,
  facialAudits: state.claim.facialAudits,
  fetchingFacialAudits: state.claim.fetchingFacialAudits,
  fetchedFacialAudits: state.claim.fetchedFacialAudits,
  errorFacialAudits: state.claim.errorFacialAudits,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    { fetchClaim, claimHealthFacilitySet, journalize, print, generate, fetchMutation, coreAlert, fetchClaimFacialAudits },
    dispatch,
  );
};

export { CLAIM_FORM_CONTRIBUTION_KEY };
export { ClaimServicesPanel };
export default withHistory(
  withModulesManager(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(ClaimForm)),
  ),
);