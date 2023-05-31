import React, { Component, Fragment } from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { injectIntl } from "react-intl";
import _ from "lodash";
import { Grid, Typography, Divider, Slider, Paper } from "@material-ui/core";
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

const styles = (theme) => ({
  paper: theme.paper.paper,
  paperHeader: theme.paper.header,
  paperHeaderAction: theme.paper.action,
  item: theme.paper.item,
  tristate: {
    width: "200px",
  },
  assessment: {
    width: "480px",
  },
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
    <Grid container alignItems="center" justify="center" direction="column">
      <Grid item>
        <FormattedMessage module="claim" id={`Feedback.${f}`} />
      </Grid>
      <Grid>
        <Slider
          className={this.props.classes.tristate}
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
    const { classes, edited, readOnly = false } = this.props;
    if (!edited.feedback) {
      edited.feedback = {};
    }
    return (
      <Paper className={classes.paper}>
        <Grid container>
          <Grid item xs={12} className={classes.paperHeader}>
            <Typography variant="h6">
              <FormattedMessage module="claim" id="Feedback" />
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Divider />
          </Grid>
          <Grid item xs={3} />
          <Grid item xs={6}>
            <Grid container alignItems="center" justify="center">
              <ControlledField
                module="claim"
                id="Feedback.date"
                field={
                  <Grid item xs={6} className={classes.item}>
                    <PublishedComponent
                      pubRef="core.DatePicker"
                      module="claim"
                      label="Feedback.date"
                      readOnly={readOnly}
                      value={edited.feedback.feedbackDate || null}
                      onChange={(d) => this._onChange("feedbackDate", `${d}T00:00:00`)}
                    />
                  </Grid>
                }
              />
              <ControlledField
                module="claim"
                id="Feedback.claimOfficer"
                field={
                  <Grid item xs={6} className={classes.item}>
                    <PublishedComponent
                      pubRef="claim.ClaimOfficerPicker"
                      readOnly={readOnly}
                      value={edited.feedback.officerId}
                      onChange={(v, s) => this._onChange("officerId", !!v ? decodeId(v.id) : null)}
                    />
                  </Grid>
                }
              />
              <ControlledField
                module="claim"
                id="Feedback.careRendered"
                field={
                  <Fragment>
                    <Grid item xs={6} className={classes.item}>
                      {this._tristate("careRendered")}
                    </Grid>
                  </Fragment>
                }
              />
              <ControlledField
                module="claim"
                id="Feedback.drugPrescribed"
                field={
                  <Fragment>
                    <Grid item xs={6} className={classes.item}>
                      {this._tristate("drugPrescribed")}
                    </Grid>
                  </Fragment>
                }
              />
              <ControlledField
                module="claim"
                id="Feedback.paymentAsked"
                field={
                  <Grid item xs={6} className={classes.item}>
                    {this._tristate("paymentAsked")}
                  </Grid>
                }
              />
              <ControlledField
                module="claim"
                id="Feedback.drugReceived"
                field={
                  <Grid item xs={6} className={classes.item}>
                    {this._tristate("drugReceived")}
                  </Grid>
                }
              />
              <Grid item xs={3} />
            </Grid>
          </Grid>
          <Grid item xs={12} className={classes.item}>
            <Divider />
          </Grid>
          <ControlledField
            module="claim"
            id="Feedback.overallAssesment"
            field={
              <Fragment>
                <Grid item xs={2} />
                <Grid item xs={8} className={classes.item}>
                  <Grid container alignItems="center" justify="center" direction="column">
                    <Grid item className={classes.assessmentContainer}>
                      <Typography gutterBottom>
                        <FormattedMessage module="claim" id="Feedback.overallAssesment" />
                      </Typography>
                    </Grid>
                    <Grid item>
                      <Slider
                        className={classes.assessment}
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
                </Grid>
              </Fragment>
            }
          />
          <Contributions contributionKey={CLAIM_FEEDBACK_CONTRIBUTION_KEY} />
        </Grid>
      </Paper>
    );
  }
}

export default injectIntl(withTheme(withStyles(styles)(ClaimFeedbackPanel)));
