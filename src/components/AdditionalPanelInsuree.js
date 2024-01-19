import React from "react";

import { Grid } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";

import { useModulesManager, useTranslations, TextInput, PublishedComponent, useGraphqlQuery } from "@openimis/fe-core";
import { calculateAge, calculateDuration } from "../utils/utils";

export const useStyles = makeStyles((theme) => ({
  tableHeader: theme.table.header,
  item: theme.paper.item,
}));

const AdditionalPanelInsuree = ({ dateTo, claimCode, dateFrom, insuree, dateClaimed }) => {
  const modulesManager = useModulesManager();
  const classes = useStyles();
  const { formatMessage } = useTranslations("claim", modulesManager);

  const visitDuration = calculateDuration(dateTo, dateFrom, formatMessage);
  const insureeAge = calculateAge(insuree?.dob, dateClaimed, formatMessage);

  const { data: firstServicePoint } = useGraphqlQuery(
    `
    query AdditionalPanelInsuree($claimCode: String, $insureeCode: String) {
      fspFromClaim(claimCode: $claimCode, insureeCode: $insureeCode)
      ${modulesManager.getProjection("location.HealthFacilityPicker.projection")}
    }
  `,
    { claimCode, insureeCode: insuree?.chfId },
    { skip: !claimCode || !insuree?.chfId },
  );

  return (
    <Grid item xs={6} className={classes.item}>
      <Grid container>
        <Grid className={classes.item} xs={4}>
          <TextInput
            module="claim"
            label="ClaimMasterPanelExt.InsureeInfo.insureeAge"
            name="insureeAge"
            readOnly={true}
            withNull={true}
            value={insureeAge}
          />
        </Grid>
        <Grid className={classes.item} xs={4}>
          <TextInput
            module="claim"
            label="ClaimMasterPanelExt.InsureeInfo.visitDuration"
            name="lastClaimDays"
            displayZero={true}
            readOnly={true}
            value={visitDuration}
          />
        </Grid>
        <Grid className={classes.item} xs={4}>
          <PublishedComponent
            module="claim"
            pubRef="location.HealthFacilityPicker"
            label={formatMessage("ClaimMasterPanelExt.InsureeInfo.FSP")}
            value={firstServicePoint?.fspFromClaim ?? null}
            district={null}
            readOnly={true}
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default AdditionalPanelInsuree;
