import React from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";

import { ATTACHMENT_TYPE_STATUS } from "../constants";

const AttachmentGeneralTypePicker = (props) => {
  return (
    <ConstantBasedPicker
      module="claim"
      label="attachmentGeneralType"
      withLabel={false}
      constants={ATTACHMENT_TYPE_STATUS}
      {...props}
    />
  );
};

export default AttachmentGeneralTypePicker;
