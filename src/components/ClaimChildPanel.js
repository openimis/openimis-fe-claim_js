import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  formatAmount,
  formatMessage,
  formatMessageWithValues,
  decodeId,
  withModulesManager,
  NumberInput,
  Table,
  PublishedComponent,
  AmountInput,
  TextInput,
  Error,
  FakeInput,
} from "@openimis/fe-core";
import { Paper, Box, IconButton, Grid, Typography } from "@material-ui/core";
import Button from '@material-ui/core/Button';
import DeleteIcon from "@material-ui/icons/Delete";
import _ from "lodash";
import { claimedAmount, approvedAmount } from "../helpers/amounts";

const styles = (theme) => ({
  paper: theme.paper.paper,
  tableHeader: theme.table.header,
  item : theme.paper.item,
  custompanel : theme.customPanel,
});

 
class ClaimChildPanelHeader extends Component { //reject all items/services button
  render() {
    return <Fragment>{this.props.text} <Button  onClick={this.props.fnRejectAll} color="primary"> 
    Reject all {this.props.type}
    </Button></Fragment>;
  }
}
  

class ClaimChildPanel extends Component {
  pItemformatters = {}
  state = {
    data: [],
  };
  pStatus = {}; // per instance . per ClaimChildPanel variable 
  SavePStatus(i,idx, component){
      var rc = {i:i,idx:idx, component:component};
      this.pStatus[i.id] = rc;
      return component;
  }

  constructor(props) {
    super(props);
    this.fixedPricesAtEnter = props.modulesManager.getConf("fe-claim", "claimForm.fixedPricesAtEnter", false);
    this.fixedPricesAtReview = props.modulesManager.getConf("fe-claim", "claimForm.fixedPricesAtReview", false);
    this.showJustificationAtEnter = props.modulesManager.getConf(
      "fe-claim",
      "claimForm.showJustificationAtEnter",
      false,
    );
  }

  fnRejectAll=() => {
      /* */ // no prop in the object
      for(var prop in this.pStatus){
          var rc = this.pStatus[prop];
          //var v = 2; //dropdn value to reject
          var v = rc.i.status==1 ? 2 : 1;
          rc.i.status = -1;
          this._onChangeApproval(rc.idx, 'status', v);
      }
      this.forceUpdate();
  }

  initData = () => {
    let data = [];
    if (!!this.props.edited[`${this.props.type}s`]) {
      data = this.props.edited[`${this.props.type}s`] || [];
    }
    if (!this.props.forReview && this.props.edited.status == 2 && !_.isEqual(data[data.length - 1], {})) {
      data.push({});
    }
    return data;
  };

