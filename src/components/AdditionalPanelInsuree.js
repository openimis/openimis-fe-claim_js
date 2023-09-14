import React from "react";

import { Grid } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";

import { useModulesManager, useTranslations, TextInput, PublishedComponent } from "@openimis/fe-core";
import { calculateAge, calculateDuration } from "../utils/utils";

export const useStyles = makeStyles((theme) => ({
  tableHeader: theme.table.header,
  item: theme.paper.item,
}));

const AdditionalPanelInsuree = ({ dateTo, dateFrom, insuree, dateClaimed }) => {
  const modulesManager = useModulesManager();
  const classes = useStyles();
  const { formatMessage } = useTranslations("claim", modulesManager);

  const visitDuration = calculateDuration(dateTo, dateFrom, formatMessage);
  const insureeAge = calculateAge(insuree?.dob, dateClaimed, formatMessage);

  return (
    <Grid item xs={6} className={classes.item}>
      <Grid className={classes.item}>
        <TextInput
          module="claim"
          label="ClaimMasterPanelExt.InsureeInfo.insureeAge"
          name="insureeAge"
          readOnly={true}
          withNull={true}
          value={insureeAge}
        />
      </Grid>
      <Grid className={classes.item}>
        <TextInput
          module="claim"
          label="ClaimMasterPanelExt.InsureeInfo.visitDuration"
          name="lastClaimDays"
          displayZero={true}
          readOnly={true}
          value={visitDuration}
        />
      </Grid>
      <Grid className={classes.item}>
        <PublishedComponent
          pubRef="location.HealthFacilityPicker"
          label={formatMessage("ClaimMasterPanelExt.InsureeInfo.FSP")}
          value={insuree?.healthFacility ?? null}
          district={null}
          module="claim"
          readOnly={true}
        />
      </Grid>
    </Grid>
  );
};

export default AdditionalPanelInsuree;
