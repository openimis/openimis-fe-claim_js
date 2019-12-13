import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from 'react-intl';
import { Grid, InputAdornment, IconButton, Tooltip } from "@material-ui/core";
import FilterIcon from "@material-ui/icons/FilterList";
import FeedbackIcon from "@material-ui/icons/SpeakerNotesOutlined";
import ReviewIcon from "@material-ui/icons/SupervisorAccount";
import {
    formatMessage, formatMessageWithValues, AmountInput, NumberInput,
    withHistory, historyPush, withModulesManager, PublishedComponent,
    journalize, coreAlert
} from "@openimis/fe-core";
import ClaimSearcher from "../components/ClaimSearcher";
import {
    selectHealthFacility,
    selectForFeedback, bypassFeedback, skipFeedback,
    selectForReview, bypassReview, skipReview,
    process
} from "../actions";
import { RIGHT_UPDATE, RIGHT_FEEDBACK, RIGHT_CLAIMREVIEW, RIGHT_PROCESS } from "../constants";
import { withTheme, withStyles } from "@material-ui/core/styles";
import ClaimsSearcherPage from "./ClaimsSearcherPage";

const styles = theme => ({
    page: theme.page,
    item: {
        padding: theme.spacing(1)
    },
    toggledButton: {
        backgroundColor: theme.palette.toggledButton
    }
});

class RawRandomAndValueFilters extends Component {
    state = {
        randomToggled: false,
        random: 0,
        valueToggled: false,
        value: 0,
        variance: 0,
        filters: {},
    }

    componentDidMount() {
        this.setState(this.props.modulesManager.getConf(
            "fe-claim",
            "claim.ReviewsPage.initState",
            { random: 5, value: 0, variance: 10 }
        ));
    }

    randomChange = (v) => {
        let filters = this.state.filters;
        delete (filters.random)
        this.setState({
            random: parseFloat(v),
            filters
        })
    }
    valueChange = (v) => {
        let filters = this.state.filters;
        delete (filters.value)
        this.setState({
            value: parseFloat(v),
            filters
        })
    }
    varianceChange = (v) => {
        let filters = this.state.filters;
        delete (filters.value)
        this.setState({
            variance: parseFloat(v),
            filters
        })
    }
    toggleRandomFilter = (e) => {
        let filters = this.state.filters;
        if (this.state.random > 100 || this.state.random < 1) {
            this.props.coreAlert(
                formatMessage(this.props.intl, "claim", "ClaimFilter.randomFilter.invalidAlert.title"),
                formatMessageWithValues(this.props.intl, "claim", "ClaimFilter.randomFilter.invalidAlert.message", {
                    random: this.state.random
                })
            )
            return;
        }
        let rnd = Math.trunc(this.state.random * this.props.claimsPageInfo.totalCount / 100);
        if (!this.state.randomToggled && !rnd) {
            this.props.coreAlert(
                formatMessage(this.props.intl, "claim", "ClaimFilter.randomFilter.zeroAlert.title"),
                formatMessageWithValues(this.props.intl, "claim", "ClaimFilter.randomFilter.zeroAlert.message", {
                    random: this.state.random,
                    totalCount: this.props.claimsPageInfo.totalCount
                })
            )
            return;
        }
        if (!this.state.randomToggled) {
            filters.random = [{
                id: 'random',
                value: rnd,
            }]
        } else {
            filters.random = [{
                id: 'random',
                value: null,
            }]
        }
        this.setState(
            {
                filters,
                randomToggled: !this.state.randomToggled,
            },
            e => this.props.onChangeFilters(Object.values(this.state.filters).flat())
        )
    }
    toggleValueFilter = (e) => {
        let filters = this.state.filters;
        if (!!this.state.valueToggled) {
            filters.value = [
                { id: 'value', value: null },
                {
                    id: 'claimedAbove',
                    value: null,
                }, {
                    id: 'claimedUnder',
                    value: null
                }
            ];
        } else {
            let min = this.state.value;
            let max = this.state.value;
            if (this.state.variance !== 0) {
                min = min - min * this.state.variance / 100;
                max = max + max * this.state.variance / 100;
            }
            filters.value = [
                { id: 'value', value: this.state.value },
                {
                    id: 'claimedAbove',
                    value: min,
                    filter: `claimed_Gte: ${min}`
                }, {
                    id: 'claimedUnder',
                    value: max,
                    filter: `claimed_Lte: ${max}`
                }]
        }
        this.setState(
            {
                filters,
                valueToggled: !this.state.valueToggled,
            },
            e => this.props.onChangeFilters(Object.values(this.state.filters).flat())
        )
    }
    render() {
        const { classes } = this.props;
        let random = !!this.state.filters['random'] && !!this.state.filters['random'][0].value
        return (
            <Grid container justify="center" alignItems="center" direction="row">
                <Grid item xs={3} className={classes.item}>
                    <NumberInput
                        module="claim" label="ClaimFilter.Reviews.random"
                        name="random"
                        value={this.state.random}
                        onChange={this.randomChange}
                        startAdornment={<InputAdornment position="start">%</InputAdornment>}
                        endAdornment={
                            <InputAdornment position="end">
                                <IconButton
                                    className={!!this.state.randomToggled ? classes.toggledButton : null}
                                    onClick={this.toggleRandomFilter}
                                    edge="end">
                                    <FilterIcon />
                                </IconButton>
                            </InputAdornment>
                        }
                        inputProps={{
                            step: 10,
                            min: 0,
                            max: 100,
                            type: "number",
                        }}
                    />
                </Grid>
                <Grid item xs={2} className={classes.item} />
                <Grid item xs={3} className={classes.item}>
                    <Grid container diretcion="row">
                        <Grid item xs={6}>
                            <AmountInput
                                module="claim" label="ClaimFilter.Reviews.value"
                                value={this.state.value}
                                onChange={this.valueChange}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <NumberInput
                                module="claim" label="ClaimFilter.Reviews.variance"
                                value={this.state.variance}
                                onChange={this.varianceChange}
                                startAdornment={
                                    <InputAdornment position="start">%</InputAdornment>
                                }
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            className={!!this.state.valueToggled ? classes.toggledButton : null}
                                            onClick={this.toggleValueFilter}
                                            edge="end">
                                            <FilterIcon />
                                        </IconButton>
                                    </InputAdornment>
                                }
                                inputProps={{
                                    step: 10,
                                    min: 0,
                                    max: 100,
                                    type: "number",
                                }}
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        )
    }
}

