import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import SaveIcon from "@material-ui/icons/SaveAlt";
import DeleteIcon from "@material-ui/icons/Delete";
import FileIcon from "@material-ui/icons/Add";
import {
  Dialog,
  DialogTitle,
  Divider,
  Button,
  DialogActions,
  DialogContent,
  Link,
  IconButton,
} from "@material-ui/core";
import {
  FormattedMessage,
  withModulesManager,
  ProgressOrError,
  Table,
  TextInput,
  PublishedComponent,
  formatMessage,
  formatMessageWithValues,
  journalize,
  coreConfirm
} from "@openimis/fe-core";
import {
  fetchClaimAttachments,
  downloadAttachment,
  deleteAttachment,
  createAttachment,
  updateAttachment,
} from "../actions";
import { RIGHT_ADD } from "../constants";

const styles = (theme) => ({
  dialogTitle: theme.dialog.title,
  dialogContent: theme.dialog.content,
});


class AttachmentsDialog extends Component {
  state = {
    open: false,
    claimUuid: null,
    claimAttachments: [],
    attachmentToDelete: null,
    updatedAttachments: new Set(),
    reset: 0,
  };

  componentDidUpdate(prevProps, props, snapshot) {
    const { readOnly = false } = this.props;
    if (!_.isEqual(prevProps.claimAttachments, this.props.claimAttachments)) {
      var claimAttachments = [...(this.props.claimAttachments || [])];
      if (!this.props.readOnly && this.props.rights.includes(RIGHT_ADD)) {
        claimAttachments.push({});
      }
      this.setState({ claimAttachments, updatedAttachments: new Set() });
    } else if (!_.isEqual(prevProps.claim, this.props.claim) && !!this.props.claim && !!this.props.claim.uuid) {
      this.setState(
        (state, props) => ({
          open: true,
          claimUuid: props.claim.uuid,
          claimAttachments: readOnly ? [] : [{}],
          updatedAttachments: new Set(),
        }),
        (e) => {
          if (!!this.props.claim && !!this.props.claim.uuid) {
            this.props.fetchClaimAttachments(this.props.claim);
          }
        },
      );
    } else if (!_.isEqual(prevProps.claim, this.props.claim) && !!this.props.claim && !this.props.claim.uuid) {
      let claimAttachments = [...(this.props.claim.attachments || [])];
      if (!readOnly) {
        claimAttachments.push({});
        this.props.onUpdated();
      }
      this.setState({ open: true, claimUuid: null, claimAttachments, updatedAttachments: new Set() });
    } else if (prevProps.submittingMutation && !this.props.submittingMutation) {
      var claimAttachments = [...this.state.claimAttachments];
      if (!!this.state.attachmentToDelete) {
        claimAttachments = claimAttachments.filter((a) => a.id !== this.state.attachmentToDelete.id);
      } else if (!_.isEqual(_.last(claimAttachments), {})) {
        claimAttachments.push({});
      }
      this.setState((state) => ({
        claimAttachments,
        updatedAttachments: new Set(),
        attachmentToDelete: null,
        reset: state.reset + 1,
      }));
      // called from ClaimForm!
      // this.props.journalize(this.props.mutation);
    } else if (
      prevProps.confirmed !== this.props.confirmed &&
      !!this.props.confirmed &&
      !!this.state.attachmentToDelete
    ) {
      this.props.deleteAttachment(
        this.state.attachmentToDelete,
        formatMessageWithValues(this.props.intl, "claim", "claim.ClaimAttachment.delete.mutationLabel", {
          file: `${this.state.attachmentToDelete.title} (${this.state.attachmentToDelete.filename})`,
          code: `${this.props.claim.code}`,
        }),
      );
    }
  }

  onClose = () => this.setState({ open: false }, (e) => !!this.props.close && this.props.close());

  delete = (a, i) => {
    if (!!a.id) {
      this.setState({ attachmentToDelete: a }, (e) =>
        this.props.coreConfirm(
          formatMessage(this.props.intl, "claim", "deleteClaimAttachment.confirm.title"),
          formatMessageWithValues(this.props.intl, "claim", "deleteClaimAttachment.confirm.message", {
            file: `${a.title} (${a.filename})`,
          }),
        ),
      );
    } else {
      var claimAttachments = [...this.state.claimAttachments];
      claimAttachments.splice(i, 1);
      claimAttachments.pop();
      this.props.claim.attachments = [...claimAttachments];
      claimAttachments.push({});
      this.setState((state) => ({ claimAttachments, reset: state.reset + 1 }));
    }
  };

  addAttachment = (document) => {
    let attachment = { ..._.last(this.state.claimAttachments), document };
    if (!!this.state.claimUuid) {
      this.props.createAttachment(
        { ...attachment, claimUuid: this.state.claimUuid },
        formatMessageWithValues(this.props.intl, "claim", "claim.ClaimAttachment.create.mutationLabel", {
          file: `${attachment.title} (${attachment.filename})`,
          code: `${this.props.claim.code}`,
        }),
      );
    } else {
      if (!this.props.claim.attachments) {
        this.props.claim.attachments = [];
      }
      this.props.claim.attachments.push(attachment);
      var claimAttachments = [...this.state.claimAttachments];
      claimAttachments.push({});
      this.setState({ claimAttachments });
    }
  };

