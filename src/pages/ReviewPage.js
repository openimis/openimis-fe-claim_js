import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { withModulesManager, withHistory, formatMessageWithValues, historyPush, journalize } from "@openimis/fe-core";
import ClaimForm from "../components/ClaimForm";
import { saveReview, deliverReview } from "../actions";
import _ from "lodash";

const styles = (theme) => ({
  page: theme.page,
});

class ReviewPage extends Component {
  state = {
    close: false,
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.submittingMutation && !this.props.submittingMutation) {
      if (this.state.close) {
        historyPush(this.props.modulesManager, this.props.history, "claim.route.reviews");
      }
    }
  }

  save = (claim) => {
    if (!!claim && (!!claim.items || !!claim.services)) {
      this.setState({ close: false }, (e) =>
        this.props.saveReview(
          claim,
          formatMessageWithValues(this.props.intl, "claim", "SaveClaimReview.mutationLabel", { code: claim.code }),
        ),
      );
    }
  };

  deliverReview = (claim) => {
    if (!!claim && (!!claim.items || !!claim.services)) {
      this.setState({ close: true }, (e) =>
        this.props.deliverReview(
          [claim],
          formatMessageWithValues(this.props.intl, "claim", "DeliverClaimReview.mutationLabel", { code: claim.code }),
        ),
      );
    }
  };

  render() {
    const { classes, history, modulesManager, claim_uuid } = this.props;
    return (
      <div className={classes.page}>
        <ClaimForm
          claim_uuid={claim_uuid}
          back={(e) => historyPush(modulesManager, history, "claim.route.reviews")}
          save={this.save}
          deliverReview={this.deliverReview}
          forReview={true}
        />
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  claim_uuid: props.match.params.claim_uuid,
  submittingMutation: state.claim.submittingMutation,
  mutation: state.claim.mutation,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ deliverReview, saveReview, journalize }, dispatch);
};

export default withHistory(
  withModulesManager(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(ReviewPage)))),
  ),
);