const mapStateToFixFilterProps = state => ({
    claimsPageInfo: state.claim.claimsPageInfo,
});

const mapDispatchToFixFilterProps = dispatch => {
    return bindActionCreators(
        {
            coreAlert,
        },
        dispatch);
};

const RandomAndValueFilters = withModulesManager(injectIntl(withTheme(withStyles(styles)
    (connect(mapStateToFixFilterProps, mapDispatchToFixFilterProps)(RawRandomAndValueFilters))
)));

class ReviewsPage extends ClaimsSearcherPage {

    state = {
        filtersExt: [],
    }

    constructor(props) {
        super(props);
        this.state = {
            defaultFilters: props.modulesManager.getConf(
                "fe-claim",
                "reviews.defaultFilters",
                {
                    "claimStatus": {
                        "value": 4,
                        "filter": "status: 4"
                    }
                }
            )
        }
    }

    _labelMutation = (selection, labelOne, labelMultiple, action) => {
        if (selection.length === 1) {
            action(selection,
                formatMessageWithValues(
                    this.props.intl,
                    "claim",
                    labelOne,
                    { code: selection[0].code }
                ));
        } else {
            action(selection,
                formatMessageWithValues(
                    this.props.intl,
                    "claim",
                    labelMultiple,
                    { count: selection.length }
                ),
                selection.map(c => c.code)
            );
        }
    }

    canMarkSelectedForFeedback = selection => !!selection && selection.length &&
        selection.filter(s => s.feedbackStatus <= 2).length === selection.length &&
        selection.filter(s => s.status === 4).length === selection.length

    markSelectedForFeedback = selection => {
        this._labelMutation(selection,
            "SelectClaimForFeedback.mutationLabel",
            "SelectClaimsForFeedback.mutationLabel",
            this.props.selectForFeedback);
    }

    canMarkBypassedFeedback = selection => !!selection && selection.length &&
        selection.filter(s => s.feedbackStatus === 4).length === selection.length &&
        selection.filter(s => s.status === 4).length === selection.length

