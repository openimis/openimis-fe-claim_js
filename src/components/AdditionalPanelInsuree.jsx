import React from "react";

import { Grid } from "@mui/material";
import { useTheme, styled } from "@mui/material/styles";

import { useModulesManager, useTranslations, TextInput, PublishedComponent, useGraphqlQuery } from "@openimis/fe-core";
import { calculateAge, calculateDuration } from "../utils/utils";

const StyledGrid = styled(Grid)(({ theme }) => ({
  ...theme?.paper?.item ?? {},
}));

const AdditionalPanelInsuree = ({ dateTo, dateFrom, insuree, dateClaimed, isEdited }) => {
  const theme = useTheme();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("claim", modulesManager);

  const visitDuration = calculateDuration(dateTo, dateFrom, formatMessage);
  const insureeAge = calculateAge(insuree?.dob, dateClaimed, formatMessage);

  const { data: firstServicePoint } = useGraphqlQuery(
    `
    query AdditionalPanelInsuree($insureeCode: String!, $dateClaimed: Date!) {
      fspFromClaim(insureeCode: $insureeCode, dateClaimed: $dateClaimed)
      ${modulesManager.getProjection("location.HealthFacilityPicker.projection")}
    }
  `,
    { dateClaimed, insureeCode: insuree?.chfId },
    { skip: !isEdited || !dateClaimed || !insuree?.chfId },
  );

  return (
    <StyledGrid  size={6} className="item">
      <Grid container>
        <StyledGrid size={4} className="item">
          <TextInput
            module="claim"
            label="ClaimMasterPanelExt.InsureeInfo.insureeAge"
            name="insureeAge"
            readOnly={true}
            withNull={true}
            value={insureeAge}
          />
        </StyledGrid>
        <StyledGrid size={4} className="item">
          <TextInput
            module="claim"
            label="ClaimMasterPanelExt.InsureeInfo.visitDuration"
            name="lastClaimDays"
            displayZero={true}
            readOnly={true}
            value={visitDuration}
          />
        </StyledGrid>
        <StyledGrid size={4} className="item">
          <PublishedComponent
            module="claim"
            pubRef="location.HealthFacilityPicker"
            label={formatMessage("ClaimMasterPanelExt.InsureeInfo.FSP")}
            value={firstServicePoint?.fspFromClaim ?? null}
            district={null}
            readOnly={true}
          />
        </StyledGrid>
      </Grid>
    </StyledGrid>
  );
};

export default AdditionalPanelInsuree;
