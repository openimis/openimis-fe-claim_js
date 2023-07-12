import React, { Component } from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";

import { Grid } from "@material-ui/core";

import {
    PublishedComponent,
} from "@openimis/fe-core";

const styles = theme => ({
    item: {
        padding: theme.spacing(1)
    },
})

class ClaimFilterByInsureeGender extends Component {
    render() {
        const { classes, filters, onChangeFilters } = this.props;
        return (
            <Grid item xs={1} className={classes.item}>
                <PublishedComponent
                    id="insuree.InsureeGenderPicker"
                    value={(filters['insureeGender'] && filters['insureeGender']['value'])}
                    onChange={(v, s) => onChangeFilters([
                        {
                            id: 'insureeGender',
                            value: v,
                            filter: `insuree_Gender_Code: "${v}"`
                        }
                    ])}
                />
            </Grid>
        )
    }
}

export default withTheme(withStyles(styles)(ClaimFilterByInsureeGender));