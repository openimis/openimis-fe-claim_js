import React, { Component } from "react";

class ClaimsSearcherPage extends Component {

    _filterOnHealthFacility(healthFacility) {
        let hf = null
        let defaultFilters = { ...this.state.defaultFilters }
        delete (defaultFilters.claimAdmin);
        if (!!healthFacility) {
            hf = {...healthFacility}
        }
        if (!hf && !this.props.claimAdmin) {
            delete (defaultFilters.healthFacility);
        } else if (!!this.props.claimAdmin) {
            hf = this.props.claimAdmin.healthFacility;
        }

        if (!!hf) {
            defaultFilters.healthFacility = {
                "value": hf,
                "filter": `healthFacility_Id: "${hf.id}"`
            }
            let district = hf.location;
            defaultFilters.district = {
                "value": district,
                "filter": `healthFacility_Location_Id: "${district.id}"`
            }
            let region = district.parent;
            defaultFilters.region = {
                "value": region,
                "filter": `healthFacility_Location_Parent_Id: "${region.id}"`
            }
            if (!!this.props.claimAdmin) {
                defaultFilters.claimAdmin = {
                    "value": this.props.claimAdmin,
                    "filter": `admin_Uuid: "${this.props.claimAdmin.uuid}"`
                }
            }
        }
        this.setState({ defaultFilters })
        this.props.selectHealthFacility(hf);
    }

    componentDidMount() {
        if (!!this.props.claimHealthFacility) {
            this._filterOnHealthFacility(this.props.claimHealthFacility);
        } else if (!!this.props.userHealthFacilityFullPath) {
            this._filterOnHealthFacility(this.props.userHealthFacilityFullPath);
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.submittingMutation && !this.props.submittingMutation) {
            this.props.journalize(this.props.mutation);
        } else if (!_.isEqual(prevProps.userHealthFacilityFullPath, this.props.userHealthFacilityFullPath)) {
            this._filterOnHealthFacility(this.props.userHealthFacilityFullPath);
        } else if (!_.isEqual(prevProps.claimHealthFacility, this.props.claimHealthFacility)
            || !_.isEqual(prevProps.claimAdmin, this.props.claimAdmin)) {
            this._filterOnHealthFacility(this.props.claimHealthFacility);
        } else if (prevProps.confirmed !== this.props.confirmed && !!this.props.confirmed && !!this.state.confirmedAction) {
            this.state.confirmedAction();            
        }
    }
}

export default ClaimsSearcherPage;