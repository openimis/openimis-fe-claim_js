import React from "react";
import { styled } from "@mui/material/styles";
import { Paper, Table, TableBody, TableCell, TableRow, Typography, Box } from "@mui/material";
import { useTranslations, useModulesManager } from "@openimis/fe-core";

const StyledPaper = styled(Paper)(({ theme }) => ({
  ...theme?.paper?.paper,
  marginTop: theme.spacing(2),
}));

const SummaryHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  backgroundColor: theme?.paper?.header?.backgroundColor,
}));

const SummaryTable = styled(Table)(({ theme }) => ({
  minWidth: 300,
  "& .MuiTableCell-root": {
    borderBottom: "none",
    padding: theme.spacing(1, 2),
  },
}));

const DividerCell = styled(TableCell)(({ theme }) => ({
  borderTop: `1px solid ${theme.palette.divider}`,
  margin: theme.spacing(1, 0),
}));

const TotalLabelCell = styled(TableCell)(() => ({
  width: "79%",
  fontSize: "1.1rem",
  fontWeight: 500,
}));

const TotalValueCell = styled(TableCell)(() => ({
  textAlign: "left",
  fontSize: "1.1rem",
  fontWeight: 500,
}));

const ApprovedRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: theme.palette.action.hover,
}));

const ClaimSummaryPanel = ({
  totalItems = 0,
  totalServices = 0,
  totalClaimed = 0,
  totalApproved = 0,
  showApproved = false,
}) => {
  const modulesManager = useModulesManager();
  const { formatMessage, formatAmount } = useTranslations("claim", modulesManager);

  return (
    <StyledPaper>
      <SummaryHeader display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">
          {formatMessage("ClaimSummary")}
        </Typography>
      </SummaryHeader>
      <SummaryTable size="small">
        <TableBody>
          <TableRow>
            <TotalLabelCell>
              {formatMessage("totalServices")}:
            </TotalLabelCell>
            <TotalValueCell>
              {formatAmount(totalServices)}
            </TotalValueCell>
          </TableRow>
          
          <TableRow>
            <TotalLabelCell>
              {formatMessage("totalItems")}:
            </TotalLabelCell>
            <TotalValueCell>
              {formatAmount(totalItems)}
            </TotalValueCell>
          </TableRow>
          
          <TableRow>
            <TotalLabelCell>
              <strong>{formatMessage("totalClaimed")}:</strong>
            </TotalLabelCell>
            <TotalValueCell>
              <strong>{formatAmount(totalClaimed)}</strong>
            </TotalValueCell>
          </TableRow>

          {showApproved && (
            <>
              <TableRow>
                <DividerCell colSpan={2} />
              </TableRow>
              <ApprovedRow>
                <TotalLabelCell>
                  <strong>{formatMessage("totalApproved")}:</strong>
                </TotalLabelCell>
                <TotalValueCell>
                  <strong>{formatAmount(totalApproved)}</strong>
                </TotalValueCell>
              </ApprovedRow>
            </>
          )}
        </TableBody>
      </SummaryTable>
    </StyledPaper>
  );
};

export default ClaimSummaryPanel;
