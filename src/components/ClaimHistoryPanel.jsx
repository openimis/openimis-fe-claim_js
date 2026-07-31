import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { injectIntl } from "react-intl";
import {
  Accordion as ExpansionPanel,
  AccordionSummary as ExpansionPanelSummary,
  AccordionDetails as ExpansionPanelDetails,
  Typography,
  TableContainer,
  Paper,
  CircularProgress,
  Box,
} from "@mui/material";
import { GetIconComponent } from "@openimis/fe-core";
import { useModulesManager, useTranslations, Table, formatDateFromISO } from "@openimis/fe-core";
import { fetchClaimHistory } from "../actions";
import { styled } from "@mui/material/styles";

const ExpandMoreIcon = GetIconComponent("ExpandMore");

const StyledPaper = styled(Paper)(({ theme }) => ({
  " .panel": {
    margin: theme.spacing(0),
    '&:before': {
      display: 'none',
    },
  },
  " .panelSummary": {
    backgroundColor: theme.paper.header.backgroundColor,
    color: theme.palette.primary.main,
    minHeight: '36px !important',
    '&$expanded': {
      minHeight: '36px !important',
    },
  },
  " .panelExpandIcon": {
    color: theme.palette.primary.main,
  },
  " .panelSummaryContent": {
    margin: 0,
    '&$expanded': {
      margin: 0,
    },
  },
  " .expanded": {},
  " .panelTitle": {
    fontSize: '1.25rem',
    fontWeight: 500,
  },
  " .tableContainer": {
    width: '100%',
    boxShadow: 'none',
    backgroundColor: theme.paper.body.backgroundColor,
    padding: theme.spacing(0),
  },
  " .tableHeader": {
    backgroundColor: theme.palette.grey[300],
  },
  " .tableHeaderCell": {
    fontWeight: 'bold',
    color: theme.palette.primary.main,
  },
  " .loadingContainer": {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(2),
    width: '100%',
  },
}));

const ClaimHistoryPanel = ({ claim, claimUuid, onViewVersion, classes }) => {
  const dispatch = useDispatch();
  const { history, fetchingHistory, errorHistory } = useSelector((state) => state.claim);
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues, formatDateFromISO, formatAmount } = useTranslations("claim", modulesManager);
  const [expanded, setExpanded] = React.useState(false);

  useEffect(() => {
    if (!!claimUuid) dispatch(fetchClaimHistory(claimUuid));
  }, [claimUuid]);

  const handleChange = (event, isExpanded) => {
    setExpanded(isExpanded);
  };
  
  const headers = [
    "claimHistory.code",
    "claimHistory.dateClaimed",
    "claimHistory.dateProcessed",
    "claimHistory.feedbackStatus",
    "claimHistory.reviewStatus",
    "claimHistory.claimed",
    "claimHistory.approved",
    "claimHistory.status",
    "claimHistory.restoreId",
  ];

  const itemFormatters = [
    (claim) => claim.code || '—',
    (claim) => formatDateFromISO(claim.dateClaimed) || '—',
    (claim) => formatDateFromISO(claim.dateProcessed) || '—',
    (claim) => claim.feedbackStatus || '—',
    (claim) => claim.reviewStatus || '—',
    (claim) => claim.claimed ? formatAmount(claim.claimed) : '—',
    (claim) => claim.approved ? formatAmount(claim.approved) : '—',
    (claim) => claim.status || '—',
    (claim) => claim.restoreId || '—'
  ];
  
  return (
    <StyledPaper>
      <ExpansionPanel 
        expanded={expanded} 
        onChange={handleChange}
      >
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon className="panelExpandIcon" />}
          classes={{
            root: "panelSummary",
            content: "panelSummaryContent",
            expanded: "expanded",
          }}
        >
          <Typography className="panelTitle">
            {formatMessageWithValues("ClaimHistoryModal.title", { code: claim?.code || '' })}
          </Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className="panelsDetails">
          {fetchingHistory ? (
            <Box className="loadingContainer">
              <CircularProgress />
            </Box>
          ) : errorHistory ? (
            <Box color="error.main" p={2} width="100%">
              {errorHistory}
            </Box>
          ) : (
            <TableContainer component={Paper} className="tableContainer">
              <Table
                module="claim"
                headers={headers}
                itemFormatters={itemFormatters}
                items={history || []}
                withPagination={false}
                withPaper={false}
                sort={null}
                onDoubleClick={onViewVersion}
                rowStyle={(item, index) => ({
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                })}
              />
            </TableContainer>
          )}
        </ExpansionPanelDetails>
      </ExpansionPanel>
    </StyledPaper>
  );
};

export default injectIntl(ClaimHistoryPanel);