  componentDidMount() {
    this.setState({ data: this.initData() });
    window.a = this.changeItemServicesToReject;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.edited_id && !this.props.edited_id) {
      let data = [];
      if (!this.props.forReview) {
        data.push({});
      }
      this.setState({ data, reset: this.state.reset + 1 });
    } else if (
      prevProps.reset !== this.props.reset ||
      (!!this.props.edited[`${this.props.type}s`] &&
        !_.isEqual(prevProps.edited[`${this.props.type}s`], this.props.edited[`${this.props.type}s`]))
    ) {
      this.setState({
        data: this.initData(),
      });
    }
  }

  _updateData = (idx, attr, v) => {
      const data = [...this.state.data];
      data[idx][attr] = v;
      if (!this.props.forReview && data.length === (idx + 1)) {
          data.push({});
      }
      return data;
  }

  _onEditedChanged = (data) => {
    let edited = { ...this.props.edited };
    edited[`${this.props.type}s`] = data;
    this.props.onEditedChanged(edited);
  };

  _onChange = (idx, attr, v) => {
    let data = this._updateData(idx, attr, v);
    this._onEditedChanged(data);
  };

  _onChangePriceApproved = (i,idx, attr, v) => {
        // i is bound to value
        // v stores new value
        // i has state before change (so i.priceApproved stores old value)
        if(v > i.priceAsked){ //
            //i.priceApproved = `${i.priceAsked}`; //not updated after long 
            i.priceApproved = 0;
            v=0; 
        }
        this._onChange(idx,attr,v);
    }

    _onChangeQuantityApproved = (i,idx, attr, v) => {
        if(v > i.qtyProvided){ //
            //i.qtyApproved=0;
            //i.qtyApproved = !!i.qtyApproved ? 0 : i.qtyProvided; //change state from prev state so there will be update
            i.qtyApproved = i.qtyApproved === 0 ? null : 0; // above permutaion betn null, 0 to force change state
            v=i.qtyApproved; //not 0 so both state match            
        }
        this._onChange(idx, attr, v);
    }

  _price = (v) => {
        let id = decodeId(v.id)
        return this.props[`${this.props.type}sPricelists`][this.props.edited.healthFacility[`${this.props.type}sPricelist`].id][id] || v.price;
  }

  _onChangeItem = (idx, attr, v) => {
    let data = this._updateData(idx, attr, v);
    if (!v) {
      data[idx].priceAsked = null;
      data[idx].qtyProvided = null;
    } else {
      data[idx].priceAsked = this._price(v);
      if (!data[idx].qtyProvided) {
        data[idx].qtyProvided = 1;
      }
    }
    this._onEditedChanged(data);
    if(this.isServiceSelected(v, attr)){
          alert('already selected'); //todo, return material dialog
          this._onDelete(idx);
          return; 
    };
  };
  
  isServiceSelected = (i, attr) => {
    let select =  `${attr}`;
    let selects = `${attr}s`;
    let rows = this.props.edited[selects];
    let items = rows ? rows : [];
    let f = items.filter(e => i && e[select] && i.id && e[select].id === i.id);
    if (f.length > 1)  return true;
    
    return false;
  }
     
  changeItemServicesToReject = () => {
        let attr = 'service';
        let select =  `${attr}`;
        let selects = `${attr}s`;
        let rows = this.props.edited[selects];
        let items = rows ? rows : [];
        let data = [...this.state.data];
        for(var i=0; i<items.length; i++){
            this._onChangeApproval(i,'status', 2);
            this.formatRejectedReason(data,i);
        }
  }

  _onDelete = (idx) => {
    const data = [...this.state.data];
    data.splice(idx, 1);
    this._onEditedChanged(data);
  };

  formatRejectedReason = (i, idx) => {
    if (i.status === 1) return null;
    return (
      <PublishedComponent
        readOnly={true}
        pubRef="claim.RejectionReasonPicker"
        withLabel={false}
        value={i.rejectionReason || null}
        compact={true}
        onChange={(v) => this._onChange(idx, "rejectionReason", v)}
      />
    );
  };

  _onChangeApproval = (idx, attr, v) => {
    let data = this._updateData(idx, [
      { attr, v },
      { attr: "rejectionReason", v: v === 2 ? -1 : null },
    ]);
    this._onEditedChanged(data);
  };

  aligns = () => {
        return [, , , , , , "right", "right"]
  }

  _validate = (jpt) => {
      return 1;
  }

  _formatAppQty = ()=> {
      console.log('_formatqty', this);
  }

  render() {
    const { intl, classes, edited, type, picker, forReview, fetchingPricelist, readOnly = false } = this.props;
    classes.tableTitle += ' ';
    classes.paperHeader += ' ';
    if (!edited) return null;
    if (!this.props.edited.healthFacility || !this.props.edited.healthFacility[`${this.props.type}sPricelist`]?.id) {
      return (
        <Paper className={classes.paper}>
          <Error error={{ message: formatMessage(intl, "claim", `${this.props.type}sPricelist.missing`) }} />
        </Paper>
      );
    }
    const totalClaimed = _.round(
      this.state.data.reduce((sum, r) => sum + claimedAmount(r), 0),
      2,
    );
    const totalApproved = _.round(
      this.state.data.reduce((sum, r) => sum + approvedAmount(r), 0),
      2,
    );
    let preHeaders = [
      "\u200b",
      "",
      totalClaimed > 0
        ? formatMessageWithValues(intl, "claim", `edit.${type}s.totalClaimed`, {
          totalClaimed: formatAmount(intl, totalClaimed),
        })
        : "",
      "",
    ];
    let headers = [
      `claim.sn`,
      `edit.${type}s.${type}`,
      `edit.${type}s.quantity`,
      `edit.${type}s.price`,
      `edit.${type}s.explanation`,
    ];

    let itemFormatters = [
            (i, idx) => <span>
              {idx+1}
            </span>,
      (i, idx) => (
        <Box minWidth={400}>
          <PublishedComponent
            readOnly={!!forReview || readOnly}
            pubRef={picker}
            withLabel={false}
            value={i[type]}
            fullWidth
            pricelistUuid={edited.healthFacility[`${this.props.type}sPricelist`].uuid}
            date={edited.dateClaimed}
            onChange={(v) => this._onChangeItem(idx, type, v)}
          />
        </Box>
      ),
      (i, idx) => (
        <NumberInput
          readOnly={!!forReview || readOnly}
          value={i.qtyProvided}
          onChange={(v) => this._onChange(idx, "qtyProvided", v)}
        />
      ),
      (i, idx) => (
        <AmountInput
          readOnly={!!forReview || readOnly || this.fixedPricesAtEnter}
          value={i.priceAsked}
          decimal={true}
          onChange={(v) => this._onChange(idx, "priceAsked", v)}
        />
      ),
      (i, idx) => (
        <TextInput
          readOnly={!!forReview || readOnly}
          value={i.explanation}
          onChange={(v) => this._onChange(idx, "explanation", v)}
        />
      ),
    ];
    if (!!forReview || edited.status !== 2) {
      if (!this.fixedPricesAtReview) {
        preHeaders.push("");
      }
      preHeaders.push('\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003');
      preHeaders.push(
        totalClaimed > 0
          ? formatMessageWithValues(intl, "claim", `edit.${type}s.totalApproved`, {
            totalApproved: formatAmount(intl, totalApproved),
          })
          : "",
      );

      headers.push(`edit.${type}s.appQuantity`);
      itemFormatters.push((i, idx) => (
        <NumberInput
          readOnly={!forReview && readOnly}
          value={i.qtyApproved}
          onChange={(v) => this._onChange(idx, "qtyApproved", v)}
        />
      ));
      if (!this.fixedPricesAtReview) {
        headers.push(`edit.${type}s.appPrice`);
        itemFormatters.push((i, idx) => (
          <AmountInput
            readOnly={!forReview && readOnly}
            value={i.priceApproved}
            decimal={true}
            onChange={(v) => this._onChange(idx, "priceApproved", v)}
          />
        ));
      }

      headers.push(`edit.${type}s.pricevaluated`);
      itemFormatters.push((i, idx) => (
        <AmountInput
          readOnly={true}
          decimal={true}
          value={i.priceValuated}
          onChange={(v) => this._onChange(idx, "priceValuated", v)}
        />
      ));
    }

    if (this.showJustificationAtEnter || edited.status !== 2) {
      preHeaders.push("");
      headers.push(`edit.${type}s.justification`);
      itemFormatters.push((i, idx) => (
        <TextInput
          readOnly={!forReview && readOnly}
          value={i.justification}
          onChange={(v) => this._onChange(idx, "justification", v)}
        />
      ));
    }
    if (!!forReview || edited.status !== 2) {
      preHeaders.push("", "");
      headers.push(`edit.${type}s.status`, `edit.${type}s.rejectionReason`);
      itemFormatters.push(
        (i, idx) => (
          <PublishedComponent
            readOnly={true}
            pubRef="claim.ApprovalStatusPicker"
            withNull={false}
            withLabel={false}
            value={i.status}
            onChange={(v) => this._onChangeApproval(idx, "status", v)}
          />
        ),
        (i, idx) => this.formatRejectedReason(i, idx),
      );
    }
    let header = formatMessage(intl, "claim", `edit.${this.props.type}s.title`);
    if (fetchingPricelist) {
      header += formatMessage(intl, "claim", `edit.${this.props.type}s.fetchingPricelist`);
    }
    return (
      <Paper className={classes.paper}>
        <Table
          module="claim"
          header={header}
          preHeaders={preHeaders}
          headers={headers}
          itemFormatters={itemFormatters}
          items={!fetchingPricelist ? this.state.data : []}
          onDelete={!forReview && !readOnly && this._onDelete}
        />
      </Paper>
    );
}
}

const mapStateToProps = (state, props) => ({
  fetchingPricelist: !!state.medical_pricelist && state.medical_pricelist.fetchingPricelist,
  servicesPricelists: !!state.medical_pricelist ? state.medical_pricelist.servicesPricelists : {},
  itemsPricelists: !!state.medical_pricelist ? state.medical_pricelist.itemsPricelists : {},
});

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps)(ClaimChildPanel)))));
