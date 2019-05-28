import React, { Component } from "react";
import { ProxyPage } from "@openimis/fe-core";


class BatchPage extends Component {
    render() {
        return <ProxyPage url="/ProcessBatches.aspx" />
    }
}

export { BatchPage };