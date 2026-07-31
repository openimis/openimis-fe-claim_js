import React from "react";

import { Grid, Button } from "@mui/material";
import { useTheme, styled } from "@mui/material/styles";

import {
  useModulesManager,
  useTranslations,
  PublishedComponent,
  useHistory,
  historyPush,
  FormattedMessage,
  TextInput,
} from "@openimis/fe-core";

const StyledGrid = styled(Grid)(({ theme }) => ({
  ...theme?.paper?.item ?? {},
}));

const AdditionalPanelClaim = ({ sameDiagnosisClaim }) => {
  const theme = useTheme();
  const modulesManager = useModulesManager();
  const history = useHistory();
  const { formatMessage } = useTranslations("claim", modulesManager);

  const goToClaimUuid = (uuid) => historyPush(modulesManager, history, "claim.route.claimEdit", [uuid], true);

  if (!sameDiagnosisClaim)
    return <FormattedMessage module="claim" id="ClaimMasterPanelExt.sameDiagnosisClaim.noClaim" />;

  return (
    <Grid container>
      <StyledGrid size={4}  className="item">
        <TextInput
          module="claim"
          label="ClaimMasterPanelExt.InsureeLastVisit.claimCode"
          readOnly={true}
          value={sameDiagnosisClaim.code}
        />
      </StyledGrid>
      <StyledGrid size={4}  className="item">
        <PublishedComponent
          pubRef="core.DatePicker"
          value={sameDiagnosisClaim.dateFrom}
          module="claim"
          label="ClaimMasterPanelExt.InsureeLastVisit.lastClaimAtFrom"
          readOnly={true}
        />
      </StyledGrid>
      <StyledGrid size={4} className="item">
        <PublishedComponent
          pubRef="core.DatePicker"
          value={sameDiagnosisClaim.dateTo}
          module="claim"
          label="ClaimMasterPanelExt.InsureeLastVisit.lastClaimAtTo"
          readOnly={true}
        />
      </StyledGrid>
      <Button variant="contained" color="primary" onClick={() => goToClaimUuid(sameDiagnosisClaim.uuid)}>
        {formatMessage("ClaimMasterPanelExt.InsureeInfo.goToClaim.Button")}
      </Button>
    </Grid>
  );
};

export default AdditionalPanelClaim;
