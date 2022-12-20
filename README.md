# openIMIS Frontend Claim reference module

This repository holds the files of the openIMIS Frontend Claim reference module.
It is dedicated to be deployed as a module of [openimis-fe_js](https://github.com/openimis/openimis-fe_js).

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

## Main Menu Contributions

- Claims (claim.mainMenu translation key)

  **Health Facilities Claims** (claim.menu.healthFacilityClaims translation key), displayed if user has at least one of rights [111002, 111004, 111005, 111006 or 111007]

  **Reviews** (claim.menu.reviews translation key), displayed if user has at least one of the rights [111008, 111009, 111010; 111011]

## Other Contributions

- `core.Router`: registering the `claim/healthFacilities`, `claim/claim/:claim_uuid`, `claim/reviews`, `claim/review/:claim_uuid` and `claim/feedback/:claim_uuid` routes in openIMIS client-side router

## Available Contribution Points

- `claim.MainMenu` ability to add entries within the main menu entry (known usage: openimis-fe-claim_batch)
- `claim.Filter` ability to extend the ClaimFilter (inside the criteria form), used for HealthFacilities and Reviews screens
- `claim.HealthFacilitiesFilter` ability to extend the ClaimFilter (inside the criteria form), only for the HealthFacilities screen
- `claim.ReviewsFilter` ability to extend the ClaimFilter (inside the criteria form), only for the Reviews screen
- `claim.Searcher` ability to extend the ClaimSearcher (between the criteria form and the results table)
- `claim.ClaimForm` ability to extend the ClaimForm (entity displayed to add, edit, provide feedback and provide review)
- `claim.MasterPanel` ability to extend the first section (paper) of the ClaimForm
- `claim.ClaimFeedback` ability to extend the ClaimFeedbackPanel (i.e. feedback form)
- `claim.SelectionAction` ability to extend the ClaimSearcher action menu
- `claim.ReviewSelectionAction` ability to extend the ClaimReviewSearcher action menu

## Published Components

- `claim.ClaimAdminPicker`, suggestion-based picker bound to `claimAdmins` GraphQL query
- `claim.ClaimOfficerPicker`, suggestion-based picker bound to `claimOfficers`GraphQL query
- `claim.ClaimStatusPicker`, constant-based picker, translation keys: `claim.claimStatus.null`, `claim.claimStatus.1`,...
- `claim.FeedbackStatusPicker`, constant-based picker, translation keys: `claim.feedbackStatus.null`, `claim.feedbackStatus.1`,...
- `claim.ReviewStatusPicker`, constant-based picker, translation keys: `claim.reviewStatus.null`, `claim.reviewStatus.1`,...
- `claim.ApprovalStatusPicker`, constant-based picker, translation keys: `claim.approvalStatus.null`, `claim.approvalStatus.1`,...
- `claim.RejectionReasonPicker`, constant-based picker (with tooltip), translation keys: `claim.rejectionReason.null`, `claim.rejectionReason.1`,...
- `claim.ClaimMasterPanelExt`, ready to use extension for the `claim.MasterPanel`, loading the `policy.InsureePolicyEligibilitySummary` published component and displaying the last claim (visit) code, date from and date to

## Dispatched Redux Actions

- `CLAIM_CLAIM_ADMINS_{REQ|RESP|ERR}`: loading the claim admins cache
- `CLAIM_CLAIM_ADMIN_SELECTED`: when claim administrator is selected in filter (enable claim add button)
- `CLAIM_CLAIM_HEALTH_FACILITY_SELECTED`: when health facility is selected in filter (enable claim add button)
- `CLAIM_CLAIM_SEARCHER_{REQ|RESP|ERR}`: querying for claims (filter updates or refresh button pushed)
- `CLAIM_CLAIM_{REQ|RESP|ERR}`: loading a claim (double click on claim in result table)
- `CLAIM_LAST_CLAIM_AT_{REQ|RESP|ERR}`: loading the last (other) claim of the claim insuree at the claim health facility (cfr. `claim.ClaimMasterPanelExt`)
- `CLAIM_MUTATION_{REQ|ERR}`: sending a mutation (update, deliver feedback,...)
- `CLAIM_CREATE_CLAIM_RESP`: recieving the result of create claim mutation
- `CLAIM_UPDATE_CLAIM_RESP`: recieving the result of update claim mutation
- `CLAIM_SUBMIT_CLAIMS_RESP`: recieving the result of submit claim(s) mutation
- `CLAIM_DELETE_CLAIMS_RESP`: recieving the result of delete claim(s) mutation
- `CLAIM_SELECT_CLAIMS_FOR_FEEDBACK_RESP`: recieving the result of select claim(s) for feedback mutation
- `CLAIM_BYPASS_CLAIMS_FEEDBACK_RESP`: recieving the result of bypass claim(s) feedback mutation
- `CLAIM_SKIP_CLAIMS_FEEDBACK_RESP`: recieving the result of skip claim(s) feedback mutation
- `CLAIM_DELIVER_CLAIM_FEEDBACK_RESP`: recieving the result of deliver claim feedback mutation
- `CLAIM_SELECT_CLAIMS_FOR_REVIEW_RESP`: recieving the result of select claim(s) for review mutation
- `CLAIM_BYPASS_CLAIMS_REVIEW_RESP`: recieving the result of bypass claim(s) review mutation
- `CLAIM_SKIP_CLAIMS_REVIEW_RESP`: recieving the result of skip claim(s) review mutation
- `CLAIM_DELIVER_CLAIM_REVIEW_RESP`: recieving the result of deliver claim review mutation
- `CLAIM_PROCESS_CLAIMS_RESP`: recieving the result of process claim(s) mutation
- `CLAIM_PRINT`: emit print claim request
- `CLAIM_PRINT_DONE`: recieved print claim response (pdf)
- `CLAIM_EDIT_HEALTH_FACILITY_SET`: selected health facility in claim edit form. Known usage: `medical_pricelist` (to load the corresponding pricelist)

## Other Modules Listened Redux Actions

None

## Other Modules Redux State Bindings

- `state.core.user`, to access user info (rights,...)
- `state.medical_pricelist`, retrieving medical pricelist once health facility of claim selected (changed)
- `state.loc.userHealthFacilityFullPath`, retrieving user's heath facility (and its district and region)

## Configurations Options

- `debounceTime`: debounce time (ms) before triggering search in ClaimFilter (Default: 800)
- `newClaim.visitType`: default (pre-selected) visity type when creating a claim (Default: 'O' - Other)
- `claim.CreateClaim.feedbackStatus`: value set to feedback status when creating a claim (Default: 1)
- `claim.CreateClaim.reviewStatus`value set to review status when creating a claim (Default: 1)
- `claimFilter.rowsPerPageOptions`: pagination page size options in Claim Searcher component (Default: `[10, 20, 50, 100]`)
- `claimFilter.defaultPageSize`, pagination pre-selected page size options in Claim Searcher component (Default: `10`)
- `claimFilter.highlightAmount`, amount triggering the primary highligh (default bold) for claims in claim searcher result. Default: `0`, menaing no highlight threshold
- `claimFilter.highlightAltInsurees`, boolean to trigger the secondary highligh (default italic) for claims of the same insuree. Default: `true`
- `claimForm.codeMaxLength`, the max size of a claim code (id), default 8;
- `claimForm.fixedPricesAtEnter`, boolean to prevent user to adapt prices at claim entry (fixed to price list). Default: false (user can change the price)
- `claimForm.fixedPricesAtReview`, boolean to prevent user to adapt prices at claim review (fixed to price list). Default: false (user can change the price)
- `claimForm.showJustificationAtEnter`, boolean to display justification field(s) for items and services at claim entry. Default false;
- `claimForm.showAdjustmentAtEnter`, boolean to display adjustment field at claim entry. Default false;
- `claimForm.insureePicker`, the insuree picker to use when filling a claim. Default insuree.InsureeChfIdPicker (the exact chfid entry picker). Other pre-canned option (from insuree reference module): insuree.InsureePicker (dialog picker with search on chfid, last name and other names)
- `canSaveClaimWithoutServiceNorItem`, wherever user can save a claim without service nor item, default: true
- `canSubmitClaimWithZero`, wherever user can submit with 0 as claimed amount (probably a claim without service/item), default: false
- `claimAttachments`, boolean to enable/disable claim attachments. Default true;
