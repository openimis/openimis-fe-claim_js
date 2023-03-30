import {
  baseApiUrl,
  graphql,
  formatQuery,
  formatPageQuery,
  formatPageQueryWithCount,
  formatMutation,
  decodeId,
  openBlob,
  graphqlWithVariables,
  formatJsonField,
  formatGQLString,
} from "@openimis/fe-core";
import _ from "lodash";
import _uuid from "lodash-uuid";

export function selectClaimAdmin(admin) {
  return (dispatch) => {
    dispatch({ type: "CLAIM_CLAIM_ADMIN_SELECTED", payload: admin });
  };
}

export function selectHealthFacility(hf) {
  return (dispatch) => {
    dispatch({ type: "CLAIM_CLAIM_HEALTH_FACILITY_SELECTED", payload: hf });
  };
}

export function selectDistrict(district) {
  return (dispatch) => {
    dispatch({ type: "CLAIM_CLAIM_DISTRICT_SELECTED", payload: district });
  };
}

export function selectRegion(region) {
  return (dispatch) => {
    dispatch({ type: "CLAIM_CLAIM_REGION_SELECTED", payload: region });
  };
}

export function claimCodeValidationCheck(mm, variables) {
  return graphqlWithVariables(
    `
    query ($claimCode: String!) {
      isValid: validateClaimCode(claimCode: $claimCode)
 }
    `,
    variables,
    `CLAIM_CODE_FIELDS_VALIDATION`,
  );
}

export function claimCodeValidationClear() {
  return (dispatch) => {
    dispatch({ type: `CLAIM_CODE_FIELDS_VALIDATION_CLEAR` });
  };
}

export function claimCodeSetValid() {
  return (dispatch) => {
    dispatch({ type: `CLAIM_CODE_FIELDS_VALIDATION_SET_VALID` });
  };
}

export function clearClaim() {
  return (dispatch) => {
    dispatch({ type: `CLAIM_CLAIM_CLEAR` });
  };
}

export function fetchClaimAttachments(claim) {
  const payload = formatPageQuery(
    "claimAttachments",
    [`claim_Uuid: "${claim.uuid}"`],
    ["id", "type", "title", "date", "filename", "mime"],
  );
  return graphql(payload, "CLAIM_CLAIM_ATTACHMENTS");
}

export function formatAttachment(attach) {
  return `
    ${!!attach.id ? `id: "${decodeId(attach.id)}"` : ""}
    ${!!attach.claimUuid ? `claimUuid: "${attach.claimUuid}"` : ""}
    ${!!attach.type ? `type: "${formatGQLString(attach.type)}"` : ""}
    ${!!attach.title ? `title: "${formatGQLString(attach.title)}"` : ""}
    ${!!attach.date ? `date: "${attach.date}"` : ""}
    ${!!attach.mime ? `mime: "${attach.mime}"` : ""}
    ${!!attach.filename ? `filename: "${formatGQLString(attach.filename)}"` : ""}
    ${!!attach.document ? `document: "${attach.document}"` : ""}
  `;
}

export function createAttachment(attach, clientMutationLabel) {
  let payload = formatAttachment(attach);
  let mutation = formatMutation("createClaimAttachment", payload, clientMutationLabel);
  var requestedDateTime = new Date();
  return graphql(mutation.payload, ["CLAIM_MUTATION_REQ", "CLAIM_CREATE_CLAIM_ATTACHMENT_RESP", "CLAIM_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime,
  });
}

export function updateAttachment(attach, clientMutationLabel) {
  let payload = formatAttachment(attach);
  let mutation = formatMutation("updateClaimAttachment", payload, clientMutationLabel);
  var requestedDateTime = new Date();
  return graphql(mutation.payload, ["CLAIM_MUTATION_REQ", "CLAIM_UPDATE_CLAIM_ATTACHMENT_RESP", "CLAIM_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime,
  });
}

export function deleteAttachment(attach, clientMutationLabel) {
  let mutation = formatMutation("deleteClaimAttachment", `id: "${decodeId(attach.id)}"`, clientMutationLabel);
  var requestedDateTime = new Date();
  return graphql(mutation.payload, ["CLAIM_MUTATION_REQ", "CLAIM_DELETE_CLAIM_ATTACHMENT_RESP", "CLAIM_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime,
  });
}

