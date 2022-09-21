import React, { Component } from "react";
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
  TableService,
  TableServiceReview,
  PublishedComponent,
  AmountInput,
  TextInput,
  Error,
} from "@openimis/fe-core";
import { Paper, Box, TableCell } from "@material-ui/core";
import _ from "lodash";
import { claimedAmount, approvedAmount } from "../helpers/amounts";

const styles = (theme) => ({
  paper: theme.paper.paper,
});

class ClaimChildPanel extends Component {
  state = {
    data: [],
  };

  constructor(props) {
    super(props);
    this.fixedPricesAtEnter = props.modulesManager.getConf("fe-claim", "claimForm.fixedPricesAtEnter", true);
    this.fixedPricesAtReview = props.modulesManager.getConf("fe-claim", "claimForm.fixedPricesAtReview", true);
    this.showJustificationAtEnter = props.modulesManager.getConf(
      "fe-claim",
      "claimForm.showJustificationAtEnter",
      false,
    );
  }

  initData = () => {
    let data = [];
    if (!!this.props.edited[`${this.props.type}s`]) {
      this.props.edited[`${this.props.type}s`].forEach(elmt =>{
        //elmt.subItems = elmt.claimlinkedItem;
        //elmt.service.servicesLinked = elmt.claimlinkedItem;
        //elmt.subServices = elmt.claimlinkedService;
        //this.state.subServicesEdit = elmt.claimlinkedService;
        //this.state.subItemsEdit = elmt.claimlinkedItem;
      })

      data = this.props.edited[`${this.props.type}s`] || [];
      let edited = { ...this.props.edited };
      edited[`${this.props.type}s`] = data;

      //this.props.onEditedChanged(edited);
    }
    if (!this.props.forReview && this.props.edited.status == 2 && !_.isEqual(data[data.length - 1], {})) {
      data.push({});
    }
    return data;
  };

  componentDidMount() {
    this.setState({ data: this.initData() });
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

  _updateData = (idx, updates) => {
    const data = [...this.state.data];
    updates.forEach((update) => (data[idx][update.attr] = update.v));
    if (!this.props.forReview && data.length === idx + 1) {
      data.push({});
    }
    return data;
  };

  _onEditedChanged = (data) => {
    let edited = { ...this.props.edited };
    edited[`${this.props.type}s`] = data;
    this.props.onEditedChanged(edited);
  };

  _onChange = (idx, attr, v) => {
    let data = this._updateData(idx, [{ attr, v }]);
    this._onEditedChanged(data);
  };

  _price = (v) => {
    let id = decodeId(v.id);
    return (
      this.props[`${this.props.type}sPricelists`][this.props.edited.healthFacility[`${this.props.type}sPricelist`].id][
      id
      ] || v.price
    );
  };

  _code = (v) => {
    let id = decodeId(v.id);
    return (
      this.props[`${this.props.type}sPricelists`][this.props.edited.healthFacility[`${this.props.type}sPricelist`].id][
      id
      ] || v.code
    );
  };

  _serviceSet = (v) => {
    let id = decodeId(v.id);
    return (
      this.props[`servicesPricelists`][this.props.edited.healthFacility[`${this.props.type}sPricelist`].id][
      id
      ] || v.serviceserviceSet
    );
  };

  _serviceLinked = (v) => {
    let id = decodeId(v.id);
    return (
      this.props[`servicesPricelists`][this.props.edited.healthFacility[`${this.props.type}sPricelist`].id][
      id
      ] || v.servicesLinked
    );
  };

  _onChangeItem = (idx, attr, v) => {
    let data = this._updateData(idx, [{ attr, v }]);
    if (!v) {
      data[idx].priceAsked = null;
      data[idx].qtyProvided = null;
      data[idx].qtyAppr = null;
    } else {
      data[idx].priceAsked = this._price(v);
      if (!('item' in data[idx])){
        data[idx].subItems = this._serviceLinked(v);
        data[idx].subServices = this._serviceSet(v);
      }
      data[idx].code = this._code(v);
      
      if (!data[idx].qtyProvided || !data[idx].qtyAppr) {
        data[idx].qtyProvided = 1;
        data[idx].qtyAppr = "0";
      }
    }
    console.log("Change Item in Claim ChildPanel");
    console.log(data)
    this._onEditedChanged(data);
  };

  _onChangeSubItem = (idx, udx, attr, v) => {
    let data = [...this.state.data];
    this._onEditedChanged(data);
  };
  
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

  render() {
    const { intl, classes, edited, type, picker, forReview, fetchingPricelist, readOnly = false } = this.props;    
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
      totalClaimed > 0
        ? formatMessageWithValues(intl, "claim", `edit.${type}s.totalClaimed`, {
          totalClaimed: formatAmount(intl, totalClaimed),
        })
        : "",
    ];
    let headers = [
      `edit.${type}s.${type}`,
    ];

    let itemFormatters = [
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
          readOnly={!!forReview || readOnly || true}
          value={i.qtyProvided}
          onChange={(v) => this._onChange(idx, "qtyProvided", v)}
        />
      ),
      (i, idx) => (
        <AmountInput
          readOnly={!!forReview || readOnly || this.fixedPricesAtEnter}
          value={this.state.data[idx].service?.priceAsked}
          onChange={(v) => this._onChange(idx, "priceAsked", v)}
        />
      ),
      (i, idx) => (
        <TextInput
          readOnly={!!forReview || readOnly}
          value={i.explanation}
          onChange={(v) => this._onChange(idx, "explanation", v)}
        />
      )
    ];

