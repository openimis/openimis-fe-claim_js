import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import _debounce from "lodash/debounce";
import { injectIntl } from "react-intl";
import { RIGHT_CLAIMREVIEW } from "../constants";

import { Grid, Divider, Checkbox, FormControlLabel } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  GRID_RESPONSIVE_STANDARD,
  GRID_RESPONSIVE_SMALL,
  GRID_RESPONSIVE_LARGE,
  GRID_RESPONSIVE_FULL,
  GRID_RESPONSIVE_HALF,
  formatMessage,
  withModulesManager,
  ControlledField,
  PublishedComponent,
  TextInput,
  AmountInput,
  Contributions,
} from "@openimis/fe-core";
import { selectClaimAdmin, selectHealthFacility, selectDistrict, selectRegion } from "../actions";

const CLAIM_FILTER_CONTRIBUTION_KEY = "claim.Filter";

const StyledForm = styled("form")(({ theme }) => ({
  padding: 0,
}));

const StyledFormGrid = styled(Grid)(({ theme }) => ({
  padding: 0,
  "&.form": {
    margin: 0,
    width: "100%",
  },
}));

const StyledItemGrid = styled(Grid)(({ theme }) => ({
  padding: theme?.spacing?.(1) ?? 8,
}));

const StyledDividerGrid = styled(Grid)(({ theme }) => ({
  ...(theme?.paper?.divider ?? {}),
}));

class Head extends Component {
  state = {
    reset: 0,
  };

  _filterValue = (k) => {
    const { filters } = this.props;
    return !!filters[k] ? filters[k].value : null;
  };

  _regionFilter = (v) => {
    if (!!v) {
      return {
        id: "region",
        value: v,
        filter: `healthFacility_Location_Parent_Uuid: "${v.uuid}"`,
      };
    } else {
      return { id: "region", value: null, filter: null };
    }
  };

  _districtFilter = (v) => {
    if (!!v) {
      return {
        id: "district",
        value: v,
        filter: `healthFacility_Location_Uuid: "${v.uuid}"`,
      };
    } else {
      return { id: "district", value: null, filter: null };
    }
  };

  _healthFacilityFilter = (v) => {
    if (!!v) {
      return {
        id: "healthFacility",
        value: v,
        filter: `healthFacility_Uuid: "${v.uuid}"`,
      };
    } else {
      return { id: "healthFacility", value: null, filter: null };
    }
  };

  _claimAdminFilter = (v) => {
    if (!!v) {
      return {
        id: "admin",
        value: v,
        filter: `admin_Uuid: "${v.uuid}"`,
      };
    } else {
      return { id: "admin", value: null, filter: null };
    }
  };

  _claimBatchRunFilter = (v) => {
    if (!!v) {
      return {
        id: "batchRun",
        value: v,
        filter: `batchRun_Id: "${v.id}"`,
      };
    } else {
      return { id: "batchRun", value: null, filter: null };
    }
  };

  _onChangeRegion = (v, s) => {
    this.props.onChangeFilters([
      this._regionFilter(v),
      this._districtFilter(null),
      this._healthFacilityFilter(null),
      this._claimAdminFilter(null),
      this._claimBatchRunFilter(null),
    ]);
    this.setState((state) => ({
      reset: state.reset + 1,
    }));
    this.props.selectRegion(v);
  };

  _onChangeDistrict = (v, s) => {
    this.props.onChangeFilters([
      this._regionFilter(!!v ? v.parent : this._filterValue("region")),
      this._districtFilter(v),
      this._healthFacilityFilter(null),
      this._claimAdminFilter(null),
      this._claimBatchRunFilter(null),
    ]);
    this.setState({
      reset: this.state.reset + 1,
    });
    this.props.selectDistrict(v);
  };

  _onChangeHealthFacility = (v, s) => {
    this.props.onChangeFilters([
      this._regionFilter(!!v ? v.location.parent : this._filterValue("region")),
      this._districtFilter(!!v ? v.location : this._filterValue("district")),
      this._healthFacilityFilter(v),
      this._claimAdminFilter(null),
      this._claimBatchRunFilter(null),
    ]);
    this.setState((state) => ({
      reset: state.reset + 1,
    }));
    this.props.selectHealthFacility(v);
  };

