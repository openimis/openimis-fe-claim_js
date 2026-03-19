import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { QRCodeSVG } from "qrcode.react";
import { formatMessage } from "@openimis/fe-core";

const BiometricQRCodeDialog = ({ open, onClose, insuree, claimCode, intl }) => {
  if (!insuree || !insuree.uuid) {
    return null;
  }

  if (!claimCode) {
    return null; // Don't show dialog if claim code doesn't exist yet
  }

  // Include both insuree UUID and claim code in the URL
  // The verification page will use these to link the audit to the claim
  const verificationUrl = `${window.location.origin}/front/biometric/verify/${insuree.uuid}?claimCode=${encodeURIComponent(claimCode)}`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {formatMessage(intl, "claim", "biometricQRCode.title")}
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            py: 2,
          }}
        >
          <Box
            sx={{
              padding: 2,
              background: "#fff",
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <QRCodeSVG
              value={verificationUrl}
              size={256}
              level="H"
              includeMargin={true}
            />
          </Box>

          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body1" gutterBottom>
              <strong>
                {formatMessage(intl, "claim", "biometricQRCode.insuree")}:
              </strong>{" "}
              {insuree.chfId || insuree.otherNames || "N/A"}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>
                {formatMessage(intl, "claim", "biometricQRCode.claimCode")}:
              </strong>{" "}
              {claimCode}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {formatMessage(intl, "claim", "biometricQRCode.instructions")}
            </Typography>
            <Typography
              variant="caption"
              color="textSecondary"
              sx={{
                mt: 2,
                display: "block",
                wordBreak: "break-all",
                fontSize: "0.7rem",
              }}
            >
              {verificationUrl}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => window.open(verificationUrl, '_blank')}
          color="secondary"
          variant="outlined"
          startIcon={<OpenInNewIcon />}
        >
          {formatMessage(intl, "claim", "biometricQRCode.openLink")}
        </Button>
        <Button onClick={onClose} color="primary" variant="contained">
          {formatMessage(intl, "claim", "biometricQRCode.close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BiometricQRCodeDialog;
