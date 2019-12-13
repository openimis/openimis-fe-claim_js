import React, { Component, Fragment } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from 'react-intl';
import _ from "lodash";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
    IconButton,
} from "@material-ui/core";
import AttachIcon from "@material-ui/icons/AttachFile";
import { Searcher } from "@openimis/fe-core";
import ClaimFilter from "./ClaimFilter";
import {
    withModulesManager, formatMessageWithValues,
    formatMessage, formatDateFromISO, formatAmount,
    FormattedMessage, PublishedComponent
} from "@openimis/fe-core";
import { fetchClaimSummaries } from "../actions";

const CLAIM_SEARCHER_CONTRIBUTION_KEY = "claim.Searcher";

const styles = theme => ({
})

class ClaimSearcher extends Component {

    state = {
        random: null,
        attachmentsClaim: null,
    }

    constructor(props) {
        super(props);
        this.rowsPerPageOptions = props.modulesManager.getConf("fe-claim", "claimFilter.rowsPerPageOptions", [10, 20, 50, 100]);
        this.defaultPageSize = props.modulesManager.getConf("fe-claim", "claimFilter.defaultPageSize", 10);
        this.highlightAmount = parseInt(props.modulesManager.getConf("fe-claim", "claimFilter.highlightAmount", 0));
        this.highlightAltInsurees = props.modulesManager.getConf("fe-claim", "claimFilter.highlightAltInsurees", true);
        this.claimAttachments = props.modulesManager.getConf("fe-claim", "claimAttachments", true);
    }

    canSelectAll = (selection) => this.props.claims.map(s => s.id).filter(s => !selection.map(s => s.id).includes(s)).length

    fetch = (prms) => {
        this.props.fetchClaimSummaries(
            this.props.modulesManager,
            prms,
            !!this.claimAttachments
        )
    }

    rowIdentifier = (r) => r.uuid

    forcedFilters() {
        return !this.props.forcedFilters ? [] : [...this.props.forcedFilters.filter(f => !f.id === 'random')];
    }

    filtersToQueryParams = (state) => {
        let prms = Object.keys(state.filters)
            .filter(f => !!state.filters[f]['filter'])
            .map(f => state.filters[f]['filter']);
        let forced = this.forcedFilters();
        let random = state.filters['random'];
        if (forced.length > 0) {
            prms.push(...forced.map(f => f.filter));
        }
        if (!!random) {
            prms.push(`first: ${random.value}`);
            prms.push(`orderBy: ["dateClaimed", "?"]`);
            this.setState({ random })
        } else {
            prms.push(`orderBy: ["${state.orderBy}"]`);
            this.setState({ random: null })
        }
        if (!forced.length && !random) {
            prms.push(`first: ${state.pageSize}`);
            if (!!state.afterCursor) {
                prms.push(`after: "${state.afterCursor}"`)
            }
            if (!!state.beforeCursor) {
                prms.push(`before: "${state.beforeCursor}"`)
            }
        }
        return prms;
    }

    feedbackColFormatter = c =>
        !!this.props.feedbackColFormatter ?
            this.props.feedbackColFormatter(c) :
            formatMessage(this.props.intl, "claim", `feedbackStatus.${c.feedbackStatus}`)
    reviewColFormatter = c =>
        !!this.props.reviewColFormatter ?
            this.props.reviewColFormatter(c) :
            formatMessage(this.props.intl, "claim", `reviewStatus.${c.reviewStatus}`)

    preHeaders = (selection) => {
        var result = selection.length ?
            [
                '', '', '', '', '', '',
                <FormattedMessage
                    module="claim"
                    id="claimSummaries.selection.claimed"
                    values={{
                        claimed: <b>{formatAmount(this.props.intl, selection.reduce((t, v) => t + v.claimed, 0))}</b>,
                    }}
                />,
                <FormattedMessage
                    module="claim"
                    id="claimSummaries.selection.approved"
                    values={{
                        approved: <b>{formatAmount(this.props.intl, selection.reduce((t, v) => t + v.approved, 0))}</b>,
                    }}
                />,
                , ''
            ]
            : ['\u200b', '', '', '', '', '', '', '', ''] //fixing pre headers row height!
        if (this.claimAttachments) {
            result.push('')
        }
        return result;
    }

    headers = () => {
        var result = [
            "claimSummaries.code",
            "claimSummaries.healthFacility",
            "claimSummaries.insuree",
            "claimSummaries.claimedDate",
            "claimSummaries.feedbackStatus",
            "claimSummaries.reviewStatus",
            "claimSummaries.claimed",
            "claimSummaries.approved",
            "claimSummaries.claimStatus"
        ];
        if (this.claimAttachments) {
            result.push("claimSummaries.claimAttachments")
        }
        return result;
    }

