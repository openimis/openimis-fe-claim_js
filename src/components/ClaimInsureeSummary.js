import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useIntl } from "react-intl";

import { Typography, Grid, Paper, IconButton, Tooltip } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import VisibilityIcon from "@material-ui/icons/Visibility";

import { useModulesManager, useTranslations, Table, useHistory, historyPush, formatAmount } from "@openimis/fe-core";
import { fetchClaimSummaries } from "../actions";
import { MODULE_NAME } from "../constants";

const useStyles = makeStyles((theme) => ({
  page: theme.page,
  paper: theme.paper.paper,
  item: theme.paper.item,
  paperHeader: theme.paper.header,
  tableTitle: theme.table.title,
}));

const CLAIMS_HEADERS = [
  "claimSummaries.code",
  "claimSummaries.claimedDate",
  "ClaimFilter.healthFacility",
  "claimSummaries.processedDate",
  "claimSummaries.feedbackStatus",
  "claimSummaries.reviewStatus",
  "claimSummaries.claimed",
  "claimSummaries.approved",
  "claimSummaries.claimStatus",
  "emptyLabel",
];

const ClaimInsureeSummary = ({ insuree }) => {
  const dispatch = useDispatch();
  const modulesManager = useModulesManager();
  const classes = useStyles();
  const history = useHistory();
  const intl = useIntl();
  const { formatMessage, formatMessageWithValues, formatDateFromISO } = useTranslations(MODULE_NAME, modulesManager);

  const { claims, fetchingClaims, errorClaims, claimsPageInfo } = useSelector((store) => store.claim);
  const healthFacilityId = useSelector((store) => store.core.user.i_user.health_facility_id);

  const goToClaim = (claim) => historyPush(modulesManager, history, "claim.route.claimEdit", [claim.uuid]);

  const ITEMS_FORMATTERS = [
    (claim) => claim?.code,
    (claim) => formatDateFromISO(claim?.dateClaimed),
    (claim) => `${claim?.healthFacility?.code} ${claim?.healthFacility?.name}`,
    (claim) => formatDateFromISO(claim?.dateProcessed),
    (claim) => formatMessage(`feedbackStatus.${claim?.feedbackStatus}`),
    (claim) => formatMessage(`reviewStatus.${claim?.reviewStatus}`),
    (claim) => formatAmount(intl, claim?.claimed),
    (claim) => formatAmount(intl, claim?.approved),
    (claim) => formatMessage(`claimStatus.${claim?.status}`),
    (claim) => (
      <Tooltip title={formatMessage("ClaimMasterPanelExt.InsureeInfo.goToClaim.Button")}>
        <IconButton
          disabled={claim?.healthFacility?.id !== healthFacilityId}
          onClick={() => goToClaim(claim)}
        >
          <VisibilityIcon />
        </IconButton>
      </Tooltip>
    ),
  ];

  useEffect(() => {
    if (!insuree) return;

    const filters = [`insuree_ChfId: "${insuree.chfId}", orderBy: ["-dateClaimed"]`];
    dispatch(fetchClaimSummaries(modulesManager, filters));
  }, [insuree]);

  return (
    <Paper className={classes.paper}>
      <Grid container alignItems="center" direction="row" className={classes.paperHeader}>
        <Grid item xs={8}>
          <Typography className={classes.tableTitle}>
            {formatMessageWithValues("claimSummaries", { count: claimsPageInfo?.totalCount })}
          </Typography>
        </Grid>
      </Grid>
      <Table
        module="claim"
        error={errorClaims}
        fetching={fetchingClaims}
        headers={CLAIMS_HEADERS}
        itemFormatters={ITEMS_FORMATTERS}
        items={claims}
        withPagination={false}
      />
    </Paper>
  );
};

export default ClaimInsureeSummary;
