import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _debounce from "lodash/debounce";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { injectIntl } from 'react-intl';
import _ from "lodash";
import { Grid, Divider } from "@material-ui/core";
import {
    formatMessage, withModulesManager,
    ControlledField, PublishedComponent,
    TextInput, AmountInput,
} from "@openimis/fe-core";
import { selectClaimAdmin, selectHealthFacility } from "../actions";

const styles = theme => ({
    dialogTitle: theme.dialog.title,
    dialogContent: theme.dialog.content,
    form: {
        padding: 0
    },
    item: {
        padding: theme.spacing(1)
    },
    paperDivider: theme.paper.divider,
});


class Head extends Component {

    state = {
        reset: 0,
    }

    _regionFilter = v => {
        return {
            id: 'region',
            value: v,
            filter: `healthFacility_Location_Parent_Uuid: "${!!v && v.uuid}"`
        }
    }

    _districtFilter = v => {
        return {
            id: 'district',
            value: v,
            filter: `healthFacility_Location_Uuid: "${!!v && v.uuid}"`
        }
    }

    _onChangeRegion = (v, s) => {
        this.props.onChangeFilters([
            this._regionFilter(v),
            {
                id: 'district',
                value: null
            },
            {
                id: 'healthFacility',
                value: null
            },
            {
                id: 'claimAdmin',
                value: null,
                filter: null
            },
            {
                id: 'batchRun',
                value: null
            }
        ]);
        this.setState({
            reset: this.state.reset + 1,
        });
    }

    _onChangeDistrict = (v, s) => {
        let filters = [
            this._districtFilter(v),
            {
                id: 'healthFacility',
                value: null
            },
            {
                id: 'claimAdmin',
                value: null,
                filter: null
            },
            {
                id: 'batchRun',
                value: null
            }
        ];
        if (!!v) {
            filters.push(
                this._regionFilter({
                    id: v.regionId,
                    uuid: v.regionUuid,
                    code: v.regionCode,
                    name: v.regionName
                }))
        }
        this.props.onChangeFilters(filters);
        this.setState({
            reset: this.state.reset + 1,
        });
    }

    _onChangeHealthFacility = (v, s) => {
        this.props.selectHealthFacility(v);
    }

    _onChangeClaimAdmin = (v, s) => {
        this.props.selectClaimAdmin(v);
    }


    render() {
        const { classes, filters, onChangeFilters } = this.props;
        return (
            <Grid container className={classes.form}>
                <ControlledField module="claim" id="ClaimFilter.region" field={
                    <Grid item xs={2} className={classes.item}>
                        <PublishedComponent
                            id="location.RegionPicker"
                            value={(filters['region'] && filters['region']['value'])}
                            onChange={this._onChangeRegion}
                        />
                    </Grid>
                } />
                <ControlledField module="claim" id="ClaimFilter.district" field={
                    <Grid item xs={2} className={classes.item}>
                        <PublishedComponent
                            id="location.DistrictPicker"
                            value={(filters['district'] && filters['district']['value'])}
                            region={(filters['region'] && filters['region']['value'])}
                            reset={this.state.reset}
                            onChange={this._onChangeDistrict}
                        />
                    </Grid>
                } />
                <ControlledField module="claim" id="ClaimFilter.healthFacility" field={
                    <Grid item xs={3} className={classes.item}>
                        <PublishedComponent
                            id="location.HealthFacilityPicker"
                            value={(filters['healthFacility'] && filters['healthFacility']['value'])}
                            region={(filters['region'] && filters['region']['value'])}
                            district={(filters['district'] && filters['district']['value'])}
                            reset={this.state.reset}
                            onChange={this._onChangeHealthFacility}
                        />
                    </Grid>
                } />
                <ControlledField module="claim" id="ClaimFilter.claimAdmin" field={
                    <Grid item xs={2} className={classes.item}>
                        <PublishedComponent
                            id="claim.ClaimAdminPicker"
                            value={(filters['claimAdmin'] && filters['claimAdmin']['value'])}
                            hfFilter={(filters['healthFacility'] && filters['healthFacility']['value'])}
                            onChange={this._onChangeClaimAdmin}
                        />
                    </Grid>
                } />
                <ControlledField module="claim" id="ClaimFilter.batchRun" field={
                    <Grid item xs={3} className={classes.item}>
                        <PublishedComponent
                            id="claim_batch.BatchRunPicker"
                            value={(filters['batchRun'] && filters['batchRun']['value'])}
                            noneLabel={formatMessage(this.props.intl, "claim", "ClaimFilter.BatchRuns.any")}
                            scope={!!filters['district'] && filters['district']['value']}
                            onChange={(v, s) => onChangeFilters([
                                {
                                    id: 'batchRun',
                                    value: v,
                                    filter: `batchRun_Id: "${!!v && v.id}"`
                                }
                            ])}
                        />
                    </Grid>
                } />
            </Grid>
        )
    }
}

