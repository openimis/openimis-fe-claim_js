import React, { Component, Fragment } from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import CheckIcon from "@material-ui/icons/Check";
import ReplayIcon from "@material-ui/icons/Replay";
import PrintIcon from "@material-ui/icons/ListAlt";
import AttachIcon from "@material-ui/icons/AttachFile";
import {
  Contributions,
  ProgressOrError,
  Form,
  PublishedComponent,
  withModulesManager,
  withHistory,
  journalize,
  toISODate,
  formatMessage,
  formatMessageWithValues,
  Helmet,
} from "@openimis/fe-core";
import { fetchClaim, claimHealthFacilitySet, print, generate } from "../actions";
import moment from "moment";
import _ from "lodash";

import ClaimMasterPanel from "./ClaimMasterPanel";
import ClaimChildPanel from "./ClaimChildPanel";
import ClaimFeedbackPanel from "./ClaimFeedbackPanel";

import { RIGHT_ADD, RIGHT_LOAD, RIGHT_PRINT } from "../constants";
import ClaimChildPanelReview from "./ClaimChildPanelReview";

const CLAIM_FORM_CONTRIBUTION_KEY = "claim.ClaimForm";

const styles = (theme) => ({
  paper: theme.paper.paper,
  paperHeader: theme.paper.header,
  paperHeaderAction: theme.paper.action,
  item: theme.paper.item,
});

class ClaimServicesPanel extends Component {
  render() {
    return <ClaimChildPanelReview {...this.props} type="service" picker="medical.ServicePicker" />;
  }
}

class ClaimItemsPanel extends Component {
  render() {
    return <ClaimChildPanelReview {...this.props} type="item" picker="medical.ItemPicker" />;
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
  };

  constructor(props) {
    super(props);
    this.canSaveClaimWithoutServiceNorItem = props.modulesManager.getConf(
      "fe-claim",
      "canSaveClaimWithoutServiceNorItem",
      true,
    );
    this.claimPrefix =props.modulesManager.getConf(
      "fe-claim",
      "claimPrex",
      0,
    );
    this.claimAttachments = props.modulesManager.getConf("fe-claim", "claimAttachments", true);
  }

  _newClaim() {
    let claim = {};
    claim.healthFacility =
      this.state && this.state.claim ? this.state.claim.healthFacility : this.props.claimHealthFacility;
    claim.admin = this.state && this.state.claim ? this.state.claim.admin : this.props.claimAdmin;
    claim.status = this.props.modulesManager.getConf("fe-claim", "newClaim.status", 2);
    claim.dateClaimed = toISODate(moment().toDate());
    claim.dateFrom = toISODate(moment().toDate());
    claim.visitType = this.props.modulesManager.getConf("fe-claim", "newClaim.visitType", "O");
    claim.jsonExt = {};
    return claim;
  }

