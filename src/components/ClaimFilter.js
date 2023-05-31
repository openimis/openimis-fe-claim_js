import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _debounce from "lodash/debounce";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { injectIntl } from 'react-intl';
import _ from "lodash";
import { Grid, Divider, FormControlLabel, Checkbox } from "@material-ui/core";
import {
    formatMessage, withModulesManager,
    ControlledField, PublishedComponent,
    TextInput, AmountInput, Contributions,
} from "@openimis/fe-core";
import { selectClaimAdmin, selectHealthFacility, selectDistrict, selectRegion } from "../actions";
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Typography from '@material-ui/core/Typography';


const CLAIM_FILTER_CONTRIBUTION_KEY = "claim.Filter";

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
        //withAttachment: false,
    }


    _filterValue = k => {
        const { filters } = this.props;
        return !!filters[k] ? filters[k].value : null
    }

    _regionFilter = v => {
        if (!!v) {
            return {
                id: 'region',
                value: v,
                filter: `healthFacility_Location_Parent_Uuid: "${v.uuid}"`
            }
        }
        else {
            return { id: 'region', value: null, filter: null }
        }
    }

    _districtFilter = v => {
        if (!!v) {
            return {
                id: 'district',
                value: v,
                filter: `healthFacility_Location_Uuid: "${v.uuid}"`
            }
        } else {
            return { id: 'district', value: null, filter: null }
        }
    }

    _healthFacilityFilter = v => {
        if (!!v) {
            return {
                id: 'healthFacility',
                value: v,
                filter: `healthFacility_Uuid: "${v.uuid}"`
            }
        } else {
            return { id: 'healthFacility', value: null, filter: null }
        }
    }

    _claimAdminFilter = v => {
        if (!!v) {
            return {
                id: 'admin',
                value: v,
                filter: `admin_Uuid: "${v.uuid}"`
            }
        } else {
            return { id: 'admin', value: null, filter: null }
        }
    }

    _claimBatchRunFilter = v => {
        if (!!v) {
            return {
                id: 'batchRun',
                value: v,
                filter: `batchRun_Id: "${v.id}"`
            }
        } else {
            return { id: 'batchRun', value: null, filter: null }
        }
    }

    _onChangeRegion = (v, s) => {
        this.props.onChangeFilters([
            this._regionFilter(v),
            this._districtFilter(null),
            this._healthFacilityFilter(null),
            this._claimAdminFilter(null),
            this._claimBatchRunFilter(null)
        ]);
        this.setState({
            reset: this.state.reset + 1,
        });
        this.props.selectRegion(v);
    }

    _onChangeDistrict = (v, s) => {
        this.props.onChangeFilters([
            this._regionFilter(!!v ? v.parent : this._filterValue('region')),
            this._districtFilter(v),
            this._healthFacilityFilter(null),
            this._claimAdminFilter(null),
            this._claimBatchRunFilter(null)
        ]);
        this.setState({
            reset: this.state.reset + 1,
        });
        this.props.selectDistrict(v);
    }

    _onChangeHealthFacility = (v, s) => {
        this.props.onChangeFilters([
            this._regionFilter(!!v ? v.location.parent : this._filterValue('region')),
            this._districtFilter(!!v ? v.location : this._filterValue('district')),
            this._healthFacilityFilter(v),
            this._claimAdminFilter(null),
            this._claimBatchRunFilter(null)
        ]);
        this.setState({
            reset: this.state.reset + 1,
        });
        this.props.selectHealthFacility(v);
    }

    _onChangeClaimAdmin = (v, s) => {
        this.props.onChangeFilters([
            this._regionFilter(!!v ? v.healthFacility.location.parent : this._filterValue('region')),
            this._districtFilter(!!v ? v.healthFacility.location : this._filterValue('district')),
            this._healthFacilityFilter(!!v ? v.healthFacility : this._filterValue('healthFacility')),
            this._claimAdminFilter(v),
        ]);
        this.setState({
            reset: this.state.reset + 1,
        });
        this.props.selectClaimAdmin(v);
    }

    render() {
        const { classes, filters, onChangeFilters, userHealthFacilityId } = this.props;
        return (
            
            <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1a-content"
              id="panel1a-header"
            >
              <Typography className={classes.heading}>More Filters</Typography>
            </AccordionSummary>
            <AccordionDetails>
            <Grid container className={classes.form}>
                <ControlledField module="claim" id="ClaimFilter.region" field={
                    <Grid item xs={2} className={classes.item}>
                        <PublishedComponent
                            id="location.RegionPicker"
                            value={this._filterValue('region')}
                            withNull={true}
                            onChange={this._onChangeRegion}
                        />
                    </Grid>
                } />
                <ControlledField module="claim" id="ClaimFilter.district" field={
                    <Grid item xs={2} className={classes.item}>
                        <PublishedComponent
                            id="location.DistrictPicker"
                            value={this._filterValue('district')}
                            region={this._filterValue('region')}
                            withNull={true}
                            reset={this.state.reset}
                            onChange={this._onChangeDistrict}
                        />
                    </Grid>
                } />
                <ControlledField module="claim" id="ClaimFilter.healthFacility" field={
                    <Grid item xs={2} className={classes.item}>
                        <PublishedComponent
                            id="location.HealthFacilityPicker"
                            value={this._filterValue('healthFacility')}
                            region={this._filterValue('region')}
                            district={this._filterValue('district')}
                            reset={this.state.reset}
                            onChange={this._onChangeHealthFacility}
                        />
                    </Grid>
                } />
                <ControlledField module="claim" id="ClaimFilter.claimAdmin" field={
                    <Grid item xs={2} className={classes.item}>
                        <PublishedComponent
                            id="claim.ClaimAdminPicker"
                            value={this._filterValue('admin')}
                            withNull={true}
                            hfFilter={this._filterValue('healthFacility')}
                            reset={this.state.reset}
                            onChange={this._onChangeClaimAdmin}
                        />
                    </Grid>
                } />
                {/* <ControlledField module="claim" id="ClaimFilter.batchRun" field={
                    <Grid item xs={2} className={classes.item}>
                        {!userHealthFacilityId && (
                            <PublishedComponent
                                id="claim_batch.BatchRunPicker"
                                value={!!filters['batchRun'] ? filters['batchRun']['value'] : null}
                                withNull={true}
                                scopeRegion={!!filters['region'] ? filters['region']['value'] : null}
                                scopeDistrict={!!filters['district'] ? filters['district']['value'] : null}
                                reset={this.state.reset}
                                onChange={(v, s) => onChangeFilters([this._claimBatchRunFilter(v)])}
                            />
                        )}
                    </Grid>
                } /> */}
                <Grid item xs={2} className={classes.item}>
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
            </Grid>
        
            </AccordionDetails>
          </Accordion>

          
        )
    }
}

