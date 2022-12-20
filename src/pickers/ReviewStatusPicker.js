import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";

import { REVIEW_STATUS } from "../constants";

class ReviewStatusPicker extends Component {
  render() {
    return <ConstantBasedPicker module="claim" label="reviewStatus" constants={REVIEW_STATUS} {...this.props} />;
  }
}

export default ReviewStatusPicker;
