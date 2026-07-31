import { Grid } from "@mui/material";
import { PublishedComponent, useModulesManager, useTranslations } from "@openimis/fe-core";
import React from "react";

const ClaimPercentageReferralsReport = (props) => {
  const { values, setValues } = props;
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("claim", modulesManager);

  return (
    <Grid container direction="column" spacing={1}>
      <Grid>
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
      <Grid>
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
      <Grid>
        <PublishedComponent
          pubRef="core.DatePicker"
          value={values.dateStart}
          module="claim"
          required
          label="ClaimPercentageReferralsReport.dateStart"
          onChange={(dateStart) => setValues({ ...values, dateStart })}
        />
      </Grid>
      <Grid>
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
