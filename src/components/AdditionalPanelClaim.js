import React from "react";

import { Grid, Button } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";

import {
  useModulesManager,
  useTranslations,
  PublishedComponent,
  useHistory,
  historyPush,
  FormattedMessage,
  TextInput,
} from "@openimis/fe-core";

export const useStyles = makeStyles((theme) => ({
  item: theme.paper.item,
}));

const AdditionalPanelClaim = ({ sameDiagnosisClaim }) => {
  const modulesManager = useModulesManager();
  const history = useHistory();
  const classes = useStyles();
  const { formatMessage } = useTranslations("claim", modulesManager);

  const goToClaimUuid = (uuid) => historyPush(modulesManager, history, "claim.route.claimEdit", [uuid], true);

  if (!sameDiagnosisClaim)
    return <FormattedMessage module="claim" id="ClaimMasterPanelExt.sameDiagnosisClaim.noClaim" />;

  return (
    <Grid container>
      <Grid xs={4} item className={classes.item}>
        <TextInput
          module="claim"
          label="ClaimMasterPanelExt.InsureeLastVisit.claimCode"
          readOnly={true}
          value={sameDiagnosisClaim.code}
        />
      </Grid>
      <Grid xs={4} item className={classes.item}>
        <PublishedComponent
          pubRef="core.DatePicker"
          value={sameDiagnosisClaim.dateFrom}
          module="claim"
          label="ClaimMasterPanelExt.InsureeLastVisit.lastClaimAtFrom"
          readOnly={true}
        />
      </Grid>
      <Grid xs={4} item className={classes.item}>
        <PublishedComponent
          pubRef="core.DatePicker"
          value={sameDiagnosisClaim.dateTo}
          module="claim"
          label="ClaimMasterPanelExt.InsureeLastVisit.lastClaimAtTo"
          readOnly={true}
        />
      </Grid>
      <Button variant="contained" color="primary" onClick={() => goToClaimUuid(sameDiagnosisClaim.uuid)}>
        {formatMessage("ClaimMasterPanelExt.InsureeInfo.goToClaim.Button")}
      </Button>
    </Grid>
  );
};

export default AdditionalPanelClaim;
