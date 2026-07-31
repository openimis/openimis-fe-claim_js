import React, { Component, Fragment } from "react";
import { useTheme, styled } from "@mui/material/styles";
import { injectIntl } from "react-intl";
import _ from "lodash";
import { Grid, Typography, Divider, Slider, Paper } from "@mui/material";
import {
  FormattedMessage,
  PublishedComponent,
  Contributions,
  formatMessage,
  decodeId,
  ControlledField,
} from "@openimis/fe-core";
import { FEEDBACK_ASSESSMENTS } from "../constants";

const CLAIM_FEEDBACK_CONTRIBUTION_KEY = "claim.ClaimFeedback";

const StyledPaper = styled(Paper)(({ theme }) => ({
  ...theme?.paper?.paper ?? {},
}));

const StyledHeaderGrid = styled(Grid)(({ theme }) => ({
  ...theme?.paper?.header ?? {},
}));

const StyledItemGrid = styled(Grid)(({ theme }) => ({
  ...theme?.paper?.item ?? {},
}));

const StyledTristateSlider = styled(Slider)({
  width: "200px",
});

const StyledAssessmentSlider = styled(Slider)({
  width: "480px",
});

class ClaimFeedbackPanel extends Component {
  constructor(props) {
    super(props);
    this.tristateMarks = [-1, 0, 1].map((value) => {
      return {
        value,
        label: formatMessage(props.intl, "claim", `Feedback.Tristate.${value}`),
      };
    });
    this.marks = FEEDBACK_ASSESSMENTS.map((value) => {
      return {
        value,
        label: formatMessage(props.intl, "claim", `Feedback.OverallAssesment.${value}`),
      };
    });
  }

  _onChange = (attr, v) => {
    let edited = { ...this.props.edited };
    edited.feedback[attr] = v;
    this.props.onEditedChanged(edited);
  };

  _onTristateChange = (f, value) => {
    switch (value) {
      case -1:
        this._onChange(f, null);
        break;
      case 0:
        this._onChange(f, false);
        break;
      case 1:
        this._onChange(f, true);
        break;
    }
  };

  _mapTristateValue = (v) => {
    switch (v) {
      case null:
        return -1;
      case undefined:
        return -1;
      case false:
        return 0;
      case true:
        return 1;
    }
  };

  _mapAssessmentValue = (v) => {
    switch (v) {
      case null:
        return -1;
      case undefined:
        return -1;
      default:
        return v;
    }
  };

  _tristate = (f) => (
    <Grid container alignItems="center" justifyContent="center" direction="column">
      <Grid>
        <FormattedMessage module="claim" id={`Feedback.${f}`} />
      </Grid>
      <Grid>
        <StyledTristateSlider
          className="tristate"
          min={-1}
          max={1}
          step={1}
          value={this._mapTristateValue(this.props.edited.feedback[f])}
          disabled={!!this.props.readOnly}
          defaultValue={0}
          valueLabelDisplay="off"
          marks={this.tristateMarks}
          onChange={(e, v) => this._onTristateChange(f, v)}
        />
      </Grid>
    </Grid>
  );

  render() {
    const { edited, readOnly = false } = this.props;
    if (!edited.feedback) {
      edited.feedback = {};
    }
    return (
      <StyledPaper className="paper">
        <Grid container>
          <StyledHeaderGrid size={12} className="paperHeader">
            <Typography variant="h6">
              <FormattedMessage module="claim" id="Feedback" />
            </Typography>
          </StyledHeaderGrid>
          <Grid size={12}>
            <Divider />
          </Grid>
          <Grid size={3} />
          <Grid size={6}>
            <Grid container alignItems="center" justify="center">
              <ControlledField
                module="claim"
                id="Feedback.date"
                field={
                  <StyledItemGrid size={6} className="item">
                    <PublishedComponent
                      pubRef="core.DatePicker"
                      module="claim"
                      label="Feedback.date"
                      readOnly={readOnly}
                      value={edited.feedback.feedbackDate || null}
                      onChange={(d) => this._onChange("feedbackDate", `${d}T00:00:00`)}
                    />
                  </StyledItemGrid>
                }
              />
              <ControlledField
                module="claim"
                id="Feedback.claimOfficer"
                field={
                  <StyledItemGrid size={6} className="item">
                    <PublishedComponent
                      pubRef="claim.ClaimOfficerPicker"
                      readOnly={readOnly}
                      value={edited.feedback.officerId}
                      onChange={(v, s) => this._onChange("officerId", !!v ? decodeId(v.id) : null)}
                    />
                  </StyledItemGrid>
                }
              />
              <ControlledField
                module="claim"
                id="Feedback.careRendered"
                field={
                  <Fragment>
                    <StyledItemGrid size={6} className="item">
                      {this._tristate("careRendered")}
                    </StyledItemGrid>
                  </Fragment>
                }
              />
              <ControlledField
                module="claim"
                id="Feedback.drugPrescribed"
                field={
                  <Fragment>
                    <StyledItemGrid size={6} className="item">
                      {this._tristate("drugPrescribed")}
                    </StyledItemGrid>
                  </Fragment>
                }
              />
              <ControlledField
                module="claim"
                id="Feedback.paymentAsked"
                field={
                  <StyledItemGrid size={6} className="item">
                    {this._tristate("paymentAsked")}
                  </StyledItemGrid>
                }
              />
              <ControlledField
                module="claim"
                id="Feedback.drugReceived"
                field={
                  <StyledItemGrid size={6} className="item">
                    {this._tristate("drugReceived")}
                  </StyledItemGrid>
                }
              />
              <Grid size={3} />
            </Grid>
          </Grid>
          <StyledItemGrid size={12} className="item">
            <Divider />
          </StyledItemGrid>
          <ControlledField
            module="claim"
            id="Feedback.overallAssesment"
            field={
              <Fragment>
                <Grid size={2} />
                <StyledItemGrid size={8} className="item">
                  <Grid container alignItems="center" justify="center" direction="column">
                    <Grid className="assessmentContainer">
                      <Typography gutterBottom>
                        <FormattedMessage module="claim" id="Feedback.overallAssesment" />
                      </Typography>
                    </Grid>
                    <Grid>
                      <StyledAssessmentSlider
                        className="assessment"
                        min={-1}
                        max={!!this.marks ? this.marks.length - 2 : -1}
                        step={1}
                        disabled={readOnly}
                        value={this._mapAssessmentValue(edited.feedback.asessment)}
                        defaultValue={-1}
                        valueLabelDisplay="off"
                        marks={this.marks}
                        onChange={(e, v) => this._onChange("asessment", v)}
                      />
                    </Grid>
                  </Grid>
                </StyledItemGrid>
              </Fragment>
            }
          />
          <Contributions contributionKey={CLAIM_FEEDBACK_CONTRIBUTION_KEY} />
        </Grid>
      </StyledPaper>
    );
  }
}

export { CLAIM_FEEDBACK_CONTRIBUTION_KEY };
export default injectIntl(ClaimFeedbackPanel);