  _onChangeClaimAdmin = (v, s) => {
    this.props.onChangeFilters([
      this._regionFilter(!!v ? v.healthFacility.location.parent : this._filterValue("region")),
      this._districtFilter(!!v ? v.healthFacility.location : this._filterValue("district")),
      this._healthFacilityFilter(!!v ? v.healthFacility : this._filterValue("healthFacility")),
      this._claimAdminFilter(v),
    ]);
    this.setState((state) => ({
      reset: state.reset + 1,
    }));
    this.props.selectClaimAdmin(v);
  };

  render() {
    const { filters, onChangeFilters, userHealthFacilityId } = this.props;
    return (
      <Fragment>
        <ControlledField
          module="claim"
          id="ClaimFilter.region"
          field={
            <StyledItemGrid size={GRID_RESPONSIVE_STANDARD}>
              <PublishedComponent
                pubRef="location.RegionPicker"
                value={this._filterValue("region")}
                onChange={this._onChangeRegion}
              />
            </StyledItemGrid>
          }
        />
        <ControlledField
          module="claim"
          id="ClaimFilter.district"
          field={
            <StyledItemGrid size={GRID_RESPONSIVE_STANDARD}>
              <PublishedComponent
                pubRef="location.DistrictPicker"
                value={this._filterValue("district")}
                region={this._filterValue("region")}
                onChange={this._onChangeDistrict}
              />
            </StyledItemGrid>
          }
        />
        <ControlledField
          module="claim"
          id="ClaimFilter.healthFacility"
          field={
            <StyledItemGrid size={GRID_RESPONSIVE_STANDARD}>
              <PublishedComponent
                pubRef="location.HealthFacilityPicker"
                value={this._filterValue("healthFacility")}
                district={this._filterValue("district")}
                onChange={this._onChangeHealthFacility}
              />
            </StyledItemGrid>
          }
        />
        <ControlledField
          module="claim"
          id="ClaimFilter.claimAdmin"
          field={
            <StyledItemGrid size={GRID_RESPONSIVE_STANDARD}>
              <PublishedComponent
                pubRef="claim.ClaimAdminPicker"
                value={this._filterValue("admin")}
                withNull={true}
                hfFilter={this._filterValue("healthFacility")}
                reset={this.state.reset}
                onChange={this._onChangeClaimAdmin}
                region={this._filterValue("region")}
                district={this._filterValue("district")}
                required={true}
                dataCy="claim-admin-filter"
              />
            </StyledItemGrid>
          }
        />
        <ControlledField
          module="claim"
          id="ClaimFilter.batchRun"
          field={
            <StyledItemGrid size={GRID_RESPONSIVE_STANDARD}>
              {!userHealthFacilityId && (
                <PublishedComponent
                  pubRef="claim_batch.BatchRunPicker"
                  value={!!filters["batchRun"] ? filters["batchRun"]["value"] : null}
                  withNull={true}
                  scopeRegion={!!filters["region"] ? filters["region"]["value"] : null}
                  scopeDistrict={!!filters["district"] ? filters["district"]["value"] : null}
                  reset={this.state.reset}
                  onChange={(v, s) => onChangeFilters([this._claimBatchRunFilter(v)])}
                />
              )}
            </StyledItemGrid>
          }
        />
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  userHealthFacilityId: state.core.user.i_user.health_facility_id,
  claimFilter: state.claim.claimFilter,
  servicesPricelists: !!state.medical_pricelist ? state.medical_pricelist.servicesPricelists : {},
  itemsPricelists: !!state.medical_pricelist ? state.medical_pricelist.itemsPricelists : {},
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      selectClaimAdmin,
      selectHealthFacility,
      selectDistrict,
      selectRegion,
    },
    dispatch,
  );
};

const BoundHead = connect(mapStateToProps, mapDispatchToProps)(Head);

class Details extends Component {
  constructor(props) {
    super(props);
    this.showPreAuthorization = props.modulesManager.getConf("fe-claim", "showPreAuthorization", false);
  }

  debouncedOnChangeFilter = _debounce(
    this.props.onChangeFilters,
    this.props.modulesManager.getConf("fe-claim", "debounceTime", 200),
  );

  _filterTextFieldValue = (k) => {
    const { filters } = this.props;
    return !!filters && !!filters[k] ? filters[k].value : "";
  };