const mapStateToProps = state => ({
    userHealthFacilityId: state.core.user.i_user.health_facility_id,
    claimFilter: state.claim.claimFilter,
});

const mapDispatchToProps = dispatch => {
    return bindActionCreators({ selectClaimAdmin, selectHealthFacility, selectDistrict, selectRegion }, dispatch);
};

const BoundHead = connect(mapStateToProps, mapDispatchToProps)(Head)

class Details extends Component {

    debouncedOnChangeFilter = _debounce(
        this.props.onChangeFilters,
        this.props.modulesManager.getConf("fe-claim", "debounceTime", 800)
    )
    state = {
        reset: 0,
        withAttachment: false,
    }


    componentDidUpdate(prevProps, prevState, snapshot){
        const { filters } = this.props;
        if (
            prevProps.filters['showAttachment'] !== this.props.filters['showAttachment'] &&
            !!this.props.filters['showAttachment'] &&
            this.state.withAttachment !== this.props.filters['showAttachment']['value']
        ) {
            this.setState({ withAttachment: this.props.filters['showAttachment']['value'] })
        }
    }
    _onChangeAttachment = () => {
        let filters = [
            {
                id: 'showAttachment',
                value: !this.state.withAttachment,
                filter: !this.state.withAttachment ? "attachmentsCount_Value_Gte: 1" : null
            }
        ];
        this.props.onChangeFilters(filters);
        this.setState({
            withAttachment: !this.state.withAttachment,
            reset: this.state.reset + 1,
        });
    }

    render() {
        const { intl, classes, filters, onChangeFilters, filterPaneContributionsKey = null, FilterExt } = this.props;
        return (
            <Grid container className={classes.form}>
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
                <Grid item xs={2} className={classes.item}>
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
                <Grid item xs={2} className={classes.item}>
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
                <Grid item xs={2} className={classes.item}>
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
                <Grid item xs={2} className={classes.item}>
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
                <Grid item xs={2} className={classes.item}>
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

                <Contributions filters={filters} onChangeFilters={onChangeFilters} contributionKey={CLAIM_FILTER_CONTRIBUTION_KEY} />
                {!!filterPaneContributionsKey && (
                    <Contributions filters={filters} onChangeFilters={onChangeFilters} contributionKey={filterPaneContributionsKey} />
                )}
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


export default withModulesManager(injectIntl((withTheme(withStyles(styles)(ClaimFilter)))));