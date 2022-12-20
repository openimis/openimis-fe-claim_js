import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { formatMessageWithValues, withModulesManager, withHistory, historyPush } from "@openimis/fe-core";
import ClaimForm from "../components/ClaimForm";
import { createClaim, updateClaim } from "../actions";
import { RIGHT_ADD, RIGHT_LOAD } from "../constants";

const styles = (theme) => ({
  page: theme.page,
});

class EditPage extends Component {
  add = () => {
    historyPush(this.props.modulesManager, this.props.history, "claim.route.claimEdit");
  };

  save = (claim) => {
    if (!claim.uuid) {
      this.props.createClaim(
        this.props.modulesManager,
        claim,
        formatMessageWithValues(this.props.intl, "claim", "CreateClaim.mutationLabel", { code: claim.code }),
      );
    } else {
      this.props.updateClaim(
        this.props.modulesManager,
        claim,
        formatMessageWithValues(this.props.intl, "claim", "UpdateClaim.mutationLabel", { code: claim.code }),
      );
    }
  };

  render() {
    const { classes, modulesManager, history, rights, claim_uuid } = this.props;
    if (!rights.includes(RIGHT_LOAD)) return null;

    return (
      <div className={classes.page}>
        <ClaimForm
          claim_uuid={claim_uuid}
          back={(e) => historyPush(modulesManager, history, "claim.route.healthFacilities")}
          add={rights.includes(RIGHT_ADD) ? this.add : null}
          save={rights.includes(RIGHT_LOAD) ? this.save : null}
        />
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  claim_uuid: props.match.params.claim_uuid,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ createClaim, updateClaim }, dispatch);
};

export default withHistory(
  withModulesManager(connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(EditPage))))),
);