    sorts = () => {
        var result = [
            ['code', true],
            ['healthFacility__code', true],
            ['insuree__last_name', true],
            ['dateClaimed', false],
            null,
            null,
            ['claimed', false],
            ['approved', false],
        ]
        if (this.claimAttachments) {
            result.push(
                null
            )
        }
        return result;
    }

    aligns = () => {
        return [, , , , , , "right", "right"]
    }

    itemFormatters = () => {
        var result = [
            c => c.code,
            c => <PublishedComponent
                readOnly={true}
                id="location.HealthFacilityPicker" withLabel={false} value={c.healthFacility}
            />,
            c => <PublishedComponent
                readOnly={true}
                id="insuree.InsureePicker" withLabel={false} value={c.insuree}
            />,
            c => formatDateFromISO(this.props.modulesManager, this.props.intl, c.dateClaimed),
            c => this.feedbackColFormatter(c),
            c => this.reviewColFormatter(c),
            c => formatAmount(this.props.intl, c.claimed),
            c => formatAmount(this.props.intl, c.approved),
            c => formatMessage(this.props.intl, "claim", `claimStatus.${c.status}`)
        ]
        if (this.claimAttachments) {
            result.push(
                c => !!c.attachmentsCount && (
                    <IconButton onClick={e => this.setState({ attachmentsClaim: c })} > <AttachIcon /></IconButton >
                )
            )
        }
        return result;
    }
    rowLocked = (selection, claim) => !!claim.clientMutationId
    rowHighlighted = (selection, claim) => !!this.highlightAmount && claim.claimed > this.highlightAmount
    rowHighlightedAlt = (selection, claim) => !!this.highlightAltInsurees &&
        selection.filter(c => _.isEqual(c.insuree, claim.insuree)).length &&
        !selection.includes(claim)


    render() {
        const { intl,
            claims, claimsPageInfo, fetchingClaims, fetchedClaims, errorClaims,
            FilterExt, actions, defaultFilters, onDoubleClick
        } = this.props;

        let count = !!this.state.random && this.state.random.value
        if (!count) {
            count = claimsPageInfo.totalCount;
        }

        return (
            <Fragment>
                <PublishedComponent id="claim.AttachmentsDialog"
                    readOnly={true}
                    claim={this.state.attachmentsClaim}
                    close={e => this.setState({ attachmentsClaim: null })} />
                <Searcher
                    module="claim"
                    canSelectAll={this.canSelectAll}
                    defaultFilters={defaultFilters}
                    FilterPane={ClaimFilter}
                    FilterExt={FilterExt}
                    items={claims}
                    itemsPageInfo={claimsPageInfo}
                    fetchingItems={fetchingClaims}
                    fetchedItems={fetchedClaims}
                    errorItems={errorClaims}
                    contributionKey={CLAIM_SEARCHER_CONTRIBUTION_KEY}
                    tableTitle={formatMessageWithValues(intl, "claim", "claimSummaries", { count })}
                    rowsPerPageOptions={this.rowsPerPageOptions}
                    defaultPageSize={this.defaultPageSize}
                    fetch={this.fetch}
                    rowIdentifier={this.rowIdentifier}
                    filtersToQueryParams={this.filtersToQueryParams}
                    defaultOrderBy="-dateClaimed"
                    rowLocked={this.rowLocked}
                    rowHighlighted={this.rowHighlighted}
                    rowHighlightedAlt={this.rowHighlightedAlt}
                    selectionMessage={"claimSummaries.selection.count"}
                    preHeaders={this.preHeaders}
                    headers={this.headers}
                    itemFormatters={this.itemFormatters}
                    headerActions={this.headerActions}
                    actions={actions}
                    aligns={this.aligns}
                    sorts={this.sorts}
                    onDoubleClick={onDoubleClick}
                />
            </Fragment>
        )
    }
}

const mapStateToProps = state => ({
    claims: state.claim.claims,
    claimsPageInfo: state.claim.claimsPageInfo,
    fetchingClaims: state.claim.fetchingClaims,
    fetchedClaims: state.claim.fetchedClaims,
    errorClaims: state.claim.errorClaims,
});


const mapDispatchToProps = dispatch => {
    return bindActionCreators(
        { fetchClaimSummaries },
        dispatch);
};

export default withModulesManager(connect(mapStateToProps, mapDispatchToProps)(
    injectIntl(withTheme(
        withStyles(styles)(ClaimSearcher)
    ))));
