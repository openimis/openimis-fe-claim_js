import { Grid } from "@material-ui/core";
import { PublishedComponent, useModulesManager, useTranslations } from "@openimis/fe-core";
import React from "react";

const ClaimPercentageReferralsReport = (props) => {
  const { values, setValues } = props;
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("claim", modulesManager);

  return (
    <Grid container direction="column" spacing={1}>
      <Grid item>
        <PublishedComponent
          pubRef="location.RegionPicker"
          label={formatMessage("ClaimPercentageReferralsReport.region")}
          onChange={(region) =>
            setValues({
              ...values,
              region,
            })
          }
          required
          value={values.region}
        />
      </Grid>
      <Grid item>
        <PublishedComponent
          pubRef="location.DistrictPicker"
          label={formatMessage("ClaimPercentageReferralsReport.district")}
          onChange={(district) =>
            setValues({
              ...values,
              district,
            })
          }
          required
          value={values.district}
        />
      </Grid>
      <Grid item>
        <PublishedComponent
          pubRef="core.DatePicker"
          value={values.dateStart}
          module="claim"
          required
          label="ClaimPercentageReferralsReport.dateStart"
          onChange={(dateStart) => setValues({ ...values, dateStart })}
        />
      </Grid>
      <Grid item>
        <PublishedComponent
          pubRef="core.DatePicker"
          value={values.dateEnd}
          module="claim"
          required
          label="ClaimPercentageReferralsReport.dateEnd"
          onChange={(dateEnd) => setValues({ ...values, dateEnd })}
        />
      </Grid>
    </Grid>
  );
};

export default ClaimPercentageReferralsReport;