const mapDispatchToProps = dispatch => {
    return bindActionCreators({ selectClaimAdmin, selectHealthFacility }, dispatch);
};

const BoundHead = connect(null, mapDispatchToProps)(Head)

class Details extends Component {

    debouncedOnChangeFilter = _debounce(
        this.props.onChangeFilters,
        this.props.modulesManager.getConf("fe-claim", "debounceTime", 800)
    )

    render() {
        const { intl, classes, filters, onChangeFilters, FilterExt } = this.props;
        return (
            <Grid container className={classes.form}>
                <Grid item xs={1} className={classes.item}>
                    <PublishedComponent
                        id="claim.ClaimStatusPicker"
                        name="claimStatus"
                        value={(filters['claimStatus'] && filters['claimStatus']['value'])}
                        onChange={(v, s) => onChangeFilters([
                            {
                                id: 'claimStatus',
                                value: v,
                                filter: `status: ${v}`
                            }
                        ])}
                    />
                </Grid>
                <Grid item xs={1} className={classes.item}>
                    <PublishedComponent
                        id="claim.FeedbackStatusPicker"
                        name="feedbackStatus"
                        value={(filters['feedbackStatus'] && filters['feedbackStatus']['value'])}
                        onChange={(v, s) => onChangeFilters([
                            {
                                id: 'feedbackStatus',
                                value: v,
                                filter: `feedbackStatus: ${v}`
                            }
                        ])}
                    />
                </Grid>
                <Grid item xs={1} className={classes.item}>
                    <PublishedComponent
                        id="claim.ReviewStatusPicker"
                        name="reviewStatus"
                        value={(filters['reviewStatus'] && filters['reviewStatus']['value'])}
                        onChange={(v, s) => onChangeFilters([
                            {
                                id: 'reviewStatus',
                                value: v,
                                filter: `reviewStatus: ${v}`
                            }
                        ])}
                    />
                </Grid>
                <Grid item xs={2} className={classes.item}>
                    <TextInput
                        module="claim" label="ClaimFilter.claimNo"
                        name="claimNo"
                        value={(filters['claimNo'] && filters['claimNo']['value'])}
                        onChange={v => this.debouncedOnChangeFilter([
                            {
                                id: 'claimNo',
                                value: v,
                                filter: `code_Icontains: "${v}"`
                            }
                        ])}
                    />
                </Grid>
                <Grid item xs={3} className={classes.item}>
                    <TextInput
                        module="claim" label="ClaimFilter.insureeCHFID"
                        name="chfId"
                        value={(filters['chfId'] && filters['chfId']['value'])}
                        onChange={v => this.debouncedOnChangeFilter([
                            {
                                id: 'chfId',
                                value: v,
                                filter: `insuree_ChfId: "${v}"`
                            }
                        ])}
                    />
                </Grid>
                <Grid item xs={2} className={classes.item}>
                    <AmountInput
                        module="claim" label="ClaimFilter.claimedAbove"
                        name="claimedAbove"
                        value={(filters['claimedAbove'] && filters['claimedAbove']['value'])}
                        onChange={v => this.debouncedOnChangeFilter([
                            {
                                id: 'claimedAbove',
                                value: (!v ? null : v),
                                filter: `claimed_Gte: ${v}`
                            }
                        ])}
                    />
                </Grid>
                <Grid item xs={2} className={classes.item}>
                    <AmountInput
                        module="claim" label="ClaimFilter.claimedUnder"
                        name="claimedUnder"
                        value={(filters['claimedUnder'] && filters['claimedUnder']['value'])}
                        onChange={v => this.debouncedOnChangeFilter([

                            {
                                id: 'claimedUnder',
                                value: (!v ? null : v),
                                filter: `claimed_Lte: ${v}`
                            }
                        ])}
                    />
                </Grid>
                <Grid item xs={3}>
                    <Grid container>
                        <Grid item xs={6} className={classes.item}>
                            <PublishedComponent id="core.DatePicker"
                                value={(filters['visitDateFrom'] && filters['visitDateFrom']['value']) || null}
                                module="claim"
                                label="visitDateFrom"
                                onChange={d => onChangeFilters([
                                    {
                                        id: 'visitDateFrom',
                                        value: d,
                                        filter: `dateFrom: "${d}"`
                                    }
                                ])}
                            />
                        </Grid>
                        <Grid item xs={6} className={classes.item}>
                            <PublishedComponent id="core.DatePicker"
                                value={(filters['visitDateTo'] && filters['visitDateTo']['value']) || null}
                                module="claim"
                                label="visitDateTo"
                                onChange={d => onChangeFilters([
                                    {
                                        id: 'visitDateTo',
                                        value: d,
                                        filter: `dateTo: "${d}"`
                                    }
                                ])}
                            />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={3}>
                    <Grid container>
                        <Grid item xs={6} className={classes.item}>
                            <PublishedComponent id="core.DatePicker"
                                value={(filters['claimDateFrom'] && filters['claimDateFrom']['value']) || null}
                                module="claim"
                                label="ClaimFilter.claimedDateFrom"
                                onChange={d => onChangeFilters([
                                    {
                                        id: 'claimDateFrom',
                                        value: d,
                                        filter: `dateClaimed_Gte: "${d}"`
                                    }
                                ])}
                            />
                        </Grid>
                        <Grid item xs={6} className={classes.item}>
                            <PublishedComponent id="core.DatePicker"
                                value={(filters['claimDateTo'] && filters['claimDateTo']['value']) || null}
                                module="claim"
                                label="ClaimFilter.claimedDateTo"
                                onChange={d => onChangeFilters([
                                    {
                                        id: 'claimDateTo',
                                        value: d,
                                        filter: `dateClaimed_Lte: "${d}"`
                                    }
                                ])}
                            />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                        id="medical.DiagnosisPicker"
                        name="mainDiagnosis"
                        label={formatMessage(intl, "claim", "mainDiagnosis")}
                        value={(filters['mainDiagnosis'] && filters['mainDiagnosis']['value']) || null}
                        onChange={(v, s) => onChangeFilters([
                            {
                                id: 'mainDiagnosis',
                                value: v,
                                filter: `icd_Id: "${!!v && v.id}"`
                            }
                        ])}
                    />
                </Grid>
                <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                        id="medical.VisitTypePicker"
                        name="visitType"
                        value={(filters['visitType'] && filters['visitType']['value']) || null}
                        onChange={(v, s) => onChangeFilters([
                            {
                                id: 'visitType',
                                value: v,
                                filter: `visitType: "${v}"`
                            }
                        ])}
                    />
                </Grid>
                {!!FilterExt && (
                    <Fragment>
                        <Grid item xs={12} className={classes.paperDivider}>
                            <Divider />
                        </Grid>
                        <Grid item xs={12}>
                            <FilterExt onChangeFilters={onChangeFilters} />
                        </Grid>
                    </Fragment>
                )}
            </Grid>
        );
    }
}

class ClaimFilter extends Component {

    render() {
        const { classes } = this.props;
        return (
            <form className={classes.container} noValidate autoComplete="off">
                <BoundHead {...this.props} />
                <Details {...this.props} />
            </form>
        )
    }
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(ClaimFilter))));