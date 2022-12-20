import React, { useState } from "react";
import { useModulesManager, useTranslations, Autocomplete, useGraphqlQuery } from "@openimis/fe-core";
import _debounce from "lodash/debounce";

const ClaimOfficerPicker = (props) => {
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
  } = props;

  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("claim", modulesManager);
  const [variables, setVariables] = useState({});

  const { isLoading, data, error } = useGraphqlQuery(
    `
    query ClaimOfficerPicker ($search: String) {
      claimOfficers(search: $search, first: 20) {
        edges {
          node {
            id
            uuid
            code
            lastName
            otherNames
            ${extraFragment ?? ""}
          }
        }
      }
    }
  `,
    variables,
    { skip: true },
  );

  return (
    <Autocomplete
      multiple={multiple}
      required={required}
      placeholder={placeholder ?? formatMessage("ClaimOfficerPicker.placeholder")}
      label={label ?? formatMessage("ClaimOfficerPicker.label")}
      error={error}
      withLabel={withLabel}
      withPlaceholder={withPlaceholder}
      readOnly={readOnly}
      options={data?.claimOfficers?.edges.map((edge) => edge.node) ?? []}
      isLoading={isLoading}
      value={value}
      getOptionLabel={(option) => `${option.code} ${option.lastName} ${option.otherNames}`}
      onChange={(option) => onChange(option, option ? `${option.code} ${option.lastName} ${option.otherNames}` : null)}
      filterOptions={filterOptions}
      filterSelectedOptions={filterSelectedOptions}
      onInputChange={(search) => setVariables({ search })}
    />
  );
};

export default ClaimOfficerPicker;
