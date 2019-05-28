import React, { Component } from "react";
import { ProxyPage } from "@openimis/fe-core";


class ClaimsPage extends Component {
    render() {
        return <ProxyPage url="/FindClaims.aspx" />
    }
}

export { ClaimsPage };