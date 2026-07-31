import React, { Fragment } from "react";

import { Grid, Typography, Divider } from "@mui/material";
import { useTheme, styled } from "@mui/material/styles";

import { FormattedMessage } from "@openimis/fe-core";

const StyledGrid = styled(Grid)(({ theme }) => ({
  ...theme?.paper?.item ?? {},
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  ...theme?.table?.title ?? {},
}));

const AdditionalPanelHeaders = () => {
  const theme = useTheme();
  return (
    <Fragment>
      <StyledGrid  size={6} className="item">
        <StyledTypography className="tableTitle">
          <FormattedMessage module="claim" id="ClaimMasterPanelExt.InsureeInfo.Header" />
        </StyledTypography>
        <Divider />
      </StyledGrid>
      <StyledGrid  size={6} className="item">
        <StyledTypography className="tableTitle">
          <FormattedMessage module="claim" id="ClaimMasterPanelExt.InsureeInfo.lastClaimSameDiagnosis.Header" />
        </StyledTypography>
        <Divider />
      </StyledGrid>
    </Fragment>
  );
};

export default AdditionalPanelHeaders;