    let subServicesItemsFormatters = [
      (i, idx) => (i.subServices.map((u, udx) => (
        <tr>
          <TableCell>
            <TextInput
              readOnly={true}
              value={u.service.code}
            />
          </TableCell>
          <TableCell>
            <Box minWidth={400}>
              <TextInput
                readOnly={!!forReview || readOnly || true}
                value={u.service.name}
              />
            </Box>
          </TableCell>
          <TableCell>
            <NumberInput
              readOnly={!!forReview || readOnly}
              value={this.state.data[idx].service?.serviceserviceSet[udx]?.qtyDisplayed ? this.state.data[idx].service.serviceserviceSet[udx].qtyDisplayed : "0"}
              onChange={(v) => {
                if(i.service.packagetype=="F"){
                  if(u.qtyProvided<v){
                    alert(formatMessageWithValues(intl, "claim", "edit.services.MaxApproved", {
                      totalApproved: u.qtyProvided,
                    }));
                  }
                  u.qtyAsked=v;  
                }else if(i.service.packagetype=="P"){
                  if(v==u.qtyProvided){
                    u.qtyAsked=u.qtyProvided;
                    u.qtyDisplayed=u.qtyProvided;                   
                  }else{
                    u.qtyDisplayed=v;
                    u.qtyAsked=0;
                  }
                }
                this._onChangeSubItem(idx, udx, "servicesQty", v);
                console.log(totalClaimed);
                }
              }
            />
          </TableCell>
          <TableCell>
            <AmountInput
              readOnly={true}
              value={u.priceAsked}
            />
          </TableCell>
        </tr>
      ))),
      (i, idx) => (i.subItems.map((u, udx) => {
        return (
        <tr>
          <TableCell>
            <TextInput
              readOnly={true}
              value={u.item.code}
            />
          </TableCell>
          <TableCell>
            <Box minWidth={400}>
              <TextInput
                readOnly={!!forReview || readOnly || true}
                value={u.item.name}
              />
            </Box>
          </TableCell>
          <TableCell>
            <NumberInput
              readOnly={!!forReview || readOnly}
              value={this.state.data[idx]?.service?.servicesLinked[udx]?.qtyDisplayed ? this.state.data[idx]?.service?.servicesLinked[udx]?.qtyDisplayed : "0"}
              onChange={(v) => {
                if(i.service.packagetype=="F"){
                  if(u.qtyProvided<v){
                    alert(formatMessageWithValues(intl, "claim", "edit.services.MaxApproved", {
                      totalApproved: u.qtyProvided,
                    }));
                  }
                  u.qtyAsked=v;
                }else if(i.service.packagetype=="P"){
                  if(v==u.qtyProvided){
                    u.qtyAsked=u.qtyProvided;
                    u.qtyDisplayed=u.qtyProvided;                   
                  }else{
                    u.qtyDisplayed=v;
                    u.qtyAsked=0;
                  }
                }
                this._onChangeSubItem(idx, udx, "servicesQty", v);
                console.log(totalClaimed);
              }
            }
            />
          </TableCell>
          <TableCell>
            <AmountInput
              readOnly={true}
              value={u.priceAsked}
            />
          </TableCell>
        </tr>
      )
          }
      ))
    ]

