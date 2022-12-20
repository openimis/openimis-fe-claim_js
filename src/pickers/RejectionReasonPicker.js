import React, { Component } from "react";
import { SelectInput } from "@openimis/fe-core";
import { injectIntl } from "react-intl";
import { formatMessage } from "@openimis/fe-core";

import { REJECTION_REASONS } from "../constants";
import { Tooltip, Typography } from "@material-ui/core";

class RejectionReasonPicker extends Component {
  _onChange = (v) =>
    this.props.onChange(v, !!this.props.compact ? v : formatMessage(this.props.intl, "claim", `rejectionReason.${v}`));

  withTooltip = (c, t) => (!!this.props.compact ? <Tooltip title={t}>{c}</Tooltip> : { c });

  render() {
    const { intl, name, value, withNull = true, withLabel = true, readOnly = false } = this.props;
    if (readOnly) {
      return this.withTooltip(
        <Typography>{value}</Typography>,
        formatMessage(intl, "claim", `rejectionReason.${value}`),
      );
    }
    const options = withNull
      ? [
          {
            value: null,
            label: formatMessage(intl, "claim", "rejectionReason.null"),
          },
        ]
      : [];
    options.push(
      ...REJECTION_REASONS.map((v) => ({
        value: v,
        label: formatMessage(intl, "claim", `rejectionReason.${v}`),
      })),
    );
    return (
      <SelectInput
        module="claim"
        label={withLabel ? rejectionReason : null}
        options={options}
        name={name}
        value={value}
        onChange={this._onChange}
      />
    );
  }
}

export default injectIntl(RejectionReasonPicker);
