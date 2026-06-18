import _ from "lodash";
import { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";

import { Box, Grid, IconButton, Paper, TableCell, Tooltip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import {
  AmountInput,
  decodeId,
  Error,
  formatAmount,
  formatMessage,
  formatMessageWithValues,
  NumberInput,
  PublishedComponent,
  TableService,
  TextInput,
  withModulesManager,
  withTooltip,
  GetIconComponent,
} from "@openimis/fe-core";
import { DEFAULT, SERVICE_TYPE_PP_F, SERVICE_TYPE_PP_P, SERVICE_TYPE_PP_S } from "../constants";
import { approvedAmount, claimedAmount } from "../helpers/amounts";
const ThumbDown = GetIconComponent("ThumbDown")
const ThumbUp = GetIconComponent("ThumbUp")
const StyledPaper = styled(Paper)(({ theme }) => ({
  ...(theme?.paper?.paper ?? {}),
}));

class ClaimChildPanel extends Component {
  state = {
    data: [],
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
    this.fixedPricesAtEnter = props.modulesManager.getConf("fe-claim", "claimForm.fixedPricesAtEnter", false);
    this.fixedPricesAtReview = props.modulesManager.getConf("fe-claim", "claimForm.fixedPricesAtReview", false);
    this.showJustificationAtEnter = props.modulesManager.getConf(
      "fe-claim",
      "claimForm.showJustificationAtEnter",
      false,
    );
    this.showOrdinalNumber = props.modulesManager.getConf("fe-claim", "claimForm.showOrdinalNumber", false);
    this.quantityMaxValue = props.modulesManager.getConf(
      "fe-claim",
      "claimForm.quantityMaxValue",
      DEFAULT.QUANTITY_MAX_VALUE,
    );
    this.isDecimalPrice = props.modulesManager.getConf("fe-claim", "isDecimalPrice", true);
  }

  initData = () => {
    let data = [];
    const {edited, type, isRestored, forReview} = this.props;
    if (!!edited[`${type}s`]) {
      data = edited[`${type}s`] || [];
      let claim = { ...edited };
      claim[`${type}s`] = data;
    }
    if (!!edited[`services`]) {
      data.forEach((d) => {
        if(!!d.services){
          d.services = d.services.map((s) => ({...s, qtyAsked: s.qtyDisplayed}));
          d.subServices = d.services;
        }
      });
      data.forEach((d) => {
        if(!!d.items){
          d.items = d.items.map((i) => ({...i, qtyAsked: i.qtyDisplayed}));
          d.subItems = d.items;
        }
      });
    }
    if (!forReview && edited.status === 2 && !_.isEqual(data[data.length - 1], {})) {
      data.push({});
    }
    return data;
  };

  componentDidMount() {
    this.setState({ data: this.initData() });
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.edited_id && !this.props.edited_id && !(this.props.isDuplicate || this.props.isRestored)) {
      let data = [];
      if (!this.props.forReview) {
        data.push({});
      }
      this.setState({ data, reset: this.state.reset + 1 });
    } else if (
      prevProps.reset !== this.props.reset ||
      (!!this.props.edited && !_.isEqual(prevProps.edited, this.props.edited))
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
  }

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
    const id = decodeId(v.id);
    const { type, edited, [`${type}sPricelists`]: pricelists } = this.props;
    const pricelistId = edited.healthFacility[`${type}sPricelist`].id;

    return pricelists[pricelistId]?.[id] || v.price;
  };

  _code = (v) => {
    const id = decodeId(v.id);
    const { type, edited, [`${type}sPricelists`]: pricelists } = this.props;
    const pricelistId = edited.healthFacility[`${type}sPricelist`].id;

    return pricelists[pricelistId]?.[id] || v.code;
  };

  _serviceSet = (v) => {
    const id = decodeId(v.id);
    const { servicesPricelists, edited, type } = this.props;
    const pricelistId = edited.healthFacility[`${type}sPricelist`].id;

    return servicesPricelists[pricelistId]?.[id] || v.serviceserviceSet;
  };

  _serviceLinked = (v) => {
    const id = decodeId(v.id);
    const { servicesPricelists, edited, type } = this.props;
    const pricelistId = edited.healthFacility[`${type}sPricelist`].id;

    return servicesPricelists[pricelistId]?.[id] || v.servicesLinked;
  };

  _onChangeItem = (idx, attr, v) => {
    let data = this._updateData(idx, [{ attr, v }]);
    if (!v) {
      data[idx].priceAsked = null;
      data[idx].qtyProvided = null;
      data[idx].qtyAppr = null;
    } else {
      data[idx].priceAsked = this._price(v);
      if (!("item" in data[idx])) {
        data[idx].subItems = this._serviceLinked(v);
        data[idx].subServices = this._serviceSet(v);
      }
      data[idx].code = this._code(v);

      if (!data[idx].qtyProvided || !data[idx].qtyAppr) {
        data[idx].qtyProvided = 1;
        data[idx].qtyAppr = "0";
      }
    }
    this._onEditedChanged(data);
  };

  _onChangeSubItem = (idx, udx, attr, v) => {
    if (!this.state.data[idx].manualPrice) {
      this.state.data[idx].priceAsked = claimedAmount(this.state.data[idx]);
    }
    let data = [...this.state.data];
    this._onEditedChanged(data);
  };

  _onDelete = (idx) => {
    const data = [...this.state.data];
    data.splice(idx, 1);
    this._onEditedChanged(data);
  };

  _checkIfItemsServicesExist = (type, edited) => {
    if (type === "item") {
      return Array.isArray(edited.items) ? !edited.items.length == 0 : false;
    }
    else {
      return Array.isArray(edited.services) ? !edited.services.length == 0 : false;
    }
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

  rejectAllOnClick = () => {
    const updatedData = this.state.data.map((element) => ({
      ...element,
      status: 2,
      rejectionReason: -1,
    }));

    this.setState({ data: updatedData }, () => {
      this._onEditedChanged(updatedData);
    });
  };

  approveAllOnClick = () => {
    const updatedData = this.state.data.map((element) => ({
      ...element,
      status: 1,
      rejectionReason: null,
    }));

    this.setState({ data: updatedData }, () => {
      this._onEditedChanged(updatedData);
    });
  };

  extendHeader = () => {
    const { intl, type, edited, forReview, modulesManager } = this.props;

    const totalClaimed = _.round(
      this.state.data.reduce((sum, r) => sum + claimedAmount(r), 0),
      2,
    );
    const totalApproved = _.round(
      this.state.data.reduce((sum, r) => sum + approvedAmount(r), 0),
      2,
    );

    return (
      <>
        {totalClaimed > 0 && (
          <Typography>
            {formatMessageWithValues(intl, "claim", `edit.${type}s.totalClaimed`, {
              totalClaimed: formatAmount(modulesManager, intl, totalClaimed),
            })}
          </Typography>
        )}
        {totalClaimed > 0 && (
          <Typography>
            {formatMessageWithValues(intl, "claim", `edit.${type}s.totalApproved`, {
              totalApproved: formatAmount(modulesManager, intl, totalApproved),
            })}
          </Typography>
        )}
        {
          <Grid>
            {!!forReview && edited.status == 4 && this._checkIfItemsServicesExist(type, edited) && (
              <>
                {withTooltip(
                  <IconButton onClick={this.rejectAllOnClick}>
                    <ThumbDown />
                  </IconButton>,
                  formatMessage(this.props.intl, "claim", "ClaimChildPanel.review.rejectAll"),
                )}
                {withTooltip(
                  <IconButton onClick={this.approveAllOnClick}>
                    <ThumbUp />
                  </IconButton>,
                  formatMessage(this.props.intl, "claim", "ClaimChildPanel.review.approveAll"),
                )}
              </>
            )}
          </Grid>
        }
      </>
    );
  };

  render() {
    const { intl, edited, type, picker, forReview, fetchingPricelist, readOnly = false, modulesManager } = this.props;
    if (!edited) return null;
    if (!this.props.edited.healthFacility || !this.props.edited.healthFacility[`${this.props.type}sPricelist`]?.id) {
      return (
        <StyledPaper className="paper">
          <Error error={{ message: formatMessage(intl, "claim", `${this.props.type}sPricelist.missing`) }} />
        </StyledPaper>
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
            totalClaimed: formatAmount(modulesManager, intl, totalClaimed),
          })
        : "",
    ];
    let headers = [
      `edit.${type}s.${type}`,
      `edit.${type}s.quantity`,
      `edit.${type}s.price`,
      `edit.${type}s.explanation`,
    ];

    let subServiceHeaders = [
      `medical.service.code`,
      `medical.service.name`,
      `edit.${type}s.quantity`,
      `claim.edit.items.appPrice`,
    ];

    let filterItemsOptions = (options) => {
      let currentItemsIds = edited.items ? edited.items.map((claimItem) => claimItem?.item?.id) : [];
      return options.filter((option) => !currentItemsIds.includes(option.id));
    };
    let filterServicesOptions = (options) => {
      let currentServicesIds = edited.services ? edited.services.map((claimService) => claimService?.service?.id) : [];
      return options.filter((option) => !currentServicesIds.includes(option.id));
    };

    let itemFormatters = [
      (i, idx) => (
        <Tooltip
          title={formatMessage(intl, "claim", "ClaimChildPanel.itemOrService.tooltip")}
          disableHoverListener={!!forReview || !!readOnly}
          disableFocusListener={!!forReview || !!readOnly}
          sx={{ fontSize: "3rem" }}
        >
          <Box minWidth={400}>
            <PublishedComponent
              required={(!!edited.services && edited.services?.length<2 && !!edited.items && edited?.items?.length<2) || (!edited.services && !edited.items)}
              readOnly={!!forReview || readOnly}
              pubRef={picker}
              filterOptions={this.props.type === "item" ? filterItemsOptions : filterServicesOptions}
              withLabel={false}
              value={i[type]}
              fullWidth
              pricelistUuid={edited.healthFacility[`${this.props.type}sPricelist`].uuid}
              date={edited.dateClaimed}
              onChange={(v) => this._onChangeItem(idx, type, v)}
              dataCy={`claim-${this.props.type}-picker`}
            />
          </Box>
        </Tooltip>
      ),
      (i, idx) => (
        <NumberInput
          readOnly={!!forReview || readOnly || (type === "service" && i[type]?.packagetype != SERVICE_TYPE_PP_S)}
          value={i.qtyProvided}
          onChange={(v) => this._onChange(idx, "qtyProvided", v)}
          error={i.qtyProvided <= 0 ? formatMessage(intl, "claim", "ClaimChildPanel.quantity.error") : null}
          max={parseInt(i?.item?.maximumAmount) || this.quantityMaxValue}
          inputProps={{ "data-cy": `claim-${this.props.type}-${idx}-quantity` }}
        />
      ),
      (i, idx) => (
        <AmountInput
          readOnly={!!forReview || readOnly || this.fixedPricesAtEnter}
          value={
            i[type] === "service" && i[type]?.packagetype != SERVICE_TYPE_PP_S
              ? this.state.data[idx].service?.priceAsked
              : i.priceAsked
          }
          decimal={true}
          allowDecimals={this.isDecimalPrice}
          onChange={(v) => this._onChange(idx, "priceAsked", v)}
          inputProps={{ "data-cy": `claim-${this.props.type}-${idx}-price` }}
        />
      ),
      (i, idx) => (
        <TextInput
          readOnly={!!forReview || readOnly}
          value={i.explanation}
          error={
            this.explanationRequiredIfQuantityAboveThreshold &&
              type === "service" &&
              !i.explanation &&
              i.qtyProvided > this.quantityExplanationThreshold
              ? formatMessageWithValues(this.props.intl, "claim", "ClaimChildPanel.review.explanationRequired", {
                threshold: this.quantityExplanationThreshold,
              })
              : null
          }
          onChange={(v) => this._onChange(idx, "explanation", v)}
          inputProps={{ "data-cy": `claim-${this.props.type}-${idx}-explanation` }}
        />
      ),
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
              value={u.qtyDisplayed ? u.qtyDisplayed : "0"}
              onChange={(v) => {
                u.qtyDisplayed = v;
                u.qtyAsked = v;
                if (!i.service.manualPrice) {
                  if (i.service.packagetype == SERVICE_TYPE_PP_F) {
                    if (u.qtyProvided < v) {
                      alert(formatMessageWithValues(intl, "claim", "edit.services.MaxApproved", {
                        totalApproved: u.qtyProvided,
                      }));
                    }
                  } else if (i.service.packagetype == SERVICE_TYPE_PP_P) {
                    if (u.qtyProvided != v) {
                      alert(formatMessageWithValues(intl, "claim", "edit.services.MaxApproved", {
                        totalApproved: u.qtyProvided,
                      }));
                    }
                  }
                }
                this._onChangeSubItem(idx, udx, "servicesQty", v);
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
                <TextInput readOnly={true} value={u.item.code} />
              </TableCell>
              <TableCell>
                <Box minWidth={400}>
                  <TextInput readOnly={!!forReview || readOnly || true} value={u.item.name} />
                </Box>
              </TableCell>
              <TableCell>
                <NumberInput
                  readOnly={!!forReview || readOnly}
                  value={u.qtyAdjusted !== null ? (u.qtyAdjusted === 0 ? "0" : u.qtyAdjusted) : u.qtyDisplayed}
                  onChange={(v) => {
                    if (!i.service.manualPrice) {
                      if (i.service.packagetype == SERVICE_TYPE_PP_F) {
                        if (u.qtyProvided < v) {
                          alert(
                            formatMessageWithValues(intl, "claim", "edit.services.MaxApproved", {
                              totalApproved: u.qtyProvided,
                            }),
                          );
                        }
                        u.qtyAdjusted = v;
                        u.qtyApproved = v;
                      } else if (i.service.packagetype == SERVICE_TYPE_PP_P) {
                        if (v == u.qtyProvided) {
                          u.qtyApproved = u.qtyProvided;
                          u.qtyAdjusted = u.qtyProvided;
                        } else {
                          u.qtyAdjusted = v;
                          u.qtyApproved = 0;
                        }
                      }
                    } else {
                      u.qtyAdjusted = v;
                      u.qtyApproved = v;
                    }
                    this._onChangeSubItem(idx, udx, "servicesQty", v);
                  }}
                />
              </TableCell>
              <TableCell>
                <AmountInput readOnly={true} value={u.priceAsked} />
              </TableCell>
            </tr>
          );
        })
      )
    ];

    let subServicesItemsFormattersReview = [
      (i, idx) => (i.services.map((u, udx) => (
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
              readOnly={readOnly}
              value={u.qtyAdjusted !== null ? u.qtyAdjusted === 0 ? "0" : u.qtyAdjusted : u.qtyDisplayed}
              onChange={(v) => {
                if (!i.service.manualPrice) {
                  if (i.service.packagetype == SERVICE_TYPE_PP_F) {
                    if (u.qtyProvided < v) {
                      alert(formatMessageWithValues(intl, "claim", "edit.services.MaxApproved", {
                        totalApproved: u.qtyProvided,
                      }));
                    }
                    u.qtyAdjusted = v;
                    u.qtyApproved = v;
                  } else if (i.service.packagetype == SERVICE_TYPE_PP_P) {
                    if (v == u.qtyProvided) {
                      u.qtyApproved = u.qtyProvided;
                      u.qtyAdjusted = u.qtyProvided;
                    } else {
                      u.qtyAdjusted = v;
                      u.qtyApproved = 0;
                    }
                  }
                } else {
                  u.qtyAdjusted = v;
                  u.qtyApproved = v;
                }
                this._onChangeSubItem(idx, udx, "servicesQty", v);
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
      (i, idx) => (i.items.map((u, udx) => {
        return (
          <tr>
            <TableCell>
              <TextInput readOnly={true} value={u.service.code} />
            </TableCell>
            <TableCell>
              <Box minWidth={400}>
                <TextInput readOnly={!!forReview || readOnly || true} value={u.service.name} />
              </Box>
            </TableCell>
            <TableCell>
              <NumberInput
                readOnly={readOnly}
                value={u.qtyAdjusted !== null ? u.qtyAdjusted === 0 ? "0" : u.qtyAdjusted : u.qtyDisplayed}
                onChange={(v) => {
                  if (!i.service.manualPrice) {
                    if (i.service.packagetype == SERVICE_TYPE_PP_F) {
                      if (u.qtyProvided < v) {
                        alert(
                          formatMessageWithValues(intl, "claim", "edit.services.MaxApproved", {
                            totalApproved: u.qtyProvided,
                          }),
                        );
                      }
                      u.qtyAdjusted = v;
                      u.qtyApproved = v;
                    } else if (i.service.packagetype == SERVICE_TYPE_PP_P) {
                      if (v == u.qtyProvided) {
                        // TODO(vite-migration): this needs review
                        u.qtyDisplayed = u.qtyProvided;
                        u.qtyAsked = u.qtyProvided;
                        u.qtyApproved = u.qtyProvided;
                        u.qtyAdjusted = u.qtyProvided;
                      } else {
                        u.qtyAdjusted = v;
                        u.qtyApproved = 0;
                      }
                    }
                  } else {
                    // TODO(vite-migration): this needs review
                    u.qtyDisplayed = v;
                    u.qtyAsked = v;
                    u.qtyAdjusted = v;
                    u.qtyApproved = v;
                  }
                  this._onChangeSubItem(idx, udx, "servicesQty", v);
                }}
              />
            </TableCell>
            <TableCell>
              <AmountInput readOnly={true} value={u.priceAsked} />
            </TableCell>
          </tr>
      )})),
      (i, idx) =>
        i.items.map((u, udx) => {
          return (
            <tr>
              <TableCell>
                <TextInput readOnly={true} value={u.item.code} />
              </TableCell>
              <TableCell>
                <Box minWidth={400}>
                  <TextInput readOnly={!!forReview || readOnly || true} value={u.item.name} />
                </Box>
              </TableCell>
              <TableCell>
                <NumberInput
                  readOnly={readOnly}
                  value={u.qtyDisplayed ? u.qtyDisplayed : "0"}
                  onChange={(v) => {
                    if (!i.service.manualPrice) {
                      if (i.service.packagetype == SERVICE_TYPE_PP_F) {
                        if (u.qtyProvided < v) {
                          alert(
                            formatMessageWithValues(intl, "claim", "edit.services.MaxApproved", {
                              totalApproved: u.qtyProvided,
                            }),
                          );
                        }
                        u.qtyDisplayed = v;
                        u.qtyAsked = v;
                      } else if (i.service.packagetype == SERVICE_TYPE_PP_P) {
                        if (v == u.qtyProvided) {
                          u.qtyAsked = u.qtyProvided;
                          u.qtyDisplayed = u.qtyProvided;
                        } else {
                          u.qtyDisplayed = v;
                          u.qtyAsked = 0;
                        }
                      }
                    } else {
                      u.qtyDisplayed = v;
                      u.qtyAsked = v;
                    }
                    this._onChangeSubItem(idx, udx, "servicesQty", v);
                  }}
                />
              </TableCell>
              <TableCell>
                <AmountInput readOnly={true} value={u.priceAsked} />
              </TableCell>
            </tr>
          );
        }),
    ];

    if (!!forReview || edited.status !== 2) {
      headers.push(`edit.${type}s.appQuantity`);
      itemFormatters.push((i, idx) => (
        <NumberInput
          readOnly={!forReview && readOnly}
          value={i.qtyApproved}
          max={parseInt(i.qtyProvided)}
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
      headers.push(`edit.${type}s.status`, `edit.${type}s.rejectionReason`);
      itemFormatters.push(
        (i, idx) => (
          <PublishedComponent
            readOnly={!i.product?.uuid}
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
      <StyledPaper className="paper">
        <TableService
          module="claim"
          header={header}
          extendHeader={this.extendHeader}
          headers={headers}
          itemFormatters={itemFormatters}
          subServicesItemsFormatters={!!forReview ? subServicesItemsFormattersReview : subServicesItemsFormatters}
          items={!fetchingPricelist ? this.state.data : []}
          onDelete={!forReview && !readOnly && this._onDelete}
          subServicesItemsFormattersReview={subServicesItemsFormattersReview}
          subServiceHeaders={subServiceHeaders}
          disableDeleteOnEmptyRow
          showOrdinalNumber={this.showOrdinalNumber}
        />
      </StyledPaper>
    );
  }
}

const mapStateToProps = (state, props) => ({
  fetchingPricelist: !!state.medical_pricelist && state.medical_pricelist.fetchingPricelist,
  servicesPricelists: !!state.medical_pricelist ? state.medical_pricelist.servicesPricelists : {},
  itemsPricelists: !!state.medical_pricelist ? state.medical_pricelist.itemsPricelists : {},
});

export { StyledPaper };
export default withModulesManager(injectIntl(connect(mapStateToProps)(ClaimChildPanel)));