    let subServicesItemsFormattersReview = [
      (i, idx) => (this.state.subServicesEdit.map((u, udx) => (
        <tr>
          <TableCell>
            <TextInput
              readOnly={true}
              value={u.service.code}
            />
          </TableCell>
          <TableCell>
            <Box minWidth={400}>
              <TextInput
                readOnly={!!forReview || readOnly || true}
                value={u.service.name}
              />
            </Box>
          </TableCell>
          <TableCell>
            <NumberInput
              readOnly={!!forReview || readOnly}
              value={u.qtyDisplayed?u.qtyDisplayed:"0"}
              onChange={(v) => {
                if(i.service.packagetype=="F"){
                  if(u.qtyProvided<v){
                    alert(formatMessageWithValues(intl, "claim", "edit.services.MaxApproved", {
                      totalApproved: u.qtyProvided,
                    }));
                  }
                  u.qtyDisplayed=v;  
                }else if(i.service.packagetype=="P"){
                  if(v==u.qtyProvided){
                    u.qtyDisplayed=u.qtyProvided;                   
                  }else{
                    u.qtyDisplayed=0;
                  }
                }
                this._onChangeSubItem(idx, udx, "servicesQty", v);
                console.log(totalClaimed);
                }
              }
            />
          </TableCell>
          <TableCell>
            <AmountInput
              readOnly={true}
              value={u.priceAsked}
            />
          </TableCell>
        </tr>
      ))),
      (i, idx) => (this.state.subItemsEdit.map((u, udx) => {
        return (
        <tr>
          <TableCell>
            <TextInput
              readOnly={true}
              value={u.item.code}
            />
          </TableCell>
          <TableCell>
            <Box minWidth={400}>
              <TextInput
                readOnly={!!forReview || readOnly || true}
                value={u.item.name}
              />
            </Box>
          </TableCell>
          <TableCell>
            <NumberInput
              readOnly={!!forReview || readOnly}
              value={this.state.subItemsEdit[idx]?.qtyProvided}
              onChange={(v) => {
                if(i.service.packagetype=="F"){
                  if(u.qtyProvided<v){
                    alert(formatMessageWithValues(intl, "claim", "edit.services.MaxApproved", {
                      totalApproved: u.qtyProvided,
                    }));
                  }
                  u.qtyAsked=v;
                }else if(i.service.packagetype=="P"){
                  if(v==u.qtyProvided){
                    u.qtyAsked=u.qtyProvided;
                    u.qtyDisplayed=u.qtyProvided;                   
                  }else{
                    u.qtyDisplayed=v;
                    u.qtyAsked=0;
                  }
                }
                this._onChangeSubItem(idx, udx, "servicesQty", v);
                console.log(totalClaimed);
              }
            }
            />
          </TableCell>
          <TableCell>
            <AmountInput
              readOnly={true}
              value={u.priceAsked}
            />
          </TableCell>
        </tr>
      )
          }
      ))
    ]

    if (!!forReview || edited.status !== 2) {
      if (!this.fixedPricesAtReview) {
        preHeaders.push("");
      }
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
          readOnly={readOnly}
          value={i.qtyApproved}
          onChange={(v) => this._onChange(idx, "qtyApproved", v)}
        />
      ));
      if (!this.fixedPricesAtReview) {
        headers.push(`edit.${type}s.appPrice`);
        itemFormatters.push((i, idx) => (
          <AmountInput
            readOnly={readOnly}
            value={i.priceApproved}
            onChange={(v) => this._onChange(idx, "priceApproved", v)}
          />
        ));
      }
    }

    if (this.showJustificationAtEnter || edited.status !== 2) {
      preHeaders.push("");
      headers.push(`edit.${type}s.justification`);
      itemFormatters.push((i, idx) => (
        <TextInput
          readOnly={readOnly}
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
            readOnly={readOnly}
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
        <TableServiceReview
          module="claim"
          header={header}
          preHeaders={preHeaders}
          headers={headers}
          itemFormatters={itemFormatters}
          subServicesItemsFormatters={subServicesItemsFormatters}
          items={!fetchingPricelist ? this.state.data : []}
          onDelete={!forReview && !readOnly && this._onDelete}
          subServicesItemsFormattersReview={subServicesItemsFormattersReview}
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