export function downloadAttachment(attach) {
  var url = new URL(`${window.location.origin}${baseApiUrl}/claim/attach`);
  url.search = new URLSearchParams({ id: decodeId(attach.id) });
  return (dispatch) => {
    return fetch(url)
      .then((response) => response.blob())
      .then((blob) => openBlob(blob, attach.filename, attach.mime));
  };
}

export function fetchClaimSummaries(mm, filters, withAttachmentsCount) {
  var projections = [
    "uuid",
    "code",
    "jsonExt",
    "dateClaimed",
    "dateProcessed",
    "feedbackStatus",
    "reviewStatus",
    "claimed",
    "approved",
    "status",
    "healthFacility { id uuid name code }",
    "insuree" + mm.getProjection("insuree.InsureePicker.projection"),
  ];
  if (withAttachmentsCount) {
    projections.push("attachmentsCount");
  }
  const payload = formatPageQueryWithCount("claims", filters, projections);
  return graphql(payload, "CLAIM_CLAIM_SEARCHER");
}

export function formatDetail(type, detail) {
  return `{
    ${detail.id !== undefined && detail.id !== null ? `id: ${detail.id}` : ""}
    ${type}Id: ${decodeId(detail[type].id)}
    ${detail.priceAsked !== null ? `priceAsked: "${_.round(detail.priceAsked, 2).toFixed(2)}"` : ""}
    ${detail.qtyProvided !== null ? `qtyProvided: "${_.round(detail.qtyProvided, 2).toFixed(2)}"` : ""}
    status: 1
    ${
      detail.explanation !== undefined && detail.explanation !== null
        ? `explanation: "${formatGQLString(detail.explanation)}"`
        : ""
    }
    ${
      detail.justification !== undefined && detail.justification !== null
        ? `justification: "${formatGQLString(detail.justification)}"`
        : ""
    }
  }`;
}

export function formatDetails(type, details) {
  if (!details) return "";
  let dets = details.filter((d) => !!d[type]);
  return `${type}s: [
      ${dets.map((d) => formatDetail(type, d)).join("\n")}
    ]`;
}

export function formatAttachments(mm, attachments) {
  return `[
    ${attachments
      .map(
        (a) => `{
      ${formatAttachment(a)}
    }`,
      )
      .join("\n")}
  ]`;
}

export function formatClaimGQL(mm, claim) {
  return `
    ${claim.uuid !== undefined && claim.uuid !== null ? `uuid: "${claim.uuid}"` : ""}
    code: "${claim.code}"
    insureeId: ${decodeId(claim.insuree.id)}
    adminId: ${decodeId(claim.admin.id)}
    dateFrom: "${claim.dateFrom}"
    ${claim.dateTo ? `dateTo: "${claim.dateTo}"` : ""}
    icdId: ${decodeId(claim.icd.id)}
    ${!!claim.icd1 ? `icd1Id: ${decodeId(claim.icd1.id)}` : ""}
    ${!!claim.icd2 ? `icd2Id: ${decodeId(claim.icd2.id)}` : ""}
    ${!!claim.icd3 ? `icd3Id: ${decodeId(claim.icd3.id)}` : ""}
    ${!!claim.icd4 ? `icd4Id: ${decodeId(claim.icd4.id)}` : ""}
    ${`jsonExt: ${formatJsonField(claim.jsonExt)}`}
    feedbackStatus: ${mm.getRef("claim.CreateClaim.feedbackStatus")}
    reviewStatus: ${mm.getRef("claim.CreateClaim.reviewStatus")}
    dateClaimed: "${claim.dateClaimed}"
    healthFacilityId: ${decodeId(claim.healthFacility.id)}
    visitType: "${claim.visitType}"
    ${!!claim.guaranteeId ? `guaranteeId: "${claim.guaranteeId}"` : ""}
    ${!!claim.explanation ? `explanation: "${formatGQLString(claim.explanation)}"` : ""}
    ${!!claim.adjustment ? `adjustment: "${formatGQLString(claim.adjustment)}"` : ""}
    ${formatDetails("service", claim.services)}
    ${formatDetails("item", claim.items)}
    ${
      !!claim.attachments && !!claim.attachments.length
        ? `attachments: ${formatAttachments(mm, claim.attachments)}`
        : ""
    }
  `;
}

