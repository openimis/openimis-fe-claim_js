import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useModulesManager, useTranslations, Autocomplete, useGraphqlQuery, decodeId } from "@openimis/fe-core";
import _debounce from "lodash/debounce";
import { fetchClaimOfficers } from "../actions";

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
  const dispatch = useDispatch();

  const isLoading = useSelector((state) => state.claim.claimOfficers.isFetching);
  const isLoaded = useSelector((state) => state.claim.claimOfficers.isFetched);
  const options = useSelector((state) => state.claim.claimOfficers.items);
  const error = useSelector((state) => state.claim.claimOfficers.error);

  useEffect(async () => {
     await dispatch(
      fetchClaimOfficers(modulesManager, extraFragment, variables, {
        first: 20,
      }),
    );
  }, []);

  const getOptionLabel = (option) => {
    const result = options.find(officer => decodeId(officer.id) === option.toString());
    if (result) option = result;
    return `${option.code} ${option.lastName} ${option.otherNames}`
  };

  return (
    <div>
      {isLoaded ? (
      <Autocomplete
        multiple={multiple}
        required={required}
        placeholder={placeholder ?? formatMessage("ClaimOfficerPicker.placeholder")}
        label={label ?? formatMessage("ClaimOfficerPicker.label")}
        error={error}
        withLabel={withLabel}
        withPlaceholder={withPlaceholder}
        readOnly={readOnly}
        options={options}
        isLoading={isLoading}
        value={value}
        getOptionLabel={(option) => getOptionLabel(option)}
        onChange={(option) => onChange(option, option ? `${option.code} ${option.lastName} ${option.otherNames}` : null)}
        filterOptions={filterOptions}
        filterSelectedOptions={filterSelectedOptions}
        onInputChange={(search) => setVariables({ search })}
        getOptionSelected={(option, value) => decodeId(option.id) === value.toString()}
      /> ): null}
    </div>
  );
};

export default ClaimOfficerPicker;
