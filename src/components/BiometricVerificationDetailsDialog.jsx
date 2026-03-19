import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { formatMessage, formatMessageWithValues, ProgressOrError } from "@openimis/fe-core";
import { fetchClaimFacialAudits } from "../actions";

class BiometricVerificationDetailsDialog extends Component {
  state = {
    averageScore: null,
    averageThreshold: null,
    isAboveThreshold: false,
    passedCount: 0,
    failedCount: 0,
  };

  componentDidUpdate(prevProps) {
    // Fetch facial audits when dialog opens
    if (this.props.open && !prevProps.open && this.props.claimUuid) {
      console.log('[BiometricDialog] Fetching audits for claim:', this.props.claimUuid);
      this.props.fetchClaimFacialAudits(this.props.claimUuid);
    }

    // Calculate average score when data changes
    if (prevProps.facialAudits !== this.props.facialAudits) {
      console.log('[BiometricDialog] Facial audits updated:', this.props.facialAudits);
      this.calculateAverageScore();
    }

    // Debug: log props changes
    if (prevProps.fetchingFacialAudits !== this.props.fetchingFacialAudits) {
      console.log('[BiometricDialog] fetchingFacialAudits changed to:', this.props.fetchingFacialAudits);
    }
  }

  calculateAverageScore = () => {
    const { facialAudits } = this.props;
    if (facialAudits && facialAudits.length > 0) {
      // Calculate success rate: % of verifications that passed
      const passedCount = facialAudits.filter(audit => audit.isVerified).length;
      const failedCount = facialAudits.length - passedCount;
      const successRate = (passedCount / facialAudits.length) * 100;

      // Consider success if >= 70% of verifications passed
      const isAbove = successRate >= 70;

      this.setState({
        averageScore: successRate.toFixed(2),
        averageThreshold: "70.00", // Success threshold
        isAboveThreshold: isAbove,
        passedCount: passedCount,
        failedCount: failedCount
      });
    } else {
      this.setState({
        averageScore: null,
        averageThreshold: null,
        isAboveThreshold: false,
        passedCount: 0,
        failedCount: 0
      });
    }
  };

  formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString(this.props.intl.locale || "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  getStatusChip = (isVerified) => {
    const { intl } = this.props;
    return isVerified ? (
      <Chip
        icon={<CheckCircleIcon />}
        label={formatMessage(intl, "claim", "biometricVerification.verified")}
        color="success"
        size="small"
      />
    ) : (
      <Chip
        icon={<CancelIcon />}
        label={formatMessage(intl, "claim", "biometricVerification.failed")}
        color="error"
        size="small"
      />
    );
  };

  render() {
    const {
      open,
      onClose,
      intl,
      facialAudits = [],
      fetchingFacialAudits,
      errorFacialAudits,
    } = this.props;
    const { averageScore, averageThreshold, isAboveThreshold } = this.state;

    console.log('[BiometricDialog] Render - fetchingFacialAudits:', fetchingFacialAudits);
    console.log('[BiometricDialog] Render - facialAudits:', facialAudits);
    console.log('[BiometricDialog] Render - errorFacialAudits:', errorFacialAudits);

    // Choose background color based on threshold comparison
    const backgroundGradient = isAboveThreshold
      ? "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" // Green gradient
      : "linear-gradient(135deg, #eb3349 0%, #f45c43 100%)"; // Red gradient

    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          {formatMessage(intl, "claim", "biometricVerification.title")}
        </DialogTitle>
        <DialogContent>
          <ProgressOrError progress={fetchingFacialAudits} error={errorFacialAudits} />

          {!fetchingFacialAudits && !errorFacialAudits && (
            <>
              {/* Average Verification Rate */}
              {averageScore !== null && (
                <Box
                  sx={{
                    mb: 3,
                    p: 2,
                    background: backgroundGradient,
                    borderRadius: 2,
                    color: "#fff",
                    textAlign: "center",
                    transition: "background 0.3s ease",
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Success Rate
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: "bold" }}>
                    {averageScore}%
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                    {this.state.passedCount} passed / {this.state.failedCount} failed ({facialAudits.length} total)
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 0.5, display: "block", fontSize: "0.85rem" }}>
                    Minimum threshold: {averageThreshold}%
                  </Typography>
                </Box>
              )}

              {/* Facial Audits Table */}
              {facialAudits.length === 0 ? (
                <Alert severity="info">
                  {formatMessage(intl, "claim", "biometricVerification.noData")}
                </Alert>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e0e0e0" }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        <TableCell>
                          <strong>{formatMessage(intl, "claim", "biometricVerification.step")}</strong>
                        </TableCell>
                        <TableCell>
                          <strong>{formatMessage(intl, "claim", "biometricVerification.date")}</strong>
                        </TableCell>
                        <TableCell align="center">
                          <strong>{formatMessage(intl, "claim", "biometricVerification.score")}</strong>
                        </TableCell>
                        <TableCell align="center">
                          <strong>{formatMessage(intl, "claim", "biometricVerification.threshold")}</strong>
                        </TableCell>
                        <TableCell align="center">
                          <strong>{formatMessage(intl, "claim", "biometricVerification.status")}</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {facialAudits.map((audit) => (
                        <TableRow
                          key={audit.uuid}
                          sx={{
                            "&:hover": { backgroundColor: "#f9f9f9" },
                            backgroundColor: audit.isVerified ? "#f1f8f4" : "#fff5f5",
                          }}
                        >
                          <TableCell>{audit.stepName || "N/A"}</TableCell>
                          <TableCell>{this.formatDate(audit.auditDate)}</TableCell>
                          <TableCell align="center">
                            <strong>{(audit.similarityScore * 100).toFixed(2)}%</strong>
                          </TableCell>
                          <TableCell align="center">
                            {(audit.thresholdUsed * 100).toFixed(2)}%
                          </TableCell>
                          <TableCell align="center">
                            {this.getStatusChip(audit.isVerified)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary" variant="contained">
            {formatMessage(intl, "claim", "biometricVerification.close")}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

const mapStateToProps = (state) => ({
  fetchingFacialAudits: state.claim.fetchingFacialAudits,
  fetchedFacialAudits: state.claim.fetchedFacialAudits,
  facialAudits: state.claim.facialAudits,
  errorFacialAudits: state.claim.errorFacialAudits,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      fetchClaimFacialAudits,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(BiometricVerificationDetailsDialog));