export function createClaim(mm, claim, clientMutationLabel) {
  let mutation = formatMutation("createClaim", formatClaimGQL(mm, claim), clientMutationLabel);
  var requestedDateTime = new Date();
  return graphql(mutation.payload, ["CLAIM_MUTATION_REQ", "CLAIM_CREATE_CLAIM_RESP", "CLAIM_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime,
  });
}

export function updateClaim(mm, claim, clientMutationLabel) {
  let mutation = formatMutation("updateClaim", formatClaimGQL(mm, claim), clientMutationLabel);
  var requestedDateTime = new Date();
  claim.clientMutationId = mutation.clientMutationId;
  return graphql(mutation.payload, ["CLAIM_MUTATION_REQ", "CLAIM_UPDATE_CLAIM_RESP", "CLAIM_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime,
  });
}

export function fetchClaim(mm, claimUuid, forFeedback) {
  let projections = [
    "uuid",
    "code",
    "dateFrom",
    "dateTo",
    "dateClaimed",
    "claimed",
    "approved",
    "valuated",
    "status",
    "feedbackStatus",
    "reviewStatus",
    "guaranteeId",
    "explanation",
    "adjustment",
    "attachmentsCount",
    "healthFacility" + mm.getProjection("location.HealthFacilityPicker.projection"),
    "insuree" + mm.getProjection("insuree.InsureePicker.projection"),
    "visitType" + mm.getProjection("medical.VisitTypePicker.projection"),
    "admin" + mm.getProjection("claim.ClaimAdminPicker.projection"),
    "icd" + mm.getProjection("medical.DiagnosisPicker.projection"),
    "icd1" + mm.getProjection("medical.DiagnosisPicker.projection"),
    "icd2" + mm.getProjection("medical.DiagnosisPicker.projection"),
    "icd3" + mm.getProjection("medical.DiagnosisPicker.projection"),
    "icd4" + mm.getProjection("medical.DiagnosisPicker.projection"),
    "jsonExt",
  ];
  if (!!forFeedback) {
    projections.push(
      "feedback{id, careRendered, paymentAsked, drugPrescribed, drugReceived, asessment, feedbackDate, officerId}",
    );
  } else {
    projections.push(
      "services{" +
        "id, service {id code name price} qtyProvided, priceAsked, qtyApproved, priceApproved, priceValuated, priceAdjusted, explanation, justification, rejectionReason, status" +
        "}",
      "items{" +
        "id, item {id code name price} qtyProvided, priceAsked, qtyApproved, priceApproved, priceValuated, priceAdjusted, explanation, justification, rejectionReason, status" +
        "}",
    );
  }
  const payload = formatQuery("claim", [`uuid: "${claimUuid}"`], projections);
  return graphql(payload, "CLAIM_CLAIM");
}

export function fetchLastClaimAt(claim) {
  const payload = formatPageQuery(
    "claims",
    [
      `insuree_ChfId: "${claim.insuree.chfId}"`,
      `codeIsNot: "${claim.code}"`,
      `healthFacility_Uuid: "${claim.healthFacility.uuid}"`,
      "first: 1",
      `orderBy: "-dateFrom"`,
    ],
    ["code", "dateFrom", "dateTo"],
  );
  return graphql(payload, "CLAIM_LAST_CLAIM_AT");
}

export function fetchClaimOfficers(mm, extraFragment, variables) {
  return graphqlWithVariables(
    `
    query ClaimOfficerPicker ($search: String) {
      claimOfficers(search: $search, first: 20) {
        edges {
          node {
            id
            uuid
            code
            lastName
            otherNames
            ${extraFragment ?? ""}
          }
        }
      }
    }
  `,
    variables,
    "CLAIM_ENROLMENT_OFFICERS",
    { skip: true },
  )
}

