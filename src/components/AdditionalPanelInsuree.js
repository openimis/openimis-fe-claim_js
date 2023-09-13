import React from "react";

import { Grid } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";

import {
  useModulesManager,
  useTranslations,
  NumberInput,
  PublishedComponent,
  getTimeDifferenceInDays,
} from "@openimis/fe-core";

export const useStyles = makeStyles((theme) => ({
  tableHeader: theme.table.header,
  item: theme.paper.item,
}));

const AdditionalPanelInsuree = ({ dateTo, dateFrom, insuree }) => {
  const modulesManager = useModulesManager();
  const classes = useStyles();
  const { formatMessage } = useTranslations("admin", modulesManager);

  const visitDuration = getTimeDifferenceInDays(dateTo ?? new Date(), dateFrom ?? new Date());

  return (
    <Grid item xs={6} className={classes.item}>
      <Grid className={classes.item}>
        <NumberInput
          module="claim"
          label="ClaimMasterPanelExt.InsureeInfo.insureeAge"
          name="insureeAge"
          readOnly={true}
          withNull={true}
          value={insuree?.age ?? 1}
        />
      </Grid>
      <Grid className={classes.item}>
        <NumberInput
          module="claim"
          label="ClaimMasterPanelExt.InsureeInfo."
          name="lastClaimDays"
          displayZero={true}
          readOnly={true}
          value={visitDuration === 0 ? 1 : visitDuration}
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