  render() {
    const { intl, filters, onChangeFilters, filterPaneContributionsKey = null, FilterExt } = this.props;
    return (
      <Fragment>
        <StyledItemGrid size={GRID_RESPONSIVE_STANDARD}>
          <PublishedComponent
            pubRef="claim.ClaimStatusPicker"
            name="claimStatus"
            value={filters["claimStatus"] && filters["claimStatus"]["value"]}
            onChange={(v, s) =>
              onChangeFilters([
                {
                  id: "claimStatus",
                  value: v,
                  filter: !!v ? `status: ${v}` : null,
                },
              ])
            }
          />
        </StyledItemGrid>
        <StyledItemGrid size={GRID_RESPONSIVE_STANDARD}>
          <PublishedComponent
            pubRef="claim.FeedbackStatusPicker"
            name="feedbackStatus"
            value={filters["feedbackStatus"] && filters["feedbackStatus"]["value"]}
            onChange={(v, s) =>
              onChangeFilters([
                {
                  id: "feedbackStatus",
                  value: v,
                  filter: !!v ? `feedbackStatus: ${v}` : null,
                },
              ])
            }
          />
        </StyledItemGrid>
        <StyledItemGrid size={GRID_RESPONSIVE_STANDARD}>
          <PublishedComponent
            pubRef="claim.ReviewStatusPicker"
            name="reviewStatus"
            value={filters["reviewStatus"] && filters["reviewStatus"]["value"]}
            onChange={(v, s) =>
              onChangeFilters([
                {
                  id: "reviewStatus",
                  value: v,
                  filter: !!v ? `reviewStatus: ${v}` : null,
                },
              ])
            }
          />
        </StyledItemGrid>
        <StyledItemGrid size={GRID_RESPONSIVE_STANDARD}>
          <TextInput
            module="claim"
            label="ClaimFilter.claimNo"
            name="claimNo"
            value={this._filterTextFieldValue("claimNo")}
            onChange={(v) =>
              this.debouncedOnChangeFilter([
                {
                  id: "claimNo",
                  value: v,
                  filter: !!v ? `code_Icontains: "${v}"` : null,
                },
              ])
            }
            inputProps={{ "data-cy": "claim-code-filter" }}
          />
        </StyledItemGrid>
        <StyledItemGrid size={GRID_RESPONSIVE_STANDARD}>
          <TextInput
            module="claim"
            label="ClaimFilter.insureeCHFID"
            name="chfId"
            value={this._filterTextFieldValue("chfId")}
            onChange={(v) =>
              this.debouncedOnChangeFilter([
                {
                  id: "chfId",
                  value: v,
                  filter: !!v ? `insuree_ChfId: "${v}"` : null,
                },
              ])
            }
          />
        </StyledItemGrid>
        <StyledItemGrid size={GRID_RESPONSIVE_STANDARD}>
          <AmountInput
            module="claim"
            label="ClaimFilter.claimedAbove"
            name="claimedAbove"
            value={filters["claimedAbove"] && filters["claimedAbove"]["value"]}
            onChange={(v) =>
              this.debouncedOnChangeFilter([
                {
                  id: "claimedAbove",
                  value: !v ? null : v,
                  filter: !!v ? `claimed_Gte: "${parseFloat(v)}"` : null,
                },
              ])
            }
          />
        </StyledItemGrid>
        <StyledItemGrid size={GRID_RESPONSIVE_STANDARD}>
          <AmountInput
            module="claim"
            label="ClaimFilter.claimedUnder"
            name="claimedUnder"
            value={filters["claimedUnder"] && filters["claimedUnder"]["value"]}
            onChange={(v) =>
              this.debouncedOnChangeFilter([
                {
                  id: "claimedUnder",
                  value: !v ? null : v,
                  filter: !!v ? `claimed_Lte: "${parseFloat(v)}"` : null,
                },
              ])
            }
          />
        </StyledItemGrid>
        <Grid size={GRID_RESPONSIVE_STANDARD}>
          <Grid container>
            <StyledItemGrid size={GRID_RESPONSIVE_HALF}>
              <PublishedComponent
                pubRef="core.DatePicker"
                value={(filters["visitDateFrom"] && filters["visitDateFrom"]["value"]) || null}
                module="claim"
                label="visitDateFrom"
                onChange={(d) =>
                  onChangeFilters([
                    {
                      id: "visitDateFrom",
                      value: d,
                      filter: !!d ? `dateFrom_Gte: "${d}"` : null,
                    },
                  ])
                }
              />
            </StyledItemGrid>
            <StyledItemGrid size={GRID_RESPONSIVE_HALF}>
              <PublishedComponent
                pubRef="core.DatePicker"
                value={(filters["visitDateTo"] && filters["visitDateTo"]["value"]) || null}
                module="claim"
                label="visitDateTo"
                onChange={(d) =>
                  onChangeFilters([
                    {
                      id: "visitDateTo",
                      value: d,
                      filter: !!d ? `dateTo_Lte: "${d}"` : null,
                    },
                  ])
                }
              />
            </StyledItemGrid>
          </Grid>
        </Grid>
        <Grid size={GRID_RESPONSIVE_STANDARD}>
          <Grid container>
            <StyledItemGrid size={GRID_RESPONSIVE_HALF}>
              <PublishedComponent
                pubRef="core.DatePicker"
                value={(filters["claimDateFrom"] && filters["claimDateFrom"]["value"]) || null}
                module="claim"
                label="ClaimFilter.claimedDateFrom"
                onChange={(d) =>
                  onChangeFilters([
                    {
                      id: "claimDateFrom",
                      value: d,
                      filter: !!d ? `dateClaimed_Gte: "${d}"` : null,
                    },
                  ])
                }
              />
            </StyledItemGrid>
            <StyledItemGrid size={GRID_RESPONSIVE_HALF}>
              <PublishedComponent
                pubRef="core.DatePicker"
                value={(filters["claimDateTo"] && filters["claimDateTo"]["value"]) || null}
                module="claim"
                label="ClaimFilter.claimedDateTo"
                onChange={(d) =>
                  onChangeFilters([
                    {
                      id: "claimDateTo",
                      value: d,
                      filter: !!d ? `dateClaimed_Lte: "${d}"` : null,
                    },
                  ])
                }
              />
            </StyledItemGrid>
          </Grid>
        </Grid>
    {!this.props.rights.includes(RIGHT_CLAIMREVIEW) && (
        <Grid size={GRID_RESPONSIVE_STANDARD}>
          <Grid container>
            <StyledItemGrid size={GRID_RESPONSIVE_HALF}>
              <PublishedComponent
                pubRef="core.DatePicker"
                value={(filters["processedDateFrom"] && filters["processedDateFrom"]["value"]) || null}
                module="claim"
                label="ClaimFilter.processedDateFrom"
                onChange={(d) =>
                  onChangeFilters([
                    {
                      id: "processedDateFrom",
                      value: d,
                      filter: !!d ? `dateProcessed_Gte: "${d}"` : null,
                    },
                  ])
                }
              />
            </StyledItemGrid>
            <StyledItemGrid size={GRID_RESPONSIVE_HALF}>
              <PublishedComponent
                pubRef="core.DatePicker"
                value={(filters["processedDateTo"] && filters["processedDateTo"]["value"]) || null}
                module="claim"
                label="ClaimFilter.processedDateTo"
                onChange={(d) =>
                  onChangeFilters([
                    {
                      id: "processedDateTo",
                      value: d,
                      filter: !!d ? `dateProcessed_Lte: "${d}"` : null,
                    },
                  ])
                }
              />
            </StyledItemGrid>
          </Grid>
        </Grid>
    )}
        <StyledItemGrid size={GRID_RESPONSIVE_STANDARD}>
          <PublishedComponent
            pubRef="medical.ServicePicker"
            value={(filters["medicalService"] && filters["medicalService"]["value"]) || null}
            name="medicalService"
            label={formatMessage(intl, "claim", "medicalService")}
            onChange={(v, s) =>
              onChangeFilters([
                {
                  id: "medicalService",
                  value: v,
                  filter: !!v ? `services: ["${!!v && v.code}"]` : null,
                },
              ])
            }
          />
        </StyledItemGrid>
        <StyledItemGrid size={GRID_RESPONSIVE_STANDARD}>
          <PublishedComponent
            pubRef="medical.ItemPicker"
            value={(filters["medicalItem"] && filters["medicalItem"]["value"]) || null}
            name="medicalItem"
            label={formatMessage(intl, "claim", "medicalItem")}
            onChange={(v, s) =>
              onChangeFilters([
                {
                  id: "medicalItem",
                  value: v,
                  filter: !!v ? `items: ["${!!v && v.code}"]` : null,
                },
              ])
            }
          />
        </StyledItemGrid>
        <StyledItemGrid size={GRID_RESPONSIVE_STANDARD}>
          <PublishedComponent
            pubRef="medical.DiagnosisPicker"
            name="mainDiagnosis"
            label={formatMessage(intl, "claim", "mainDiagnosis")}
            value={(filters["mainDiagnosis"] && filters["mainDiagnosis"]["value"]) || null}
            onChange={(v, s) =>
              onChangeFilters([
                {
                  id: "mainDiagnosis",
                  value: v,
                  filter: !!v ? `icd_Id: "${!!v && v.id}"` : null,
                },
              ])
            }
          />
        </StyledItemGrid>
        <StyledItemGrid size={GRID_RESPONSIVE_STANDARD}>
          <PublishedComponent
            pubRef="medical.VisitTypePicker"
            name="visitType"
            value={(filters["visitType"] && filters["visitType"]["value"]) || null}
            onChange={(v, s) =>
              onChangeFilters([
                {
                  id: "visitType",
                  value: v,
                  filter: !!v ? `visitType: "${v}"` : null,
                },
              ])
            }
          />
        </StyledItemGrid>
        <StyledItemGrid size={GRID_RESPONSIVE_STANDARD}>
          <PublishedComponent
            pubRef="claim.CareTypePicker"
            name="careType"
            value={filters["careType"] && filters["careType"]["value"] || null}
            onChange={(value) => {
              onChangeFilters([
                {
                  id: "careType",
                  value: value,
                  filter: !!value ? `careType: "${value}"` : null,
                },
              ])
            }
            }
          />
        </StyledItemGrid>
        <StyledItemGrid size={GRID_RESPONSIVE_STANDARD}>
          <PublishedComponent
            pubRef="claim.AttachmentStatusPicker"
            name="attachmentStatus"
            value={filters["attachmentStatus"] && filters["attachmentStatus"]["value"] || null}
            onChange={(value) =>
              onChangeFilters([
                {
                  id: "attachmentStatus",
                  value: value,
                  filter: !!value ? `attachmentStatus: ${value}` : null,
                },
              ])
            }
          />
        </StyledItemGrid>
        {this.showPreAuthorization && (
          <StyledItemGrid size={GRID_RESPONSIVE_STANDARD}>
            <PublishedComponent
              pubRef="claim.YesNoPicker"
              name="preAuthorization"
              value={filters["preAuthorization"] ? filters["preAuthorization"]["value"] : null}
              onChange={(value) =>
                onChangeFilters([
                  {
                    id: "preAuthorization",
                    value: value,
                    filter: value === null || value === "" ? null : `preAuthorization: ${value}`,
                  },
                ])
              }
            />
          </StyledItemGrid>
        )}
        <StyledItemGrid size={GRID_RESPONSIVE_STANDARD}>
          <FormControlLabel
            control={
              <Checkbox
                color="primary"
                checked={filters["showRestored"] && filters["showRestored"]["value"] || false}
                onChange={(event) =>
                  onChangeFilters([
                    {
                      id: "showRestored",
                      value: event.target.checked,
                      filter: !!event.target.checked ? `showRestored: ${event.target.checked}` : null,
                    },
                  ])
                }
              />
            }
            label={formatMessage(intl, "claim", "showRestored")}
          />
        </StyledItemGrid>
        <Contributions
          filters={filters}
          onChangeFilters={onChangeFilters}
          contributionKey={CLAIM_FILTER_CONTRIBUTION_KEY}
        />
        {!!filterPaneContributionsKey && (
          <Contributions
            filters={filters}
            onChangeFilters={onChangeFilters}
            contributionKey={filterPaneContributionsKey}
          />
        )}
        {!!FilterExt && (
          <Fragment>
            <StyledDividerGrid size={GRID_RESPONSIVE_FULL} className="paperDivider">
              <Divider />
            </StyledDividerGrid>
            <Grid size={GRID_RESPONSIVE_FULL}>
              <FilterExt onChangeFilters={onChangeFilters} filters={filters} />
            </Grid>
          </Fragment>
        )}
      </Fragment>
    );
  }
}

const BoundDetails = connect(mapStateToProps, mapDispatchToProps)(Details);

class ClaimFilter extends Component {
  render() {
    return (
      <StyledForm className="container" noValidate autoComplete="off">
        <StyledFormGrid container className="form">
          <BoundHead {...this.props} />
          <BoundDetails {...this.props} />
        </StyledFormGrid>
      </StyledForm>
    );
  }
}

export { CLAIM_FILTER_CONTRIBUTION_KEY };
export { Head };
export default withModulesManager(injectIntl(ClaimFilter));
