import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";

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
import { withTheme, withStyles } from "@material-ui/core/styles";
import SaveIcon from "@material-ui/icons/SaveAlt";
import DeleteIcon from "@material-ui/icons/Delete";
import FileIcon from "@material-ui/icons/Add";
import LinkIcon from "@material-ui/icons/Link";

import {
  FormattedMessage,
  withModulesManager,
  ProgressOrError,
  Table,
  TextInput,
  PublishedComponent,
  withTooltip,
  formatMessage,
  formatMessageWithValues,
  journalize,
  coreConfirm,
  coreAlert,
} from "@openimis/fe-core";
import {
  fetchClaimAttachments,
  downloadAttachment,
  deleteAttachment,
  createAttachment,
  updateAttachment,
} from "../actions";
import { DEFAULT, RIGHT_ADD, URL_TYPE_STRING } from "../constants";
import AttachmentGeneralTypePicker from "../pickers/AttachmentGeneralTypePicker";

const styles = (theme) => ({
  dialogTitle: theme.dialog.title,
  dialogContent: theme.dialog.content,
});

class AttachmentsDialog extends Component {
  constructor(props) {
    super(props);
    this.allowedDomainsAttachments = props.modulesManager.getConf(
      "fe-claim",
      "allowedDomainsAttachments",
      DEFAULT.ALLOWED_DOMAINS_ATTACHMENTS,
    );
  }

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
        claimAttachments.push({ title: "", type: "" });
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
    } else if (
      prevProps.confirmed !== this.props.confirmed &&
      !!this.props.confirmed &&
      !!this.state.attachmentToDelete
    ) {
      const title = this.state.attachmentToDelete.title ? `${this.state.attachmentToDelete.title}` : "";
      const filename = this.state.attachmentToDelete.filename ? `(${this.state.attachmentToDelete.filename})` : "";
      this.props.deleteAttachment(
        this.state.attachmentToDelete,
        formatMessageWithValues(this.props.intl, "claim", "claim.ClaimAttachment.delete.mutationLabel", {
          file: `${title} ${filename}`,
          code: `${this.props.claim.code}`,
        }),
      );
    }
  }

  onClose = () => this.setState({ open: false }, (e) => !!this.props.close && this.props.close());

  validateUrl(url, omitValidation = false) {
    let parsedUrl;

    if (omitValidation) {
      return { isValid: true, error: null };
    }

    try {
      parsedUrl = new URL(url);
    } catch (error) {
      return { isValid: false, error: "url.validation.invalidURL" };
    }

    if (this.allowedDomainsAttachments.length === 0) {
      return { isValid: true, error: null };
    }

    const enteredDomain = parsedUrl.hostname;
    const isDomainAllowed = this.allowedDomainsAttachments.some((allowedDomain) =>
      enteredDomain.endsWith(allowedDomain),
    );

    if (!isDomainAllowed) {
      return { isValid: false, error: "url.validation.notAllowed" };
    }

    return { isValid: true, error: null };
  }

  delete = (a, i) => {
    if (!!a.id) {
      const filename = a.filename ? `(${a.filename})` : "";
      this.setState({ attachmentToDelete: a }, (e) =>
        this.props.coreConfirm(
          formatMessage(this.props.intl, "claim", "deleteClaimAttachment.confirm.title"),
          formatMessageWithValues(this.props.intl, "claim", "deleteClaimAttachment.confirm.message", {
            file: `${a.title} ${filename}`,
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
      const filename = attachment.filename ? `(${attachment.filename})` : "";
      this.props
        .createAttachment(
          { ...attachment, claimUuid: this.state.claimUuid },
          formatMessageWithValues(this.props.intl, "claim", "claim.ClaimAttachment.create.mutationLabel", {
            file: `${attachment.title || ""} ${filename}`,
            code: `${this.props.claim.code}`,
          }),
        )
        .then(() => {
          if (
            !!this.props.claim &&
            !!this.props.claim.uuid &&
            attachment.generalType === URL_TYPE_STRING &&
            attachment.predefinedType?.isAutogenerated
          ) {
            this.props.fetchClaimAttachments(this.props.claim);
          }
        });
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
    const filename = attachment.filename ? `(${attachment.filename})` : "";
    this.props.updateAttachment(
      attachment,
      formatMessageWithValues(this.props.intl, "claim", "claim.ClaimAttachment.update.mutationLabel", {
        file: `${attachment.title || ""} ${filename}`,
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

  urlSelected = (f, i, autogeneratedUrl) => {
    const { coreAlert, intl } = this.props;
    const url = this.validateUrl(f, autogeneratedUrl);

    if (!url.isValid) {
      coreAlert(
        formatMessage(intl, "claim", "url.validation.error"),
        url.error
          ? formatMessage(intl, "claim", url.error)
          : formatMessage(intl, "claim", "url.validation.generalError"),
      );
      return;
    }

    if (!!f || autogeneratedUrl) {
      let claimAttachments = [...this.state.claimAttachments];
      claimAttachments[i].url = autogeneratedUrl ? "AUTO" : f;
      claimAttachments[i].mime = "text/x-uri";
      this.setState({ claimAttachments }, (e) => {
        this.addAttachment(f);
      });
    }
  };

  formatUrl(a, i) {
    const { claimAttachments, reset } = this.state;
    const autogeneratedUrl =
      claimAttachments[i].generalType === URL_TYPE_STRING && claimAttachments[i].predefinedType?.isAutogenerated;

    if (!!a.mime) {
      return (
        <Link onClick={() => window.open(a.url)} reset={reset}>
          {withTooltip(<LinkIcon />, a.url)}
        </Link>
      );
    }
    return (
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
        {!autogeneratedUrl && (
          <TextInput
            reset={reset}
            value={claimAttachments[i].url}
            onChange={(v) => this.updateAttachment(i, "url", v)}
          />
        )}
        <IconButton
          variant="contained"
          component="label"
          onClick={(f) => this.urlSelected(claimAttachments[i].url, i, autogeneratedUrl)}
        >
          <FileIcon />
        </IconButton>
      </div>
    );
  }

  updateAttachment = (i, key, value) => {
    var state = { ...this.state };
    state.claimAttachments[i][key] = value;
    state.updatedAttachments.add(i);
    state.reset = state.reset + 1;
    this.setState({ ...state });
  };

  cannotUpdate = (a, i) => {
    return i < this.state.claimAttachments.length - 1 && !!this.state.claimUuid && !a.id;
  };

  render() {
    const { classes, claim, readOnly = false, fetchingClaimAttachments, errorClaimAttachments } = this.props;
    const { open, claimAttachments, reset, updatedAttachments } = this.state;

    if (!claim) return null;

    const headers = [
      "claimAttachment.generalType",
      "claimAttachment.predefinedType",
      "claimAttachment.type",
      "claimAttachment.title",
      "claimAttachment.date",
      "claimAttachment.fileName",
    ];

    const itemFormatters = [
      (attachment, index) =>
        this.cannotUpdate(attachment, index) ? (
          claimAttachments[index].generalType
        ) : (
          <AttachmentGeneralTypePicker
            readOnly={claimAttachments[index].id}
            reset={reset}
            withNull={false}
            value={claimAttachments[index].generalType}
            onChange={(v) => this.updateAttachment(index, "generalType", v)}
          />
        ),
      (attachment, index) =>
        this.cannotUpdate(attachment, index) ? (
          claimAttachments[index].predefinedType?.claimAttachmentType ?? ""
        ) : (
          <PublishedComponent
            pubRef="claim.ClaimAttachmentPredefinedTypePicker"
            label="ClaimAttachmentPredefinedType"
            value={claimAttachments[index].predefinedType}
            module="claim"
            reset={reset}
            withLabel={false}
            withPlaceholder={false}
            readOnly={readOnly || !claimAttachments[index].generalType || claimAttachments[index].id}
            withNull={false}
            claimGeneralType={claimAttachments[index].generalType}
            required={true}
            onChange={(v) => this.updateAttachment(index, "predefinedType", v)}
          />
        ),
      (attachment, index) =>
        this.cannotUpdate(attachment, index) ? (
          claimAttachments[index].type
        ) : (
          <TextInput
            reset={reset}
            readOnly={readOnly}
            value={claimAttachments[index].type}
            onChange={(v) => this.updateAttachment(index, "type", v)}
          />
        ),
      (attachment, index) =>
        this.cannotUpdate(attachment, index) ? (
          claimAttachments[index].title
        ) : (
          <TextInput
            reset={reset}
            readOnly={readOnly}
            value={claimAttachments[index].title}
            onChange={(v) => this.updateAttachment(index, "title", v)}
          />
        ),
      (attachment, index) =>
        this.cannotUpdate(attachment, index) ? (
          claimAttachments[index].date
        ) : (
          <PublishedComponent
            pubRef="core.DatePicker"
            readOnly={readOnly}
            onChange={(v) => this.updateAttachment(index, "date", v)}
            value={claimAttachments[index].date || null}
            reset={reset}
          />
        ),
      (attachment, index) =>
        claimAttachments[index].url || claimAttachments[index].generalType === URL_TYPE_STRING
          ? this.formatUrl(attachment, index)
          : this.formatFileName(attachment, index),
    ];

    if (!readOnly) {
      headers.push("claimAttachment.action");
      itemFormatters.push((attachment, index) => {
        if (attachment.id && updatedAttachments.has(index)) {
          return (
            <IconButton onClick={(e) => this.update(index)}>
              <SaveIcon />
            </IconButton>
          );
        } else if (index < claimAttachments.length - 1) {
          return (
            <IconButton onClick={(e) => this.delete(attachment, index)}>
              <DeleteIcon />
            </IconButton>
          );
        }
        return null;
      });
    }

    return (
      <Dialog
        open={open}
        fullWidth={true}
        PaperProps={{
          style: {
            width: "800px",
            maxWidth: "none",
          },
        }}
      >
        <DialogTitle className={classes.dialogTitle}>
          <FormattedMessage module="claim" id="attachments.title" values={{ code: claim.code }} />
        </DialogTitle>
        <Divider />
        <DialogContent className={classes.dialogContent}>
          <ProgressOrError progress={fetchingClaimAttachments} error={errorClaimAttachments} />
          {!fetchingClaimAttachments && !errorClaimAttachments && (
            <Table module="claim" items={claimAttachments} headers={headers} itemFormatters={itemFormatters} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={this.onClose} variant="contained" color="primary">
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
      coreAlert,
    },
    dispatch,
  );
};

export default withModulesManager(
  connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(AttachmentsDialog)))),
);