export function submit(claims, clientMutationLabel, clientMutationDetails = null) {
  let claimUuids = `uuids: ["${claims.map((c) => c.uuid).join('","')}"]`;
  let mutation = formatMutation("submitClaims", claimUuids, clientMutationLabel, clientMutationDetails);
  var requestedDateTime = new Date();
  claims.forEach((c) => (c.clientMutationId = mutation.clientMutationId));
  return graphql(mutation.payload, ["CLAIM_MUTATION_REQ", "CLAIM_SUBMIT_CLAIMS_RESP", "CLAIM_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    clientMutationDetails: !!clientMutationDetails ? JSON.stringify(clientMutationDetails) : null,
    requestedDateTime,
  });
}

export function submitAll(filters, clientMutationLabel, clientMutationDetails = null) {
  filters = Object.fromEntries(
    Object.keys(filters)
      .filter((f) => !!filters[f]["filter"])
      .map((f) => filters[f]["filter"].split(": "))
      .map((f) => [f[0], JSON.parse(f[1])]),
  );

  var projections = ["uuid"];
  const claimFilters = formatPageQueryWithCount("claims", filters, projections);

  let mutationParam = `additionalFilters: "${JSON.stringify(filters).replaceAll('\\"', "").replaceAll('"', '\\"')}"`;

  let mutation = formatMutation("submitClaims", mutationParam, clientMutationLabel, clientMutationDetails);

  var requestedDateTime = new Date();
  return graphql(mutation.payload, ["CLAIM_MUTATION_REQ", "CLAIM_SUBMIT_CLAIMS_RESP", "CLAIM_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    clientMutationDetails: !!clientMutationDetails ? JSON.stringify(clientMutationDetails) : null,
    requestedDateTime,
  });
}

export function del(claims, clientMutationLabel, clientMutationDetails = null) {
  let claimUuids = `uuids: ["${claims.map((c) => c.uuid).join('","')}"]`;
  let mutation = formatMutation("deleteClaims", claimUuids, clientMutationLabel, clientMutationDetails);
  var requestedDateTime = new Date();
  claims.forEach((c) => (c.clientMutationId = mutation.clientMutationId));
  return graphql(mutation.payload, ["CLAIM_MUTATION_REQ", "CLAIM_DELETE_CLAIMS_RESP", "CLAIM_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    clientMutationDetails: !!clientMutationDetails ? JSON.stringify(clientMutationDetails) : null,
    requestedDateTime,
  });
}

export function selectForFeedback(claims, clientMutationLabel, clientMutationDetails = null) {
  let claimUuids = `uuids: ["${claims.map((c) => c.uuid).join('","')}"]`;
  let mutation = formatMutation("selectClaimsForFeedback", claimUuids, clientMutationLabel, clientMutationDetails);
  var requestedDateTime = new Date();
  claims.forEach((c) => (c.clientMutationId = mutation.clientMutationId));
  return graphql(
    mutation.payload,
    ["CLAIM_MUTATION_REQ", "CLAIM_SELECT_CLAIMS_FOR_FEEDBACK_RESP", "CLAIM_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      clientMutationDetails: !!clientMutationDetails ? JSON.stringify(clientMutationDetails) : null,
      requestedDateTime,
    },
  );
}

export function bypassFeedback(claims, clientMutationLabel, clientMutationDetails = null) {
  let claimUuids = `uuids: ["${claims.map((c) => c.uuid).join('","')}"]`;
  let mutation = formatMutation("bypassClaimsFeedback", claimUuids, clientMutationLabel, clientMutationDetails);
  var requestedDateTime = new Date();
  claims.forEach((c) => (c.clientMutationId = mutation.clientMutationId));
  return graphql(mutation.payload, ["CLAIM_MUTATION_REQ", "CLAIM_BYPASS_CLAIMS_FEEDBACK_RESP", "CLAIM_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    clientMutationDetails: !!clientMutationDetails ? JSON.stringify(clientMutationDetails) : null,
    requestedDateTime,
  });
}