    markBypassedFeedback = selection => {
        this._labelMutation(selection,
            "BypassClaimFeedback.mutationLabel",
            "BypassClaimsFeedback.mutationLabel",
            this.props.bypassFeedback);
    }

    canMarkSkippedFeedback = selection => !!selection && selection.length &&
        selection.filter(s => s.status === 4).length === selection.length

    markSkippedFeedback = selection => {
        this._labelMutation(selection,
            "SkipClaimFeedback.mutationLabel",
            "SkipClaimsFeedback.mutationLabel",
            this.props.skipFeedback);
    }

    canMarkSelectedForReview = selection => !!selection && selection.length &&
        selection.filter(s => s.reviewStatus <= 2).length === selection.length &&
        selection.filter(s => s.status === 4).length === selection.length

    markSelectedForReview = selection => {
        this._labelMutation(selection,
            "SelectClaimForReview.mutationLabel",
            "SelectClaimsForReview.mutationLabel",
            this.props.selectForReview);
    }

    canMarkBypassedReview = selection => !!selection && selection.length &&
        selection.filter(s => s.reviewStatus === 4).length === selection.length &&
        selection.filter(s => s.status === 4).length === selection.length

    markBypassedReview = selection => {
        this._labelMutation(selection,
            "BypassClaimReview.mutationLabel",
            "BypassClaimsReview.mutationLabel",
            this.props.bypassReview);
    }

    canMarkSkippedReview = selection => !!selection && selection.length &&
        selection.filter(s => s.status === 4).length === selection.length

    markSkippedReview = selection => {
        this._labelMutation(selection,
            "SkipClaimReview.mutationLabel",
            "SkipClaimsReview.mutationLabel",
            this.props.skipReview);
    }

    canProcessSelected = selection => !!selection && selection.length && selection.filter(s => s.status === 4).length === selection.length

    processSelected = selection => {
        this._labelMutation(selection,
            "ProcessClaim.mutationLabel",
            "ProcessClaims.mutationLabel",
            this.props.process);
    }

    onChangeFeedbackStatus = (c, v) => {
        c.feedbackStatus = v;
        switch (v) {
            case 2:
                this.props.skipFeedback([c],
                    formatMessageWithValues(
                        this.props.intl,
                        "claim",
                        "SkipClaimFeedback.mutationLabel",
                        { code: c.code }
                    ));
                break;
            case 4:
                this.props.selectForFeedback([c],
                    formatMessageWithValues(
                        this.props.intl,
                        "claim",
                        "SelectClaimForFeedback.mutationLabel",
                        { code: c.code }
                    ));
                break;
            case 16:
                this.props.bypassFeedback([c],
                    formatMessageWithValues(
                        this.props.intl,
                        "claim",
                        "BypassClaimFeedback.mutationLabel",
                        { code: c.code }
                    ));
                break;
            default: console.log('Illegal new Feedback Status ' + v); // TODO: handle error
        }
    }
    provideFeedback = c => historyPush(this.props.modulesManager, this.props.history, "claim.route.feedback", [c.uuid])

    feedbackColFormatter = c => (
        <Grid container justify="flex-end" alignItems="center">
            <Grid item>
                <PublishedComponent
                    id="claim.FeedbackStatusPicker"
                    withLabel={false}
                    name="feedbackStatus"
                    withNull={false}
                    filtered={[1, 8]}
                    value={c.feedbackStatus}
                    readOnly={!this.props.rights.includes(RIGHT_UPDATE) || c.status !== 4}
                    onChange={(v, s) => this.onChangeFeedbackStatus(c, v)}
                />
            </Grid>
            {!!this.props.rights.includes(RIGHT_FEEDBACK) &&
                <Grid item>
                    <Tooltip title={formatMessage(this.props.intl, "claim", "feedbackButton.tooltip")}>
                        <IconButton onClick={e => this.provideFeedback(c)}><FeedbackIcon /></IconButton>
                    </Tooltip>
                </Grid>
            }
        </Grid>
    )

