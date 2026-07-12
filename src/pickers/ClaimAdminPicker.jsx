import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  useModulesManager,
  useTranslations,
  Autocomplete,
  useGraphqlQuery,
} from "@openimis/fe-core";
import { DEFAULT } from "../constants";
import { setCurrentClaimAdmin } from "../actions";

export const formatClaimAdminLabel = (claimAdmin, renderLastNameFirst) => {
  if (!claimAdmin) return "";
  return renderLastNameFirst
    ? `${claimAdmin.code} ${claimAdmin.lastName} ${claimAdmin.otherNames}`
    : `${claimAdmin.code} ${claimAdmin.otherNames} ${claimAdmin.lastName}`;
};

const ClaimAdminPicker = (props) => {
  const {
    onChange,
    readOnly,
    required,
    withLabel = true,
    withPlaceholder,
    value,
    label,
    filterOptions,
    filterSelectedOptions,
    placeholder,
    multiple,
    extraFragment,
    hfFilter,
    region,
    district,
    dataCy = "claim-admin-picker"
  } = props;
  const userHealthFacilityId = useSelector((state) =>
    state?.loc?.userHealthFacilityFullPath?.uuid
  );
  const i_user = useSelector((state) =>
    state?.core?.user?.username
  );

  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("claim", modulesManager);
  const [searchString, setSearchString] = useState("");
  const renderLastNameFirst = modulesManager.getConf(
    "fe-insuree",
    "renderLastNameFirst",
    DEFAULT.RENDER_LAST_NAME_FIRST,
  );

  const { isLoading, data, error } = useGraphqlQuery(
    `
      query ClaimAdminPicker ($search: String, $hf: String, $region_uuid: String, $district_uuid: String) {
          claimAdmins(search: $search, first: 20, healthFacility_Uuid: $hf, regionUuid: $region_uuid, districtUuid: $district_uuid) {
              edges {
                  node {
                      id
                      uuid
                      code
                      lastName
                      otherNames
                      healthFacility {
                          id uuid code name level
                          servicesPricelist{id, uuid}, itemsPricelist{id, uuid}
                          location {
                              id
                              uuid
                              code
                              name
                              parent {
                                code name id uuid
                              }
                          }
                      }
                      ${extraFragment ?? ""}
                    }
                }
            }
        }
        `,
    {
      hf: userHealthFacilityId || hfFilter?.uuid,
      search: searchString,
      region_uuid: region?.uuid,
      district_uuid: district?.uuid
    },
    { skip: readOnly },
  );

  const dispatch = useDispatch();
  const formatClaimAdmin = (claimAdmin) => formatClaimAdminLabel(claimAdmin, renderLastNameFirst);
  const claimAdmins = readOnly
    ? (value ? [value] : [])
    : (data?.claimAdmins?.edges.map((edge) => edge.node) || []);

  useEffect(() => {
    if (readOnly) return;
    const currentAdmin = claimAdmins.find((admin) => admin.code === i_user);
    if (currentAdmin) {
      dispatch(setCurrentClaimAdmin(currentAdmin));
    }
  }, [claimAdmins, i_user, readOnly, dispatch]);

  return (
    <Autocomplete
      multiple={multiple}
      required={required}
      placeholder={placeholder ?? formatMessage("ClaimAdminPicker.placeholder")}
      label={label ?? formatMessage("ClaimAdminPicker.label")}
      error={error}
      withLabel={withLabel}
      withPlaceholder={withPlaceholder}
      readOnly={readOnly}
      options={claimAdmins}
      isLoading={isLoading}
      value={value}
      getOptionLabel={(option) => formatClaimAdmin(option)}
      onChange={(option) => onChange(option, option ? `${option.code} ${option.lastName} ${option.otherNames}` : null)}
      filterOptions={filterOptions}
      filterSelectedOptions={filterSelectedOptions}
      onInputChange={readOnly ? undefined : setSearchString}
      dataCy={dataCy}
    />
  );
};

export default ClaimAdminPicker;