export function deliverFeedback(claim, clientMutationLabel) {
  let feedback = { ...claim.feedback };
  let feedbackGQL = `
    claimUuid: "${claim.uuid}"
    feedback: {
      ${!!feedback.feedbackDate ? `feedbackDate: "${feedback.feedbackDate}"` : ""}
      ${!!feedback.officerId ? `officerId: ${feedback.officerId}` : ""}
      ${
        feedback.careRendered !== undefined && feedback.careRendered !== null
          ? `careRendered: ${feedback.careRendered}`
          : ""
      }
      ${
        feedback.paymentAsked !== undefined && feedback.paymentAsked !== null
          ? `paymentAsked: ${feedback.paymentAsked}`
          : ""
      }
      ${
        feedback.drugPrescribed !== undefined && feedback.drugPrescribed !== null
          ? `drugPrescribed: ${feedback.drugPrescribed}`
          : ""
      }
      ${
        feedback.drugReceived !== undefined && feedback.drugReceived !== null
          ? `drugReceived: ${feedback.drugReceived}`
          : ""
      }
      ${feedback.asessment !== undefined && feedback.asessment !== null ? `asessment: ${feedback.asessment}` : ""}
    }
  `;
  let mutation = formatMutation("deliverClaimFeedback", feedbackGQL, clientMutationLabel);
  var requestedDateTime = new Date();
  claim.clientMutationId = mutation.clientMutationId;
  return graphql(mutation.payload, ["CLAIM_MUTATION_REQ", "CLAIM_DELIVER_CLAIM_FEEDBACK_RESP", "CLAIM_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime,
  });
}

export function skipFeedback(claims, clientMutationLabel, clientMutationDetails = null) {
  let claimUuids = `uuids: ["${claims.map((c) => c.uuid).join('","')}"]`;
  let mutation = formatMutation("skipClaimsFeedback", claimUuids, clientMutationLabel, clientMutationDetails);
  var requestedDateTime = new Date();
  claims.forEach((c) => (c.clientMutationId = mutation.clientMutationId));
  return graphql(mutation.payload, ["CLAIM_MUTATION_REQ", "CLAIM_SKIP_CLAIMS_FEEDBACK_RESP", "CLAIM_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    clientMutationDetails: !!clientMutationDetails ? JSON.stringify(clientMutationDetails) : null,
    requestedDateTime,
  });
}

export function selectForReview(claims, clientMutationLabel, clientMutationDetails = null) {
  let mutation = formatMutation(
    "selectClaimsForReview",
    `uuids: ["${claims.map((c) => c.uuid).join('","')}"]`,
    clientMutationLabel,
    clientMutationDetails,
  );
  var requestedDateTime = new Date();
  claims.forEach((c) => (c.clientMutationId = mutation.clientMutationId));
  return graphql(
    mutation.payload,
    ["CLAIM_MUTATION_REQ", "CLAIM_SELECT_CLAIMS_FOR_REVIEW_RESP", "CLAIM_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      clientMutationDetails: !!clientMutationDetails ? JSON.stringify(clientMutationDetails) : null,
      requestedDateTime,
    },
  );
}

export function bypassReview(claims, clientMutationLabel, clientMutationDetails = null) {
  let claimUuids = `uuids: ["${claims.map((c) => c.uuid).join('","')}"]`;
  let mutation = formatMutation("bypassClaimsReview", claimUuids, clientMutationLabel, clientMutationDetails);
  var requestedDateTime = new Date();
  claims.forEach((c) => (c.clientMutationId = mutation.clientMutationId));
  return graphql(mutation.payload, ["CLAIM_MUTATION_REQ", "CLAIM_BYPASS_CLAIMS_REVIEW_RESP", "CLAIM_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    clientMutationDetails: !!clientMutationDetails ? JSON.stringify(clientMutationDetails) : null,
    requestedDateTime,
  });
}

export function formatReviewDetail(type, detail) {
  return `{
    id: ${detail.id}
    ${type}Id: ${decodeId(detail[type].id)}
    ${detail.qtyApproved !== null ? `qtyApproved: "${_.round(detail.qtyApproved, 2).toFixed(2)}"` : ""}
    ${detail.priceApproved !== null ? `priceApproved: "${_.round(detail.priceApproved, 2).toFixed(2)}"` : ""}
    ${detail.justification !== null ? `justification: "${formatGQLString(detail.justification)}"` : ""}
    status: ${detail.status}
    ${detail.rejectionReason !== null ? `rejectionReason: ${detail.rejectionReason}` : ""}
  }`;
}

