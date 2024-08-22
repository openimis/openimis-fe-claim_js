import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";

import { YES_NO } from "../constants";

class YesNoPicker extends Component{
    render(){
        return <ConstantBasedPicker module="claim" label="claim.preAuthorization" constants={YES_NO} {...this.props} />;
    }
}
export default YesNoPicker;