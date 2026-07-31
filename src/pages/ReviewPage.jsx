import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { useTheme, styled } from "@mui/material/styles";
import { withModulesManager, withHistory, formatMessageWithValues, historyPush, journalize } from "@openimis/fe-core";
import ClaimForm from "../components/ClaimForm";
import { saveReview, deliverReview } from "../actions";
import _ from "lodash";

const StyledDiv = styled("div")(({ theme }) => ({
  ...theme?.page ?? {},
}));

class ReviewPage extends Component {
  state = {
    close: false,
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.submittingMutation && !this.props.submittingMutation) {
      if (this.state.close) {
        const { history, modulesManager  } = prevProps;
        const { customBackUri, customBackUuid } = prevProps.match?.params
        if (customBackUri) {
          historyPush(modulesManager, history, customBackUri, customBackUuid ? [customBackUuid] : null);
        } else {
          historyPush(this.props.modulesManager, this.props.history, "claim.route.reviews");
        }
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
    const { history, modulesManager, claim_uuid,  } = this.props;
    const { customBackUri, customBackUuid } = this.props.match?.params
    return (
      <StyledDiv className="page">
        <ClaimForm
          claim_uuid={claim_uuid}
          back={(e) => {
            
            if (customBackUri) {

              historyPush(modulesManager, history, customBackUri, customBackUuid ? [customBackUuid] : null);
            } else {
              historyPush(modulesManager, history, "claim.route.reviews");
            }
          }}
          save={this.save}
          deliverReview={this.deliverReview}
          forReview={true}
        />
      </StyledDiv>
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

export { StyledDiv };
export { ReviewPage };
export default withHistory(
  withModulesManager(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(ReviewPage)),
  ),
);
