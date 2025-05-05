import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";

import { PATIENT_CONDITION } from "../constants";

const PatientConditionPicker = (props) => {
    return (
      <ConstantBasedPicker
        module="claim"
        label="patientCondition"
        constants={PATIENT_CONDITION}
        {...props}
      />
    );
  };

export default PatientConditionPicker;
