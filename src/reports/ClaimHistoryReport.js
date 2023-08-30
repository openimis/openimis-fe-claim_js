import { Grid } from "@material-ui/core";
import { PublishedComponent, useModulesManager, useTranslations } from "@openimis/fe-core";
import React from "react";

const ClaimHistoryReport = (props) => {
  const { values, setValues } = props;
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("claim", modulesManager);

  return (
    <Grid container direction="column" spacing={1}>
      <Grid item>
        <PublishedComponent
          pubRef="core.DatePicker"
          value={values.dateStart}
          required
          module="claim"
          label={formatMessage("ClaimHistoryReport.dateStart")}
          onChange={(dateStart) => setValues({ ...values, dateStart })}
        />
      </Grid>
      <Grid item>
        <PublishedComponent
          pubRef="core.DatePicker"
          value={values.dateEnd}
          required
          module="claim"
          label={formatMessage("ClaimHistoryReport.dateEnd")}
          onChange={(dateEnd) => setValues({ ...values, dateEnd })}
        />
      </Grid>
      <Grid item>
        <PublishedComponent
          pubRef="insuree.InsureePicker"
          value={values.insuree}
          required
          module="claim"
          label={formatMessage("ClaimHistoryReport.insuree")}
          onChange={(insuree) => setValues({ ...values, insuree })}
        />
      </Grid>
      <Grid item>
        <PublishedComponent
          pubRef="location.LocationPicker"
          onChange={(region) =>
            setValues({
                ...values,
                region,
                district:null,
                hf:null
          })}
          value={values.region}
          locationLevel={0}
          label={formatMessage("ClaimHistoryReport.region")}
        />
      </Grid>
      <Grid item>
        <PublishedComponent
          pubRef="location.LocationPicker"
          onChange={(district) =>
            setValues({
                ...values,
                district,
                hf:null
          })}
          value={values.district}
          parentLocation={values.region}
          locationLevel={1}
          label={formatMessage("ClaimHistoryReport.district")}
        />
      </Grid>
      <Grid item>
        <PublishedComponent
          pubRef="location.HealthFacilityPicker"
          onChange={(hf) => setValues({ ...values, hf, })}
          region={values.region}
          district={values.district}
          value={values.hf}
          label={formatMessage("ClaimHistoryReport.hf")}
        />
      </Grid>
      <Grid item>
        <PublishedComponent
          pubRef="product.ProductPicker"
          value={values.product}
          label={formatMessage("ClaimHistoryReport.product")}
          onChange={(product) => setValues({ ...values, product })}
        />
      </Grid>
      <Grid item>
        <PublishedComponent
          pubRef="claim.ClaimStatusPicker"
          value={values.status}
          module="claim"
          label="claim.claimStatus"
          onChange={(status) => setValues({ ...values, status })}
        />
      </Grid>
    </Grid>
  );
};

export default ClaimHistoryReport;