  update = (i) => {
    let attachment = { claimUuid: this.state.claimUuid, ...this.state.claimAttachments[i] };
    this.props.updateAttachment(
      attachment,
      formatMessageWithValues(this.props.intl, "claim", "claim.ClaimAttachment.update.mutationLabel", {
        file: `${attachment.title} (${attachment.filename})`,
        code: `${this.props.claim.code}`,
      }),
    );
  };

  download = (a) => {
    this.props.downloadAttachment(a);
  };

  fileSelected = (f, i) => {
    if (!!f.target.files) {
      const file = f.target.files[0];
      let claimAttachments = [...this.state.claimAttachments];
      claimAttachments[i].filename = file.name;
      claimAttachments[i].mime = file.type;
      this.setState({ claimAttachments }, (e) => {
        var reader = new FileReader();
        reader.onloadend = (loaded) => {
          this.addAttachment(btoa(loaded.target.result));
        };
        reader.readAsBinaryString(file);
      });
    }
  };

  formatFileName(a, i) {
    if (!!a.id)
      return (
        <Link onClick={(e) => this.download(a)} reset={this.state.reset}>
          {a.filename || ""}
        </Link>
      );
    if (!!a.filename) return <i>{a.filename}</i>;
    return (
      <IconButton variant="contained" component="label">
        <FileIcon />
        <input type="file" style={{ display: "none" }} onChange={(f) => this.fileSelected(f, i)} />
      </IconButton>
    );
  }

  updateAttachment = (i, key, value) => {
    var state = { ...this.state };
    state.claimAttachments[i][key] = value;
    state.updatedAttachments.add(i);
    state.reset = state.reset + 1;
    this.setState({ ...state });
  };

  cannotUpdate = (a, i) => i < this.state.claimAttachments.length - 1 && !!this.state.claimUuid && !a.id;

  render() {
    const { classes, claim, readOnly = false, fetchingClaimAttachments, errorClaimAttachments } = this.props;
    const { open, claimAttachments } = this.state;
    if (!claim) return null;
    var headers = ["claimAttachment.type", "claimAttachment.title", "claimAttachment.date", "claimAttachment.fileName"];
    var itemFormatters = [
      (a, i) =>
        this.cannotUpdate(a, i) ? (
          this.state.claimAttachments[i].type
        ) : (
          <TextInput
            reset={this.state.reset}
            value={this.state.claimAttachments[i].type}
            onChange={(v) => this.updateAttachment(i, "type", v)}
          />
        ),
      (a, i) =>
        this.cannotUpdate(a, i) ? (
          this.state.claimAttachments[i].title
        ) : (
          <TextInput
            reset={this.state.reset}
            value={this.state.claimAttachments[i].title}
            onChange={(v) => this.updateAttachment(i, "title", v)}
          />
        ),
      (a, i) =>
        this.cannotUpdate(a, i) ? (
          this.state.claimAttachments[i].date
        ) : (
          <PublishedComponent
            pubRef="core.DatePicker"
            onChange={(v) => this.updateAttachment(i, "date", v)}
            value={this.state.claimAttachments[i].date || null}
            reset={this.state.reset}
          />
        ),
      (a, i) => this.formatFileName(a, i),
    ];
    if (!readOnly) {
      headers.push("claimAttachment.action");
      itemFormatters.push((a, i) => {
        if (!!a.id && this.state.updatedAttachments.has(i)) {
          return (
            <IconButton onClick={(e) => this.update(i)}>
              <SaveIcon />
            </IconButton>
          );
        } else if (i < this.state.claimAttachments.length - 1) {
          return (
            <IconButton onClick={(e) => this.delete(a, i)}>
              <DeleteIcon />
            </IconButton>
          );
        }
        return null;
      });
    }
    return (
      <Dialog open={open} fullWidth={true}>
        <DialogTitle className={classes.dialogTitle}>
          <FormattedMessage module="claim" id="attachments.title" values={{ "code": claim.code }} />
        </DialogTitle>
        <Divider />
          <DialogContent className={classes.dialogContent}>
            <ProgressOrError progress={fetchingClaimAttachments} error={errorClaimAttachments} />
            {!fetchingClaimAttachments && !errorClaimAttachments && (
              <Table module="claim" items={claimAttachments} headers={headers} itemFormatters={itemFormatters} />
            )}
          </DialogContent>
        <DialogActions>
          <Button onClick={this.onClose} color="primary">
            <FormattedMessage module="claim" id="close" />
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  confirmed: state.core.confirmed,
  submittingMutation: state.claim.submittingMutation,
  mutation: state.claim.mutation,
  fetchingClaimAttachments: state.claim.fetchingClaimAttachments,
  fetchedClaimAttachments: state.claim.fetchedClaimAttachments,
  errorClaimAttachments: state.claim.errorClaimAttachments,
  claimAttachments: state.claim.claimAttachments,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      fetchClaimAttachments,
      downloadAttachment,
      deleteAttachment,
      createAttachment,
      updateAttachment,
      coreConfirm,
      journalize,
    },
    dispatch,
  );
};

export default withModulesManager(
  connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(AttachmentsDialog)))),
);
