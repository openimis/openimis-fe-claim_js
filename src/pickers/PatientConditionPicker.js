import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";

import { PATIENT_CONDITION } from "../constants";

class PatientConditionPicker extends Component {
  render() {
    return (
      <ConstantBasedPicker
        module="claim"
        label="claim.patientCondition"
        constants={PATIENT_CONDITION}
        {...this.props}
      />
    );
  }
}

export default PatientConditionPicker;
