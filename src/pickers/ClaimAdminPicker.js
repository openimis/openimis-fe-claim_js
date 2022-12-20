import React, { useState } from "react";
import { useModulesManager, useTranslations, Autocomplete, useGraphqlQuery } from "@openimis/fe-core";
import _debounce from "lodash/debounce";

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
  } = props;

  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("claim", modulesManager);
  const [searchString, setSearchString] = useState("");
  const { isLoading, data, error } = useGraphqlQuery(
    `
      query ClaimAdminPicker ($search: String, $hf: String) {
          claimAdmins(search: $search, first: 20, healthFacility_Uuid: $hf) {
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
    { hf: hfFilter?.uuid, search: searchString },
    { skip: true },
  );

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
      options={data?.claimAdmins?.edges.map((edge) => edge.node) ?? []}
      isLoading={isLoading}
      value={value}
      getOptionLabel={(option) => `${option.code} ${option.lastName} ${option.otherNames}`}
      onChange={(option) => onChange(option, option ? `${option.code} ${option.lastName} ${option.otherNames}` : null)}
      filterOptions={filterOptions}
      filterSelectedOptions={filterSelectedOptions}
      onInputChange={setSearchString}
    />
  );
};

export default ClaimAdminPicker;