    onChangeReviewStatus = (c, v) => {
        c.reviewStatus = v;
        switch (v) {
            case 2:
                this.props.skipReview([c],
                    formatMessageWithValues(
                        this.props.intl,
                        "claim",
                        "SkipClaimReview.mutationLabel",
                        { code: c.code }
                    ));
                break;
            case 4:
                this.props.selectForReview([c],
                    formatMessageWithValues(
                        this.props.intl,
                        "claim",
                        "SelectClaimForReview.mutationLabel",
                        { code: c.code }
                    ));
                break;
            case 16:
                this.props.bypassReview([c],
                    formatMessageWithValues(
                        this.props.intl,
                        "claim",
                        "BypassClaimReview.mutationLabel",
                        { code: c.code }
                    ));
                break;
            default: console.log('Illegal new Feedback Status ' + v); // TODO: handle error
        }
    }
    review = c => historyPush(this.props.modulesManager, this.props.history, "claim.route.review", [c.uuid])
    reviewColFormatter = c => (
        <Grid container justify="flex-end" alignItems="center">
            <Grid item>
                <PublishedComponent
                    id="claim.ReviewStatusPicker"
                    withLabel={false}
                    name="reviewStatus"
                    value={c.reviewStatus}
                    withNull={false}
                    filtered={[1, 8]}
                    readOnly={!this.props.rights.includes(RIGHT_UPDATE) || c.status !== 4}
                    onChange={(v, s) => this.onChangeReviewStatus(c, v)}
                />
            </Grid>
            {!!this.props.rights.includes(RIGHT_CLAIMREVIEW) &&
                <Grid item>
                    <Tooltip title={formatMessage(this.props.intl, "claim", "reviewButton.tooltip")}>
                        <IconButton onClick={e => this.review(c)}><ReviewIcon /></IconButton>
                    </Tooltip>
                </Grid>
            }
        </Grid>
    )

    onDoubleClick = (c) => {
        this.review(c)
    }

    render() {
        const { classes, rights } = this.props;
        if (!rights.filter(r => r >= RIGHT_CLAIMREVIEW && r <= RIGHT_PROCESS).length) return null;
        let actions = [];
        if (rights.includes(RIGHT_UPDATE)) {
            actions.push(
                { label: "claimSummaries.markSelectedForFeedback", enabled: this.canMarkSelectedForFeedback, action: this.markSelectedForFeedback },
                { label: "claimSummaries.markBypassedFeedback", enabled: this.canMarkBypassedFeedback, action: this.markBypassedFeedback },
                { label: "claimSummaries.markSkippedFeedback", enabled: this.canMarkSkippedFeedback, action: this.markSkippedFeedback },
                { label: "claimSummaries.markSelectedForReview", enabled: this.canMarkSelectedForReview, action: this.markSelectedForReview },
                { label: "claimSummaries.markBypassedReview", enabled: this.canMarkBypassedReview, action: this.markBypassedReview },
                { label: "claimSummaries.markSkippedReview", enabled: this.canMarkSkippedReview, action: this.markSkippedReview },
            )
        }
        if (rights.includes(RIGHT_PROCESS)) {
            actions.push({ label: "claimSummaries.processSelected", enabled: this.canProcessSelected, action: this.processSelected });
        }
        return (
            <div className={classes.page}>
                <ClaimSearcher
                    defaultFilters={this.state.defaultFilters}
                    FilterExt={RandomAndValueFilters}
                    actions={actions}
                    onDoubleClick={rights.includes(RIGHT_UPDATE) ? this.onDoubleClick : null}
                    feedbackColFormatter={this.feedbackColFormatter}
                    reviewColFormatter={this.reviewColFormatter}
                />
            </div>
        );
    }
}

const mapStateToProps = state => ({
    rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
    claimAdmin: state.claim.claimAdmin,
    claimHealthFacility: state.claim.claimHealthFacility,
    userHealthFacilityFullPath: !!state.loc ? state.loc.userHealthFacilityFullPath : null,     
    claimsPageInfo: state.claim.claimsPageInfo,
    //props used from super.componentDidUpdate !!
    submittingMutation: state.claim.submittingMutation,
    mutation: state.claim.mutation,
    //--    
});

const mapDispatchToProps = dispatch => {
    return bindActionCreators(
        {
            selectHealthFacility,
            journalize,
            selectForFeedback,
            bypassFeedback,
            skipFeedback,
            selectForReview,
            bypassReview,
            skipReview,
            process,
        },
        dispatch);
};

export default injectIntl(withHistory(connect(mapStateToProps, mapDispatchToProps)(
    withTheme(withStyles(styles)(ReviewsPage))
)));