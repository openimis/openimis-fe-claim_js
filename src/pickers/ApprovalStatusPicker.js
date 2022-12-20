import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";

import { APPROVAL_STATUS } from "../constants";

class ApprovalStatusPicker extends Component {
  render() {
    return <ConstantBasedPicker module="claim" label="approvalStatus" constants={APPROVAL_STATUS} {...this.props} />;
  }
}

export default ApprovalStatusPicker;
