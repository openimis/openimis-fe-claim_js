import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";

import { FEEDBACK_STATUS } from "../constants";

class FeedbackStatusPicker extends Component {
  render() {
    return <ConstantBasedPicker module="claim" label="feedbackStatus" constants={FEEDBACK_STATUS} {...this.props} />;
  }
}

export default FeedbackStatusPicker;