  componentDidMount() {
    if (!!this.props.claimHealthFacility) {
      this.props.claimHealthFacilitySet(this.props.claimHealthFacility);
    }
    if (this.props.claim_uuid) {
      this.setState(
        (state, props) => ({ claim_uuid: props.claim_uuid }),
        (e) => this.props.fetchClaim(this.props.modulesManager, this.props.claim_uuid, this.props.forFeedback),
      );
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.fetchedClaim !== this.props.fetchedClaim && !!this.props.fetchedClaim) {
      var claim = this.props.claim;
      claim.jsonExt = !!claim.jsonExt ? JSON.parse(claim.jsonExt) : {};
      this.setState(
        { claim, claim_uuid: claim.uuid, lockNew: false, newClaim: false },
        this.props.claimHealthFacilitySet(this.props.claim.healthFacility),
      );
    } else if (prevProps.claim_uuid && !this.props.claim_uuid) {
      this.setState({ claim: this._newClaim(), newClaim: true, lockNew: false, claim_uuid: null });
    } else if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      this.setState({ reset: this.state.reset + 1 });
    } else if (!prevProps.generating && !!this.props.generating) {
      this.props.generate(this.state.printParam);
    }
  }

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

  canSaveDetail = (d, type) => {
    if (!d[type]) return false;
    if (d.qtyProvided === null || d.qtyProvided === undefined || d.qtyProvided === "") return false;
    if (d.priceAsked === null || d.priceAsked === undefined || d.priceAsked === "") return false;
    return true;
  };

  checkQtySubService = () => {
    
  }

  canSave = (forFeedback) => {
    console.log(this.state);
    if (!this.state.claim.code) return false;
    if (!!this.state.claim.codeError) return false;
    if (!this.state.claim.healthFacility) return false;
    if (!this.state.claim.insuree) return false;
    if (!this.state.claim.admin) return false;
    if (!this.state.claim.dateClaimed) return false;
    if (!this.state.claim.dateFrom) return false;
    if (this.state.claim.dateClaimed < this.state.claim.dateFrom) return false;
    if (!!this.state.claim.dateTo && this.state.claim.dateFrom > this.state.claim.dateTo) return false;
    if (!this.state.claim.icd) return false;
    if (!forFeedback) {
      //this.checkQtySubService();
      if (!this.state.claim.items && !this.state.claim.services) {
        return !!this.canSaveClaimWithoutServiceNorItem;
      }
      //if there are items or services, they have to be complete
      let items = [];
      if (!!this.state.claim.items) {
        items = [...this.state.claim.items];
        if (!this.props.forReview) items.pop();
        if (items.length && items.filter((i) => !this.canSaveDetail(i, "item")).length) {
          return false;
        }
      }
      let services = [];
      if (!!this.state.claim.services) {
        services = [...this.state.claim.services];
        if (!this.props.forReview) services.pop();
        if (services.length && services.filter((s) => !this.canSaveDetail(s, "service")).length) {
          return false;
        }
      }
      if (!items.length && !services.length) return !!this.canSaveClaimWithoutServiceNorItem;
    }
    return true;
  };

  reload = () => {
    this.props.fetchClaim(
      this.props.modulesManager,
      this.state.claim_uuid,
      this.state.claim.code,
      this.props.forFeedback,
    );
  };

  onEditedChanged = (claim) => {
    this.setState({ claim, newClaim: false });
  };

  _save = (claim) => {
    this.setState(
      { lockNew: !claim.uuid }, // avoid duplicates
      (e) => this.props.save(claim),
    );
  };

  print = (claimUuid) => {
    this.setState({ printParam: claimUuid }, (e) => this.props.print());
  };

  _deliverReview = (claim) => {
    this.setState(
      { lockNew: !claim.uuid }, // avoid duplicates submissions
      (e) => this.props.deliverReview(claim),
    );
  };

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
    } = this.props;
    const { claim, claim_uuid, lockNew } = this.state;
    let readOnly =
      lockNew ||
      (!forReview && !forFeedback && claim.status !== 2) ||
      (forReview && (claim.reviewStatus >= 8 || claim.status !== 4)) ||
      (forFeedback && claim.status !== 4) ||
      !rights.filter((r) => r === RIGHT_LOAD).length;
    var actions = [];
    if (!!claim_uuid) {
      actions.push({
        doIt: (e) => this.reload(claim_uuid),
        icon: <ReplayIcon />,
        onlyIfDirty: !readOnly,
      });
    }
    if (!!claim_uuid && rights.includes(RIGHT_PRINT)) {
      actions.push({
        doIt: (e) => this.print(claim_uuid),
        icon: <PrintIcon />,
        onlyIfNotDirty: true,
      });
    }
    if (!!this.claimAttachments && (!readOnly || claim.attachmentsCount > 0)) {
      actions.push({
        doIt: (e) => this.setState({ attachmentsClaim: claim }),
        icon: <AttachIcon />,
      });
    }
    return (
      <Fragment>
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
            <Form
              module="claim"
              edited_id={claim_uuid}
              edited={this.state.claim}
              reset={this.state.reset}
              title="edit.title"
              titleParams={{ code: this.state.claim.code }}
              back={back}
              forcedDirty={this.state.forcedDirty}
              add={!!add && !this.state.newClaim ? this._add : null}
              save={!!save ? this._save : null}
              fab={forReview && !readOnly && this.state.claim.reviewStatus < 8 && <CheckIcon />}
              fabAction={this._deliverReview}
              fabTooltip={formatMessage(this.props.intl, "claim", "claim.Review.deliverReview.fab.tooltip")}
              canSave={(e) => this.canSave(forFeedback)}
              reload={(claim_uuid || readOnly) && this.reload}
              actions={actions}
              readOnly={readOnly}
              forReview={forReview}
              forFeedback={forFeedback}
              HeadPanel={ClaimMasterPanel}
              Panels={!!forFeedback ? [ClaimFeedbackPanel] : [ClaimServicesPanel, ClaimItemsPanel]}
              onEditedChanged={this.onEditedChanged}
            />
            <Contributions contributionKey={CLAIM_FORM_CONTRIBUTION_KEY} />
          </Fragment>
        )}
      </Fragment>
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
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ fetchClaim, claimHealthFacilitySet, journalize, print, generate }, dispatch);
};

export default withHistory(
  withModulesManager(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(ClaimForm)))),
  ),
);
