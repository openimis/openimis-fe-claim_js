import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { injectIntl } from 'react-intl';
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
    formatAmount, formatMessage, formatMessageWithValues, NumberInput, Table,
    PublishedComponent, AmountInput, TextInput, decodeId, withModulesManager
} from "@openimis/fe-core";
import { IconButton, Paper } from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import _ from "lodash";
import { claimedAmount, approvedAmount } from "../helpers/amounts";

const styles = theme => ({
    paper: theme.paper.paper,
});

class ClaimChildPanel extends Component {

    state = {
        data: []
    }

    constructor(props) {
        super(props);
        this.fixedPricesAtEnter = props.modulesManager.getConf("fe-claim", "claimForm.fixedPricesAtEnter", false);
        this.fixedPricesAtReview = props.modulesManager.getConf("fe-claim", "claimForm.fixedPricesAtReview", false);
        this.showJustificationAtEnter = props.modulesManager.getConf("fe-claim", "claimForm.showJustificationAtEnter", false);
    }

    initData = () => {
        let data = [];
        if (!!this.props.edited[`${this.props.type}s`]) {
            data = this.props.edited[`${this.props.type}s`] || []
        }
        if (!this.props.forReview && this.props.edited.status == 2 && !_.isEqual(data[data.length - 1], {})) {
            data.push({});
        }
        return data;
    }

