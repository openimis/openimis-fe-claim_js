import React from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";

import { CARE_TYPE_STATUS } from "../constants";

const CareTypePicker = (props) => {
  return (
    <ConstantBasedPicker
      module="claim"
      label="careType"
      constants={CARE_TYPE_STATUS}
      {...props}
    />
  );
};

export default CareTypePicker;