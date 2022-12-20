import {
  parseData,
  dispatchMutationReq,
  dispatchMutationResp,
  dispatchMutationErr,
  pageInfo,
  formatServerError,
  formatGraphQLError,
} from "@openimis/fe-core";

function reducer(
  state = {
    fetchingClaimAttachments: false,
    fetchedClaimAttachments: false,
    errorClaimAttachments: null,
    claimAttachments: null,
    fetchingClaims: false,
    fetchedClaims: false,
    errorClaims: null,
    claims: null,
    claimsPageInfo: { totalCount: 0 },
    fetchingClaim: false,
    fetchedClaim: false,
    errorClaim: null,
    claim: {},
    fetchingLastClaimAt: false,
    fetchedLastClaimAt: false,
    errorLastClaimAt: null,
    lastClaimAt: {},
    submittingMutation: false,
    mutation: {},
    fetchingClaimCodeCount: false,
    fetchedClaimCodeCount: false,
    claimCodeCount: null,
    errorClaimCodeCount: null,
  },
  action,
) {
  switch (action.type) {
    case "CLAIM_CLAIM_ATTACHMENTS_REQ":
      return {
        ...state,
        fetchingClaimAttachments: true,
        fetchedClaimAttachments: false,
        claimAttachments: null,
        errorClaimAttachments: null,
      };
    case "CLAIM_CLAIM_ATTACHMENTS_RESP":
      return {
        ...state,
        fetchingClaimAttachments: false,
        fetchedClaimAttachments: true,
        claimAttachments: parseData(action.payload.data.claimAttachments),
        errorClaimAttachments: formatGraphQLError(action.payload),
      };
    case "CLAIM_CLAIM_ATTACHMENTS_ERR":
      return {
        ...state,
        fetchingClaimAttachments: false,
        errorClaimAttachments: formatServerError(action.payload),
      };
    case "CLAIM_CLAIM_ADMIN_SELECTED":
      var claimAdmin = action.payload;
      var s = { ...state, claimAdmin };
      if (claimAdmin) {
        s.claimHealthFacility = claimAdmin.healthFacility;
        s.claimDistrict = s.claimHealthFacility.location;
        s.claimRegion = s.claimDistrict.parent;
      }
      return s;
    case "CLAIM_CLAIM_HEALTH_FACILITY_SELECTED":
      var claimHealthFacility = action.payload;
      var s = { ...state, claimHealthFacility };
      if (claimHealthFacility) {
        s.claimDistrict = s.claimHealthFacility.location;
        s.claimRegion = s.claimDistrict.parent;
      } else {
        delete s.claimAdmin;
      }
      return s;
    case "CLAIM_CLAIM_DISTRICT_SELECTED":
      var claimDistrict = action.payload;
      var s = { ...state, claimDistrict };
      if (claimDistrict) {
        s.claimRegion = claimDistrict.parent;
      } else {
        delete s.claimHealthFacility;
        delete s.claimAdmin;
      }
      return s;
    case "CLAIM_CLAIM_REGION_SELECTED":
      var claimRegion = action.payload;
      var s = { ...state, claimRegion };
      if (!claimRegion) {
        delete s.claimDistrict;
        delete s.claimHealthFacility;
        delete s.claimAdmin;
      }
      return s;
    case "CLAIM_CLAIM_SEARCHER_REQ":
      return {
        ...state,
        fetchingClaims: true,
        fetchedClaims: false,
        claims: null,
        claimsPageInfo: { totalCount: 0 },
        errorClaims: null,
      };
    case "CLAIM_CLAIM_SEARCHER_RESP":
      return {
        ...state,
        fetchingClaims: false,
        fetchedClaims: true,
        claims: parseData(action.payload.data.claims),
        claimsPageInfo: pageInfo(action.payload.data.claims),
        errorClaims: formatGraphQLError(action.payload),
      };
    case "CLAIM_CLAIM_SEARCHER_ERR":
      return {
        ...state,
        fetchingClaims: false,
        errorClaims: formatServerError(action.payload),
      };
    case "CLAIM_CLAIM_REQ":
      return {
        ...state,
        fetchingClaim: true,
        fetchedClaim: false,
        claim: null,
        errorClaim: null,
      };
    case "CLAIM_CLAIM_RESP":
      return {
        ...state,
        fetchingClaim: false,
        fetchedClaim: true,
        claim: action.payload.data.claim,
        errorClaim: formatGraphQLError(action.payload),
      };
    case "CLAIM_CLAIM_ERR":
      return {
        ...state,
        fetchingClaim: false,
        errorClaim: formatServerError(action.payload),
      };
    case "CLAIM_LAST_CLAIM_AT_REQ":
      return {
        ...state,
        fetchingLastClaimAt: true,
        fetchedLastClaimAt: false,
        lastClaimAt: null,
        errorLastClaimAt: null,
      };
    case "CLAIM_LAST_CLAIM_AT_RESP":
      var claims = parseData(action.payload.data.claims);
      return {
        ...state,
        fetchingLastClaimAt: false,
        fetchedLastClaimAt: true,
        lastClaimAt: !!claims && claims.length > 0 ? claims[0] : null,
        errorCLastClaimAt: formatGraphQLError(action.payload),
      };
    case "CLAIM_LAST_CLAIM_AT_ERR":
      return {
        ...state,
        fetchingLastClaimAt: false,
        errorLastClaimAt: formatServerError(action.payload),
      };
    case "CLAIM_CLAIM_CODE_COUNT_REQ":
      return {
        ...state,
        fetchingClaimCodeCount: true,
        fetchedClaimCodeCount: false,
        claimCodeCount: null,
        errorClaimCodeCount: null,
      };
    case "CLAIM_CLAIM_CODE_COUNT_RESP":
      return {
        ...state,
        fetchingClaimCodeCount: false,
        fetchedClaimCodeCount: true,
        claimCodeCount: action.payload.data.claims.totalCount,
      };
    case "CLAIM_CLAIM_CODE_COUNT_ERR":
      return {
        ...state,
        fetchingClaimCodeCount: false,
        errorClaimCodeCount: formatServerError(action.payload),
      };
    case "CLAIM_MUTATION_REQ":
      return dispatchMutationReq(state, action);
    case "CLAIM_MUTATION_ERR":
      return dispatchMutationErr(state, action);
    case "CLAIM_CREATE_CLAIM_RESP":
      return dispatchMutationResp(state, "createClaim", action);
    case "CLAIM_UPDATE_CLAIM_RESP":
      return dispatchMutationResp(state, "updateClaim", action);
    case "CLAIM_SUBMIT_CLAIMS_RESP":
      return dispatchMutationResp(state, "submitClaims", action);
    case "CLAIM_DELETE_CLAIMS_RESP":
      return dispatchMutationResp(state, "deleteClaims", action);
    case "CLAIM_SELECT_CLAIMS_FOR_FEEDBACK_RESP":
      return dispatchMutationResp(state, "selectClaimsForFeedback", action);
    case "CLAIM_BYPASS_CLAIMS_FEEDBACK_RESP":
      return dispatchMutationResp(state, "bypassClaimsFeedback", action);
    case "CLAIM_SKIP_CLAIMS_FEEDBACK_RESP":
      return dispatchMutationResp(state, "skipClaimsFeedback", action);
    case "CLAIM_DELIVER_CLAIM_FEEDBACK_RESP":
      return dispatchMutationResp(state, "deliverClaimFeedback", action);
    case "CLAIM_SELECT_CLAIMS_FOR_REVIEW_RESP":
      return dispatchMutationResp(state, "selectClaimsForReview", action);
    case "CLAIM_BYPASS_CLAIMS_REVIEW_RESP":
      return dispatchMutationResp(state, "bypassClaimsReview", action);
    case "CLAIM_SKIP_CLAIMS_REVIEW_RESP":
      return dispatchMutationResp(state, "skipClaimsReview", action);
    case "CLAIM_SAVE_CLAIM_REVIEW_RESP":
      return dispatchMutationResp(state, "saveClaimReview", action);
    case "CLAIM_DELIVER_CLAIMS_REVIEW_RESP":
      return dispatchMutationResp(state, "deliverClaimsReview", action);
    case "CLAIM_PROCESS_CLAIMS_RESP":
      return dispatchMutationResp(state, "processClaims", action);
    case "CLAIM_CREATE_CLAIM_ATTACHMENT_RESP":
      return dispatchMutationResp(state, "createClaimAttachment", action);
    case "CLAIM_UPDATE_CLAIM_ATTACHMENT_RESP":
      return dispatchMutationResp(state, "updateClaimAttachment", action);
    case "CLAIM_DELETE_CLAIM_ATTACHMENT_RESP":
      return dispatchMutationResp(state, "deleteClaimAttachment", action);
    case "CORE_ALERT_CLEAR":
      var s = { ...state };
      delete s.alert;
      return s;
    case "CLAIM_PRINT":
      return {
        ...state,
        generating: true,
      };
    case "CLAIM_PRINT_DONE":
      return {
        ...state,
        generating: false,
      };
    default:
      return state;
  }
}

export default reducer;