    componentDidMount() {
        this.setState({ data: this.initData() });
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.edited_id && !this.props.edited_id) {
            let data = [];
            if (!this.props.forReview) {
                data.push({});
            }
            this.setState({ data });
        } else if (prevProps.reset !== this.props.reset ||
            (!!this.props.edited[`${this.props.type}s`] &&
                !_.isEqual(prevProps.edited[`${this.props.type}s`], this.props.edited[`${this.props.type}s`])
            )) {
            this.setState({
                data: this.initData()
            })
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

    _onEditedChanged = data => {
        let edited = { ...this.props.edited }
        edited[`${this.props.type}s`] = data;
        this.props.onEditedChanged(edited);
    }

    _onChange = (idx, attr, v) => {
        let data = this._updateData(idx, attr, v);
        this._onEditedChanged(data);
    }

    _price = (v) => {
        let id = decodeId(v.id);
        if (this.props.pricelist[`${this.props.type}s`] &&
            this.props.pricelist[`${this.props.type}s`][id]) {
            return this.props.pricelist[`${this.props.type}s`][id]
        }
        return v.price;
    }
    _onChangeItem = (idx, attr, v) => {
        let data = this._updateData(idx, attr, v);
        if (!v) {
            data[idx].priceAsked = null;
            data[idx].qtyProvided = null
        } else {
            data[idx].priceAsked = this._price(v);
            if (!data[idx].qtyProvided) {
                data[idx].qtyProvided = 1;
            }
        }
        this._onEditedChanged(data);
    }

    _onDelete = idx => {
        const data = [...this.state.data];
        data.splice(idx, 1);
        this._onEditedChanged(data);
    }

    formatRejectedReason = (i, idx) => {
        if (i.status === 1) return null;
        return <PublishedComponent
            readOnly={true}
            id="claim.RejectionReasonPicker"
            withLabel={false}
            value={i.rejectionReason || null}
            compact={true}
            onChange={v => this._onChange(idx, 'rejectionReason', v)}
        />
    }

    _onChangeApproval = (idx, attr, v) => {
        let data = this._updateData(idx, attr, v);
        if (v === 2) {
            data = this._updateData(idx, 'rejectionReason', -1);
        } else {
            data = this._updateData(idx, 'rejectionReason', null);
        }
        this._onEditedChanged(data);
    }

    render() {
        const { intl, classes, edited, type, picker, forReview, fetchingPricelist, readOnly = false } = this.props;
        if (!edited) return null;
        const totalClaimed = _.round(this.state.data.reduce(
            (sum, r) => sum + claimedAmount(r), 0),
            2
        );
        const totalApproved = _.round(this.state.data.reduce(
            (sum, r) => sum + approvedAmount(r), 0),
            2
        );
        let preHeaders = [
            '\u200b', '',
            totalClaimed > 0 ? formatMessageWithValues(
                intl, "claim", `edit.${type}s.totalClaimed`,
                { totalClaimed: formatAmount(intl, totalClaimed) }) : '',
            ''];
        let headers = [
            `edit.${type}s.${type}`,
            `edit.${type}s.quantity`,
            `edit.${type}s.price`,
            `edit.${type}s.explanation`,
        ];

        let itemFormatters = [
            (i, idx) => <PublishedComponent
                readOnly={!!forReview || readOnly}
                id={picker} withLabel={false} value={i[type]}
                refDate={edited.dateClaimed}
                onChange={v => this._onChangeItem(idx, type, v)}
            />,
            (i, idx) => <NumberInput
                readOnly={!!forReview || readOnly}
                value={i.qtyProvided}
                onChange={v => this._onChange(idx, "qtyProvided", v)}
            />,
            (i, idx) => <AmountInput
                readOnly={!!forReview || readOnly || this.fixedPricesAtEnter}
                value={i.priceAsked}
                onChange={v => this._onChange(idx, "priceAsked", v)}
            />,
            (i, idx) => <TextInput
                readOnly={!!forReview || readOnly}
                value={i.explanation}
                onChange={v => this._onChange(idx, "explanation", v)}
            />,
        ];
        if (!!forReview || edited.status !== 2) {
            if (!this.fixedPricesAtReview) {
                preHeaders.push('');
            }
            preHeaders.push(
                totalClaimed > 0 ? formatMessageWithValues(
                    intl, "claim", `edit.${type}s.totalApproved`,
                    { totalApproved: formatAmount(intl, totalApproved) }) : '',
            );
            headers.push(
                `edit.${type}s.appQuantity`,
            );
            itemFormatters.push(
                (i, idx) => <NumberInput
                    readOnly={readOnly}
                    value={i.qtyApproved}
                    onChange={v => this._onChange(idx, "qtyApproved", v)}
                />)
            if (!this.fixedPricesAtReview) {
                headers.push(
                    `edit.${type}s.appPrice`,
                );
                itemFormatters.push(
                    (i, idx) => <AmountInput
                        readOnly={readOnly}
                        value={i.priceApproved}
                        onChange={v => this._onChange(idx, "priceApproved", v)}
                    />,
                );
            }
        }

        if (this.showJustificationAtEnter || edited.status !== 2) {
            preHeaders.push('');
            headers.push(`edit.${type}s.justification`);
            itemFormatters.push(
                (i, idx) => <TextInput readOnly={readOnly} value={i.justification} onChange={v => this._onChange(idx, "justification", v)} />
            );
        }
        if (!!forReview || edited.status !== 2) {
            preHeaders.push('', '');
            headers.push(
                `edit.${type}s.status`,
                `edit.${type}s.rejectionReason`,
            );
            itemFormatters.push(
                (i, idx) => <PublishedComponent
                    readOnly={readOnly}
                    id="claim.ApprovalStatusPicker"
                    withNull={false}
                    withLabel={false}
                    value={i.status}
                    onChange={v => this._onChangeApproval(idx, 'status', v)}
                />,
                (i, idx) => this.formatRejectedReason(i, idx),
            );
        }
        if (!forReview) {
            preHeaders.push('');
            headers.push(`edit.${type}s.delete`);
            itemFormatters.push(
                (i, idx) => idx === this.state.data.length - 1 || readOnly ?
                    null :
                    <IconButton onClick={e => this._onDelete(idx)}><DeleteIcon /></IconButton>
            );
        }
        let header = formatMessage(intl, "claim", `edit.${this.props.type}s.title`)
        if (fetchingPricelist) {
            header += formatMessage(intl, "claim", `edit.${this.props.type}s.fetchingPricelist`)
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
                />
            </Paper>
        )
    }
}

const mapStateToProps = (state, props) => ({
    fetchingPricelist: !!state.medical_pricelist && state.medical_pricelist.fetchingPricelist,
    pricelist: !!state.medical_pricelist &&
        state.medical_pricelist.pricelist ? state.medical_pricelist.pricelist : {},
});

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps)(ClaimChildPanel)))));