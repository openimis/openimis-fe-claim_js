import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";

import { ATTACHMENT_STATUS } from "../constants";

class AttachmentStatusPicker extends Component {
  render() {
    return <ConstantBasedPicker module="claim" label="attachmentStatus" constants={ATTACHMENT_STATUS} {...this.props} />;
  }
}

export default AttachmentStatusPicker;
