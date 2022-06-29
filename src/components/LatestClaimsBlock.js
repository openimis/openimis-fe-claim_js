import React, { useMemo } from "react";
import {
  Block,
  Table,
  useModulesManager,
  useTranslations,
  PublishedComponent,
  useHistory,
  historyPush,
} from "@openimis/fe-core";
import { Box, Button, Grid } from "@material-ui/core";
import { useLatestClaimsQuery } from "../hooks";

const HEADERS = [
  "claimSummaries.code",
  "claimSummaries.healthFacility",
  "claimSummaries.insuree",
  "claimSummaries.claimedDate",
  "claimSummaries.claimed",
  "claimSummaries.approved",
  "claimSummaries.claimStatus",
];

const LatestClaimsBlock = ({ user }) => {
  const modulesManager = useModulesManager();
  const { formatMessage, formatDateFromISO, formatAmount } = useTranslations("claim", modulesManager);
  const history = useHistory();
  const { data, isLoading } = useLatestClaimsQuery(
    { adminUuid: user.claimAdmin?.uuid },
    { skip: !user.claimAdmin?.uuid },
  );

  const itemFormatters = useMemo(
    () => [
      (claim) => claim.code,
      (claim) => (
        <PublishedComponent
          readOnly={true}
          pubRef="location.HealthFacilityPicker"
          withLabel={false}
          value={claim.healthFacility}
        />
      ),
      (claim) => (
        <PublishedComponent readOnly={true} pubRef="insuree.InsureePicker" withLabel={false} value={claim.insuree} />
      ),
      (claim) => formatDateFromISO(claim.dateClaimed),
      (claim) => formatAmount(claim.claimed),
      (claim) => formatAmount(claim.approved),
      (claim) => formatMessage(`claimStatus.${claim.status}`),
    ],
    [data],
  );

  const onDoubleClick = (claim) => {
    historyPush(modulesManager, history, "claim.route.claimEdit", [claim.uuid]);
  };

  const onSeeAllClick = () => {
    historyPush(modulesManager, history, "claim.route.healthFacilities");
  };

  if (!user.claimAdmin) {
    // Only claim admin can view this block
    return null;
  }

  return (
    <Grid item xs={12}>
      <Block
        title={
          <Box display="flex" alignItems="center" justifyContent="space-between">
            {formatMessage("LatestClaimsBlock.title")}
            <Button size="small" onClick={onSeeAllClick}>
              {formatMessage("LatestClaimsBlock.seeAllButton")}
            </Button>
          </Box>
        }
      >
        <Table
          onDoubleClick={onDoubleClick}
          size="small"
          fetching={isLoading}
          module="claim"
          items={data?.claims?.edges?.map((e) => e.node) ?? []}
          headers={HEADERS}
          itemFormatters={itemFormatters}
          withPagination={false}
        />
      </Block>
    </Grid>
  );
};

export default LatestClaimsBlock;
