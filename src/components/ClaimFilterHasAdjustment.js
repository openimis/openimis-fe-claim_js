import React, { Component } from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Grid, FormControlLabel, Checkbox } from "@material-ui/core";
const styles = theme => ({
    item: {
        padding: theme.spacing(1)
    },
})

class ClaimFilterHasAttachments extends Component {
    state = {
        reset: 0,
        withAttachment: false,
    }
    componentDidUpdate(prevProps, prevState, snapshot){
        const { filters } = this.props;
        if (
            prevProps.filters['showAttachment'] !== this.props.filters['showAttachment'] &&
            !!this.props.filters['showAttachment'] &&
            this.state.withAttachment !== this.props.filters['showAttachment']['value']
        ) {
            this.setState({ withAttachment: this.props.filters['showAttachment']['value'] })
        }
    }
    _onChangeAttachment = () => {
        let filters = [
            {
                id: 'showAttachment',
                value: !this.state.withAttachment,
                filter: !this.state.withAttachment ? "attachmentsCount_Value_Gte: 1" : null
            }
        ];
        this.props.onChangeFilters(filters);
        this.setState({
            withAttachment: !this.state.withAttachment,
            reset: this.state.reset + 1,
        });
    }

    render() {
        const { classes, filters, onChangeFilters } = this.props;
        return (
            <Grid item xs={1} className={classes.item}>
                <FormControlLabel 
                        control={
                            <Checkbox
                                color="primary"
                                checked={this.state.withAttachment}
                                onChange={e => this._onChangeAttachment()}
                            />
                        }
                        label="Attachment"
                    />
            </Grid>
        )
    }
}

export default withTheme(withStyles(styles)(ClaimFilterHasAttachments));
