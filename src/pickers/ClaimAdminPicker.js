import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { injectIntl } from 'react-intl';
import { fetchClaimAdmins } from "../actions";
import { formatMessage, AutoSuggestion, SelectInput, ProgressOrError, withModulesManager } from "@openimis/fe-core";

const styles = theme => ({
    label: {
        color: theme.palette.primary.main
    }
});

class ClaimAdminPicker extends Component {

    constructor(props) {
        super(props);
        this.selectThreshold = props.modulesManager.getConf("fe-claim", "ClaimAdminPicker.selectThreshold", 10);
    }

    componentDidMount() {
        if (!this.props.fetchedClaimAdmins) {
            // prevent loading multiple times the cache when component is
            // several times on tha page
            setTimeout(
                () => {
                    !this.props.fetchingClaimAdmins && this.props.fetchClaimAdmins(this.props.modulesManager)
                },
                Math.floor(Math.random() * 300)
            );
        }
    }

    formatSuggestion = a => !a ? "" : `${a.code} ${a.lastName} ${a.otherName || ""}`;

    onSuggestionSelected = v => this.props.onChange(v, this.formatSuggestion(v));

    renderSelect = (admins) => {
        const {
            intl, value,
            withLabel = true, label, withNull = false, nullLabel = null,
            readOnly = false, required = false,
        } = this.props;
        var options = [...admins.map(r => ({ value: r, label: this.formatSuggestion(r)}))];
        if (withNull) {
            options.unshift({ value: null, label: nullLabel || formatMessage(intl, "claim", "claim.ClaimAdminPicker.null")})
        }
        return <SelectInput
            module={"claim"}
            strLabel={!!withLabel && (label || formatMessage(intl, "claim", "ClaimAdminPicker.label"))}
            options={options}
            value={value}
            onChange={this.onSuggestionSelected}
            readOnly={readOnly}
            required={required}
        />
    }

    renderAutoSuggestion = (admins) => {
        const {
            intl, value,
            withLabel = true, label,
            reset, readOnly = false, required = false,
        } = this.props;
        return <AutoSuggestion
            items={admins}
            label={!!withLabel && (label || formatMessage(intl, "claim", "ClaimAdminPicker.label"))}
            getSuggestions={this.claimAdmins}
            getSuggestionValue={this.formatSuggestion}
            onSuggestionSelected={this.onSuggestionSelected}
            value={value}
            reset={reset}
            readOnly={readOnly}
            required={required}
         />
    }

    render() {
        const {
            claimAdmins,
            fetchingClaimAdmins, fetchedClaimAdmins, errorClaimAdmins,
            hfFilter = null
        } = this.props;
        let admins = !!hfFilter ? (claimAdmins || []).filter(a => a.healthFacility.uuid === hfFilter.uuid) : claimAdmins;
        return (
            <Fragment>
                <ProgressOrError progress={fetchingClaimAdmins} error={errorClaimAdmins} />
                {fetchedClaimAdmins && admins.length < this.selectThreshold && (
                    this.renderSelect(admins)
                )}
                {fetchedClaimAdmins && admins.length >= this.selectThreshold && (
                    this.renderAutoSuggestion(admins)
                )}
            </Fragment>
        )
    }
}

const mapStateToProps = state => ({
    claimAdmins: state.claim.claimAdmins,
    fetchingClaimAdmins: state.claim.fetchingClaimAdmins,
    fetchedClaimAdmins: state.claim.fetchedClaimAdmins,
    errorClaimAdmins: state.claim.errorClaimAdmins,
});

const mapDispatchToProps = dispatch => {
    return bindActionCreators({ fetchClaimAdmins }, dispatch);
};

export default withModulesManager(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(ClaimAdminPicker))))
);