export function formatReviewDetails(type, details) {
  if (!details || details.length < 1) return "";
  return `${type}s: [
      ${details.map((d) => formatReviewDetail(type, d)).join("\n")}
    ]`;
}

export function saveReview(claim, clientMutationLabel) {
  let reviewGQL = `
    claimUuid: "${claim.uuid}"
    ${!!claim.adjustment ? `adjustment: "${formatGQLString(claim.adjustment)}"` : ""}
    ${formatReviewDetails("service", claim.services)}
    ${formatReviewDetails("item", claim.items)}
  `;
  let mutation = formatMutation("saveClaimReview", reviewGQL, clientMutationLabel);
  var requestedDateTime = new Date();
  claim.clientMutationId = mutation.clientMutationId;
  return graphql(mutation.payload, ["CLAIM_MUTATION_REQ", "CLAIM_SAVE_CLAIM_REVIEW_RESP", "CLAIM_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime,
  });
}

export function deliverReview(claims, clientMutationLabel, clientMutationDetails = null) {
  let claimUuids = `uuids: ["${claims.map((c) => c.uuid).join('","')}"]`;
  let mutation = formatMutation("deliverClaimsReview", claimUuids, clientMutationLabel, clientMutationDetails);
  var requestedDateTime = new Date();
  claims.forEach((c) => (c.clientMutationId = mutation.clientMutationId));
  return graphql(mutation.payload, ["CLAIM_MUTATION_REQ", "CLAIM_DELIVER_CLAIMS_REVIEW_RESP", "CLAIM_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    clientMutationDetails: !!clientMutationDetails ? JSON.stringify(clientMutationDetails) : null,
    requestedDateTime,
  });
}

export function skipReview(claims, clientMutationLabel, clientMutationDetails = null) {
  let claimUuids = `uuids: ["${claims.map((c) => c.uuid).join('","')}"]`;
  let mutation = formatMutation("skipClaimsReview", claimUuids, clientMutationLabel, clientMutationDetails);
  var requestedDateTime = new Date();
  claims.forEach((c) => (c.clientMutationId = mutation.clientMutationId));
  return graphql(mutation.payload, ["CLAIM_MUTATION_REQ", "CLAIM_SKIP_CLAIMS_REVIEW_RESP", "CLAIM_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    clientMutationDetails: !!clientMutationDetails ? JSON.stringify(clientMutationDetails) : null,
    requestedDateTime,
  });
}

export function process(claims, clientMutationLabel, clientMutationDetails = null) {
  let claimUuids = `uuids: ["${claims.map((c) => c.uuid).join('","')}"]`;
  let mutation = formatMutation("processClaims", claimUuids, clientMutationLabel, clientMutationDetails);
  var requestedDateTime = new Date();
  claims.forEach((c) => (c.clientMutationId = mutation.clientMutationId));
  return graphql(mutation.payload, ["CLAIM_MUTATION_REQ", "CLAIM_PROCESS_CLAIMS_RESP", "CLAIM_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    clientMutationDetails: !!clientMutationDetails ? JSON.stringify(clientMutationDetails) : null,
    requestedDateTime,
  });
}

export function claimHealthFacilitySet(healthFacility) {
  return (dispatch) => {
    dispatch({ type: "CLAIM_EDIT_HEALTH_FACILITY_SET", payload: healthFacility });
  };
}

export function print() {
  return (dispatch) => {
    dispatch({ type: "CLAIM_PRINT" });
  };
}

export function generate(uuid) {
  var url = new URL(`${window.location.origin}${baseApiUrl}/claim/print/`);
  url.search = new URLSearchParams({ uuid });
  return (dispatch) => {
    return fetch(url)
      .then((response) => response.blob())
      .then((blob) => openBlob(blob, `${_uuid.uuid()}.pdf`, "pdf"))
      .then((e) => dispatch({ type: "CLAIM_PRINT_DONE" }));
  };
}
