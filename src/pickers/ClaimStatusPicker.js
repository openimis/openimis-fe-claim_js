import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";

import { CLAIM_STATUS } from "../constants";

class ClaimStatusPicker extends Component {
  render() {
    return <ConstantBasedPicker module="claim" label="claimStatus" constants={CLAIM_STATUS} {...this.props} />;
  }
}

export default ClaimStatusPicker;
