import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Only fe-core's transport and file download are stubbed; the formatters are real,
// imported from their defining modules because fe-core's barrel imports itself.
const core = vi.hoisted(() => ({
  graphql: vi.fn((payload, type, meta) => ({ payload, type, meta })),
  graphqlWithVariables: vi.fn((operation, variables, type, meta) => ({ operation, variables, type, meta })),
  openBlob: vi.fn(),
}));

vi.mock("@openimis/fe-core", async () => ({
  ...(await vi.importActual("@openimis/fe-core/helpers/api")),
  ...(await vi.importActual("@openimis/fe-core/helpers/jsonExt")),
  baseApiUrl: "/api",
  ...core,
}));

const actions = await import("./actions");
const { default: reducer } = await import("./reducer");
const { globalId, relayPage } = await import("@openimis/fe-core/testing");

const query = (result) => result.payload.replace(/\s+/g, " ");
const operation = (result) => result.operation.replace(/\s+/g, " ");
const squash = (text) => text.replace(/\s+/g, " ");

const mm = (overrides = {}) => ({
  getProjection: (key) => `{${key}}`,
  getConf: (_module, _key, fallback) => fallback,
  getRef: (key) =>
    ({
      "claim.CreateClaim.feedbackStatus": 1,
      "claim.CreateClaim.reviewStatus": 1,
      "claim.CreateClaim.claimTypeReferSymbol": "R",
    })[key],
  ...overrides,
});

const dispatched = (thunk) => {
  const dispatch = vi.fn();
  thunk(dispatch);
  return dispatch.mock.calls.map(([action]) => action);
};

const ref = (type, id) => ({ id: globalId(type, id) });

const claim = (overrides = {}) => ({
  code: "C-001",
  insuree: ref("InsureeGQLType", 11),
  admin: ref("ClaimAdminGQLType", 22),
  healthFacility: ref("HealthFacilityGQLType", 33),
  icd: ref("DiagnosisGQLType", 44),
  dateFrom: "2026-09-01",
  dateClaimed: "2026-09-02",
  visitType: "O",
  preAuthorization: false,
  jsonExt: null,
  ...overrides,
});

describe("claim actions", () => {
  beforeEach(() => {
    core.graphql.mockClear();
    core.graphqlWithVariables.mockClear();
    core.openBlob.mockClear();
  });

  describe("plain dispatchers", () => {
    it.each([
      ["selectClaimAdmin", "CLAIM_CLAIM_ADMIN_SELECTED"],
      ["selectHealthFacility", "CLAIM_CLAIM_HEALTH_FACILITY_SELECTED"],
      ["selectDistrict", "CLAIM_CLAIM_DISTRICT_SELECTED"],
      ["selectRegion", "CLAIM_CLAIM_REGION_SELECTED"],
      ["claimHealthFacilitySet", "CLAIM_EDIT_HEALTH_FACILITY_SET"],
    ])("%s dispatches %s with the selection", (creator, type) => {
      expect(dispatched(actions[creator]({ uuid: "x" }))).toEqual([{ type, payload: { uuid: "x" } }]);
    });

    it.each([
      ["claimCodeValidationClear", "CLAIM_CODE_FIELDS_VALIDATION_CLEAR"],
      ["claimCodeSetValid", "CLAIM_CODE_FIELDS_VALIDATION_SET_VALID"],
      ["clearClaim", "CLAIM_CLAIM_CLEAR"],
      ["print", "CLAIM_PRINT"],
    ])("%s dispatches %s", (creator, type) => {
      expect(dispatched(actions[creator]())).toEqual([{ type }]);
    });

    it("clearing the claim empties it in the store", () => {
      const state = reducer(undefined, { type: "@@INIT" });
      const [action] = dispatched(actions.clearClaim());

      expect(reducer({ ...state, claim: { uuid: "c-1" } }, action).claim).toBeNull();
    });

    const stateWith = (field, value) => ({ ...reducer(undefined, { type: "@@INIT" }), [field]: value });

    // Currently fails: the action dispatches CLEAR_CLAIM_LAST_CLAIM_AT but the reducer
    // only handles CLEAR_CLAIM_LAST_CLAIM_AT_REQ, so the previous insuree's last claim
    // stays on screen.
    it.fails("clearing the last claim empties it in the store", () => {
      const [action] = dispatched(actions.clearLastClaimAt());

      expect(reducer(stateWith("lastClaimAt", { code: "OLD" }), action).lastClaimAt).toBeNull();
    });

    // Currently fails: the action dispatches CLEAR_CLAIM_SAME_DIAGNOSIS but the reducer
    // only handles CLEAR_CLAIM_SAME_DIAGNOSIS_REQ.
    it.fails("clearing the same-diagnosis claim empties it in the store", () => {
      const [action] = dispatched(actions.clearLastClaimWithSameDiagnosis());

      expect(reducer(stateWith("sameDiagnosisClaim", { code: "OLD" }), action).sameDiagnosisClaim).toBeNull();
    });
  });

  describe("queries", () => {
    it("checks a claim code through variables rather than inlining it", () => {
      const result = actions.claimCodeValidationCheck(mm(), { claimCode: 'C"1' });

      expect(result.type).toBe("CLAIM_CODE_FIELDS_VALIDATION");
      expect(operation(result)).toContain("isValid: validateClaimCode(claimCode: $claimCode)");
      expect(result.variables).toEqual({ claimCode: 'C"1' });
    });

    it("loads the attachments of one claim", () => {
      const result = actions.fetchClaimAttachments({ uuid: "c-1" });

      expect(result.type).toBe("CLAIM_CLAIM_ATTACHMENTS");
      expect(query(result)).toContain('claimAttachments(claim_Uuid: "c-1")');
      expect(query(result)).toContain("predefinedType { claimAttachmentType, isAutogenerated }");
    });

    it("counts the claim summaries and projects the insuree through its picker", () => {
      const result = actions.fetchClaimSummaries(mm(), ["first: 10", "status: 2"]);

      expect(result.type).toBe("CLAIM_CLAIM_SEARCHER");
      expect(query(result)).toContain("claims(first: 10,status: 2) { totalCount");
      expect(query(result)).toContain("insuree{insuree.InsureePicker.projection}");
      expect(query(result)).toContain("claimed,approved,status");
      expect(query(result)).not.toContain("attachmentsCount");
    });

    it("counts attachments in the summaries only when asked", () => {
      expect(query(actions.fetchClaimSummaries(mm(), [], true))).toContain("attachmentsCount");
    });

    it("loads a claim with its services and items for editing", () => {
      const result = actions.fetchClaim(mm(), "c-1");

      expect(result.type).toBe("CLAIM_CLAIM");
      expect(query(result)).toContain('claim(uuid: "c-1")');
      expect(query(result)).toContain("priceAsked, qtyApproved, priceApproved, priceValuated,priceAdjusted");
      expect(query(result)).toContain("service {id code name price maximumAmount manualPrice packagetype}");
      expect(query(result)).toContain("item {id code name price maximumAmount}");
      expect(query(result)).not.toContain("feedback{");
    });

    it("loads the feedback instead of the details for the feedback page", () => {
      const result = actions.fetchClaim(mm(), "c-1", true);

      expect(query(result)).toContain("feedback{id, careRendered, paymentAsked");
      expect(query(result)).not.toContain("services{");
    });

    it("projects every related entity through its picker", () => {
      const result = query(actions.fetchClaim(mm(), "c-1"));

      expect(result).toContain("admin{claim.ClaimAdminPicker.projection}");
      expect(result).toContain("referFrom{location.HealthFacilityReferPicker.projection}");
      expect(result).toContain("icd4{medical.DiagnosisPicker.projection}");
    });

    it("looks for the insuree's latest earlier claim", () => {
      const result = actions.fetchLastClaimAt({ insuree: { chfId: "070707070" }, status: 2, dateFrom: "2026-09-01" });

      expect(result.type).toBe("CLAIM_LAST_CLAIM_AT");
      expect(query(result)).toContain(
        'claims(insuree_ChfId: "070707070",first: 1,status_Gt: 2,orderBy: "-dateFrom")',
      );
    });

    it("looks before this claim's start once it is past entry", () => {
      const result = actions.fetchLastClaimAt({ insuree: { chfId: "070707070" }, status: 4, dateFrom: "2026-09-01" });

      expect(query(result)).toContain('orderBy: "-dateFrom",dateFrom_Lt: "2026-09-01")');
    });

    it("looks for an earlier claim with the same diagnosis", () => {
      const result = actions.fetchLastClaimWithSameDiagnosis({ code: "A01" }, "070707070");

      expect(result.type).toBe("CLAIM_SAME_DIAGNOSIS");
      expect(query(result)).toContain('claimWithSameDiagnosis(chfid: "070707070",icd: "A01",status_Gt: 2)');
    });

    it("searches officers through a variable and adds the caller's fragment", () => {
      const result = actions.fetchClaimOfficers(mm(), "phone", { search: "doe" });

      expect(result.type).toBe("CLAIM_ENROLMENT_OFFICERS");
      expect(operation(result)).toContain("claimOfficers(search: $search, first: 20)");
      expect(operation(result)).toContain("otherNames phone }");
      expect(result.variables).toEqual({ search: "doe" });
      expect(result.meta).toEqual({ skip: true });
    });

    it("searches officers without a fragment", () => {
      expect(operation(actions.fetchClaimOfficers(mm(), undefined, {}))).toContain("otherNames } }");
    });

    it("loads the history of one claim", () => {
      const result = actions.fetchClaimHistory("c-1");

      expect(result.type).toBe("CLAIM_HISTORY_FETCH");
      expect(result.variables).toEqual({ claimUuid: "c-1" });
      expect(operation(result)).toContain("claimHistory(claimUuid: $claimUuid) { totalCount");
    });
  });

  describe("attachments", () => {
    it("writes every attachment field it is given", () => {
      const gql = squash(
        actions.formatAttachment({
          id: globalId("ClaimAttachmentGQLType", 7),
          claimUuid: "c-1",
          type: "scan",
          title: "Lab result",
          date: "2026-09-01",
          mime: "application/pdf",
          url: "https://example.org/a.pdf",
          generalType: "FILE",
          predefinedType: { claimAttachmentType: "LAB" },
          filename: "a.pdf",
          document: "YWJj",
        }),
      );

      expect(gql).toBe(
        ' id: "7" claimUuid: "c-1" type: "scan" title: "Lab result" date: "2026-09-01" mime: "application/pdf"' +
          ' url: "https://example.org/a.pdf" generalType: "FILE" predefinedType: "LAB" filename: "a.pdf" document: "YWJj" ',
      );
    });

    it("leaves out the fields that are empty", () => {
      expect(squash(actions.formatAttachment({ title: "Lab" }))).toBe(' title: "Lab" ');
    });

    it("escapes the free-text fields", () => {
      const gql = actions.formatAttachment({ type: "a/b", title: "line 1\nline 2", filename: "C:\\a.pdf" });

      expect(gql).toContain('type: "a\\/b"');
      expect(gql).toContain('title: "line 1\\nline 2"');
      expect(gql).toContain('filename: "C:\\\\a.pdf"');
    });

    it.each([
      ["createAttachment", "createClaimAttachment", "CLAIM_CREATE_CLAIM_ATTACHMENT_RESP"],
      ["updateAttachment", "updateClaimAttachment", "CLAIM_UPDATE_CLAIM_ATTACHMENT_RESP"],
      ["deleteAttachment", "deleteClaimAttachment", "CLAIM_DELETE_CLAIM_ATTACHMENT_RESP"],
    ])("%s sends %s and records the mutation", (creator, operationName, respType) => {
      const result = actions[creator]({ id: globalId("ClaimAttachmentGQLType", 7), title: "Lab" }, "Attach");

      expect(result.type).toEqual(["CLAIM_MUTATION_REQ", respType, "CLAIM_MUTATION_ERR"]);
      expect(query(result)).toContain(`mutation ${operationName} { ${operationName}(`);
      expect(query(result)).toContain('id: "7"');
      expect(query(result)).toContain(`clientMutationId: "${result.meta.clientMutationId}"`);
      expect(result.meta).toMatchObject({ clientMutationLabel: "Attach" });
      expect(result.meta.requestedDateTime).toBeInstanceOf(Date);
    });

    describe("downloads", () => {
      afterEach(() => vi.unstubAllGlobals());

      it("fetches an attachment by its decoded id and opens it", async () => {
        const blob = new Blob(["pdf"]);
        const fetch = vi.fn(() => Promise.resolve({ blob: () => Promise.resolve(blob) }));
        vi.stubGlobal("fetch", fetch);

        await actions.downloadAttachment({ id: globalId("ClaimAttachmentGQLType", 7), filename: "a.pdf", mime: "pdf" })();

        expect(fetch.mock.calls[0][0].toString()).toBe(`${window.location.origin}/api/claim/attach?id=7`);
        expect(core.openBlob).toHaveBeenCalledWith(blob, "a.pdf", "pdf");
      });

      it("prints a claim and reports when the document is ready", async () => {
        const fetch = vi.fn(() => Promise.resolve({ blob: () => Promise.resolve(new Blob(["pdf"])) }));
        vi.stubGlobal("fetch", fetch);
        const dispatch = vi.fn();

        await actions.generate("c-1")(dispatch);

        expect(fetch.mock.calls[0][0].toString()).toBe(`${window.location.origin}/api/claim/print/?uuid=c-1`);
        expect(core.openBlob.mock.calls[0][1]).toMatch(/\.pdf$/);
        expect(dispatch).toHaveBeenCalledWith({ type: "CLAIM_PRINT_DONE" });
      });
    });
  });

  describe("claim details", () => {
    const item = (overrides = {}) => ({
      item: ref("ItemGQLType", 5),
      priceAsked: 12.345,
      qtyProvided: 2,
      ...overrides,
    });

    it("writes an item line with amounts rounded to two decimals", () => {
      const gql = squash(actions.formatDetail("item", item()));

      expect(gql).toBe('{ itemId: 5 priceAsked: "12.35" qtyProvided: "2.00" status: 1 }');
    });

    it("keeps the id of an existing line", () => {
      expect(actions.formatDetail("item", item({ id: 91 }))).toContain("id: 91");
    });

    it("escapes the explanation and justification", () => {
      const gql = actions.formatDetail("item", item({ explanation: "said\turgent", justification: "a\\b" }));

      expect(gql).toContain('explanation: "said\\turgent"');
      expect(gql).toContain('justification: "a\\\\b"');
    });

    it("leaves out an amount that is null", () => {
      const gql = squash(actions.formatDetail("item", item({ priceAsked: null, qtyProvided: null })));

      expect(gql).toBe("{ itemId: 5 status: 1 }");
    });

    it("sends an empty package for a plain service", () => {
      const gql = squash(actions.formatDetail("service", { service: ref("ServiceGQLType", 6), priceAsked: 10, qtyProvided: 1 }));

      expect(gql).toContain("serviceId: 6");
      expect(gql).toContain("serviceServiceSet: [ ]");
      expect(gql).toContain("serviceItemSet: [ ]");
    });

    it("sends both the linked and the chosen contents of a package service", () => {
      const service = {
        ...ref("ServiceGQLType", 6),
        servicesLinked: [{ item: { code: "I-LINK" }, qtyAsked: 1, qtyDisplayed: 1, priceAsked: 2 }],
        serviceserviceSet: [{ service: { code: "S-SET" }, qtyAsked: 3, qtyDisplayed: 3, priceAsked: 4 }],
      };
      const gql = squash(
        actions.formatDetail("service", {
          service,
          priceAsked: 10,
          qtyProvided: 1,
          items: [{ item: { code: "I-ROW" }, qtyProvided: 1 }],
          services: [{ service: { code: "S-ROW" }, qtyProvided: 1 }],
        }),
      );

      expect(gql).toMatch(/serviceServiceSet: \[ \{ subServiceCode: "S-SET".*\}, \{ subServiceCode: "S-ROW".*\},\]/);
      expect(gql).toMatch(/serviceItemSet: \[ \{ subItemCode: "I-LINK".*\}, \{ subItemCode: "I-ROW".*\},\]/);
    });

    it("writes a package entry with its quantities rounded", () => {
      const gql = squash(
        actions.formatDetailSubService("service", {
          item: { code: "I1" },
          qtyAsked: 2,
          qtyDisplayed: 2,
          priceAsked: 3.333,
          qtyProvided: 1,
          qtyAdjusted: 1.5,
        }),
      );

      expect(gql).toBe(
        '{ subItemCode: "I1" qtyAsked: "2.00" priceAsked: "3.33" qtyProvided: "1.00" qtyAdjusted: "1.50" },',
      );
    });

    it("leaves out the empty fields of a package entry", () => {
      expect(squash(actions.formatDetailSubService("service", { service: { code: "S1" } }))).toBe(
        '{ subServiceCode: "S1" },',
      );
    });

    it("writes nothing when there are no lines", () => {
      expect(actions.formatDetails("item", null)).toBe("");
    });

    it("skips the blank row the form keeps at the end", () => {
      const gql = squash(actions.formatDetails("item", [item(), {}, { item: null }]));

      expect(gql).toBe('items: [ { itemId: 5 priceAsked: "12.35" qtyProvided: "2.00" status: 1 } ]');
    });
  });

  describe("claim mutations", () => {
    it("writes the required fields with decoded ids", () => {
      const gql = squash(actions.formatClaimGQL(mm(), claim(), false));

      expect(gql).toContain('code: "C-001" autogenerate: false');
      expect(gql).toContain("insureeId: 11 adminId: 22");
      expect(gql).toContain("healthFacilityId: 33");
      expect(gql).toContain("icdId: 44");
      expect(gql).toContain('dateFrom: "2026-09-01"');
      expect(gql).toContain('dateClaimed: "2026-09-02"');
      expect(gql).toContain('visitType: "O"');
      expect(gql).toContain("preAuthorization: false");
      expect(gql).toContain("feedbackStatus: 1");
      expect(gql).toContain("reviewStatus: 1");
      expect(gql).not.toContain("uuid:");
      expect(gql).not.toContain("dateTo");
      expect(gql).not.toContain("icd1Id");
      expect(gql).not.toContain("attachments");
    });

    it("writes the optional fields when they are set", () => {
      const gql = squash(
        actions.formatClaimGQL(
          mm(),
          claim({
            uuid: "c-1",
            dateTo: "2026-09-03",
            icd1: ref("DiagnosisGQLType", 45),
            icd4: ref("DiagnosisGQLType", 48),
            careType: "IPD",
            guaranteeId: "G-9",
            patientCondition: "H",
            referralCode: "RF-1",
            jsonExt: { a: 1 },
          }),
          false,
        ),
      );

      expect(gql).toContain('uuid: "c-1"');
      expect(gql).toContain('dateTo: "2026-09-03"');
      expect(gql).toContain("icd1Id: 45");
      expect(gql).toContain("icd4Id: 48");
      expect(gql).not.toContain("icd2Id");
      expect(gql).toContain('careType: "IPD"');
      expect(gql).toContain('guaranteeId: "G-9"');
      expect(gql).toContain('patientCondition: "H"');
      expect(gql).toContain('referralCode: "RF-1"');
      expect(gql).toContain('jsonExt: "{\\"a\\":1}"');
    });

    it("escapes the explanation and adjustment", () => {
      const gql = actions.formatClaimGQL(mm(), claim({ explanation: "a\\b", adjustment: "x\ny" }), false);

      expect(gql).toContain('explanation: "a\\\\b"');
      expect(gql).toContain('adjustment: "x\\ny"');
    });

    // Currently fails: fe-core's formatGQLString escapes quotes before backslashes, so the
    // backslash it adds for the quote is doubled and the quote ends the string.
    it.fails("keeps a quote in the explanation inside the string", () => {
      const gql = actions.formatClaimGQL(mm(), claim({ explanation: 'said "urgent"' }), false);

      expect(gql).toContain('explanation: "said \\"urgent\\""');
    });

    // Currently fails: the claim code and guarantee number are interpolated without
    // formatGQLString, so a backslash or quote in either corrupts the mutation.
    it.fails("escapes the claim code and guarantee number", () => {
      const gql = actions.formatClaimGQL(mm(), claim({ code: "C\\1", guaranteeId: "G\\1" }), false);

      expect(gql).toContain('code: "C\\\\1"');
      expect(gql).toContain('guaranteeId: "G\\\\1"');
    });

    it("sends a placeholder code when the code is generated by the server", () => {
      const gql = squash(actions.formatClaimGQL(mm(), claim({ code: "" }), true));

      expect(gql).toContain('code: "auto" autogenerate: true');
    });

    it("keeps the original code of a restored claim even when codes are generated", () => {
      const gql = squash(actions.formatClaimGQL(mm(), claim({ restore: { uuid: "old-1" } }), true));

      expect(gql).toContain('code: "C-001" autogenerate: false');
      expect(gql).toContain('restore: "old-1"');
    });

    it.each([
      ["refers from", "R", "referFromId: 77"],
      ["refers to", "O", "referToId: 77"],
    ])("%s the referral facility depending on the visit type", (_label, visitType, expected) => {
      const gql = actions.formatClaimGQL(mm(), claim({ visitType, referHF: ref("HealthFacilityGQLType", 77) }), false);

      expect(gql).toContain(expected);
    });

    it("sends the services, items and attachments", () => {
      const gql = squash(
        actions.formatClaimGQL(
          mm(),
          claim({
            services: [{ service: ref("ServiceGQLType", 6), priceAsked: 10, qtyProvided: 1 }],
            items: [{ item: ref("ItemGQLType", 5), priceAsked: 2, qtyProvided: 3 }],
            attachments: [{ title: "Lab" }],
          }),
          false,
        ),
      );

      expect(gql).toContain('services: [ { serviceId: 6 priceAsked: "10.00" qtyProvided: "1.00"');
      expect(gql).toContain('items: [ { itemId: 5 priceAsked: "2.00" qtyProvided: "3.00" status: 1 } ]');
      expect(gql).toContain('attachments: [ { title: "Lab" } ]');
    });

    it("creates a claim, generating the code when configured to", () => {
      const getConf = vi.fn(() => true);
      const result = actions.createClaim(mm({ getConf }), claim(), "Create claim");

      expect(getConf).toHaveBeenCalledWith("fe-claim", "claimForm.autoGenerateClaimCode", false);
      expect(result.type).toEqual(["CLAIM_MUTATION_REQ", "CLAIM_CREATE_CLAIM_RESP", "CLAIM_MUTATION_ERR"]);
      expect(query(result)).toContain("mutation createClaim { createClaim(");
      expect(query(result)).toContain('code: "auto" autogenerate: true');
      expect(result.meta).toMatchObject({ clientMutationLabel: "Create claim" });
    });

    it("creates a claim with the typed code by default", () => {
      expect(query(actions.createClaim(mm(), claim(), "Create claim"))).toContain('code: "C-001" autogenerate: false');
    });

    it("never regenerates the code of a claim being updated and tags it with the mutation", () => {
      const edited = claim({ uuid: "c-1" });
      const result = actions.updateClaim(mm({ getConf: () => true }), edited, "Update claim");

      expect(result.type).toEqual(["CLAIM_MUTATION_REQ", "CLAIM_UPDATE_CLAIM_RESP", "CLAIM_MUTATION_ERR"]);
      expect(query(result)).toContain("mutation updateClaim { updateClaim(");
      expect(query(result)).toContain('code: "C-001" autogenerate: false');
      expect(edited.clientMutationId).toBe(result.meta.clientMutationId);
    });
  });

  describe("workflow mutations on a selection", () => {
    it.each([
      ["submit", "submitClaims", "CLAIM_SUBMIT_CLAIMS_RESP"],
      ["del", "deleteClaims", "CLAIM_DELETE_CLAIMS_RESP"],
      ["selectForFeedback", "selectClaimsForFeedback", "CLAIM_SELECT_CLAIMS_FOR_FEEDBACK_RESP"],
      ["bypassFeedback", "bypassClaimsFeedback", "CLAIM_BYPASS_CLAIMS_FEEDBACK_RESP"],
      ["skipFeedback", "skipClaimsFeedback", "CLAIM_SKIP_CLAIMS_FEEDBACK_RESP"],
      ["selectForReview", "selectClaimsForReview", "CLAIM_SELECT_CLAIMS_FOR_REVIEW_RESP"],
      ["bypassReview", "bypassClaimsReview", "CLAIM_BYPASS_CLAIMS_REVIEW_RESP"],
      ["deliverReview", "deliverClaimsReview", "CLAIM_DELIVER_CLAIMS_REVIEW_RESP"],
      ["skipReview", "skipClaimsReview", "CLAIM_SKIP_CLAIMS_REVIEW_RESP"],
      ["process", "processClaims", "CLAIM_PROCESS_CLAIMS_RESP"],
    ])("%s sends %s for every selected claim", (creator, operationName, respType) => {
      const claims = [{ uuid: "c-1" }, { uuid: "c-2" }];
      const result = actions[creator](claims, "Bulk", { count: 2 });

      expect(result.type).toEqual(["CLAIM_MUTATION_REQ", respType, "CLAIM_MUTATION_ERR"]);
      expect(query(result)).toContain(`mutation ${operationName} { ${operationName}(`);
      expect(query(result)).toContain('uuids: ["c-1","c-2"]');
      expect(query(result)).toContain('clientMutationDetails: {"count":2}');
      expect(result.meta).toMatchObject({ clientMutationLabel: "Bulk", clientMutationDetails: '{"count":2}' });
      expect(claims.map((c) => c.clientMutationId)).toEqual([result.meta.clientMutationId, result.meta.clientMutationId]);
    });

    it("records no details when none are given", () => {
      const result = actions.submit([{ uuid: "c-1" }], "Submit");

      expect(result.meta.clientMutationDetails).toBeNull();
      expect(query(result)).not.toContain("clientMutationDetails");
    });

    it("submits every claim matching the active filters", () => {
      const result = actions.submitAll(
        {
          status: { filter: "status: 2" },
          code: { filter: 'code_Icontains: "C-0"' },
          admin: { filter: null },
        },
        "Submit all",
      );

      expect(result.type).toEqual(["CLAIM_MUTATION_REQ", "CLAIM_SUBMIT_CLAIMS_RESP", "CLAIM_MUTATION_ERR"]);
      expect(query(result)).toContain('additionalFilters: "{\\"status\\":2,\\"code_Icontains\\":\\"C-0\\"}"');
      expect(query(result)).not.toContain("uuids");
    });
  });

  describe("feedback", () => {
    it("sends every answered feedback field, keeping falsy answers", () => {
      const subject = {
        uuid: "c-1",
        feedback: {
          feedbackDate: "2026-09-10",
          officerId: 3,
          careRendered: false,
          paymentAsked: true,
          drugPrescribed: false,
          drugReceived: true,
          asessment: 0,
        },
      };
      const result = actions.deliverFeedback(subject, "Feedback");

      expect(result.type).toEqual(["CLAIM_MUTATION_REQ", "CLAIM_DELIVER_CLAIM_FEEDBACK_RESP", "CLAIM_MUTATION_ERR"]);
      expect(query(result)).toContain(
        'claimUuid: "c-1" feedback: { feedbackDate: "2026-09-10" officerId: 3 careRendered: false paymentAsked: true' +
          " drugPrescribed: false drugReceived: true asessment: 0 }",
      );
      expect(subject.clientMutationId).toBe(result.meta.clientMutationId);
    });

    it("leaves out unanswered feedback fields", () => {
      const result = actions.deliverFeedback({ uuid: "c-1", feedback: { careRendered: null } }, "Feedback");

      expect(query(result)).toContain('claimUuid: "c-1" feedback: { }');
    });
  });

  describe("review", () => {
    const reviewed = (overrides = {}) => ({
      id: 91,
      item: ref("ItemGQLType", 5),
      qtyApproved: 1.005,
      priceApproved: 9.999,
      justification: null,
      status: 1,
      rejectionReason: null,
      ...overrides,
    });

    it("writes an approved line with amounts rounded to two decimals", () => {
      expect(squash(actions.formatReviewDetail("item", reviewed()))).toBe(
        '{ id: 91 itemId: 5 qtyApproved: "1.01" priceApproved: "10.00" status: 1 }',
      );
    });

    it("writes a rejected line with its reason", () => {
      const gql = squash(actions.formatReviewDetail("item", reviewed({ status: 2, rejectionReason: -1 })));

      expect(gql).toContain("status: 2 rejectionReason: -1");
    });

    it("leaves out approvals the reviewer did not set", () => {
      const gql = squash(actions.formatReviewDetail("item", reviewed({ qtyApproved: null, priceApproved: null })));

      expect(gql).toBe("{ id: 91 itemId: 5 status: 1 }");
    });

    it("escapes the justification", () => {
      expect(actions.formatReviewDetail("item", reviewed({ justification: "per\npolicy" }))).toContain(
        'justification: "per\\npolicy"',
      );
    });

    // Currently fails: fe-core's formatGQLString escapes quotes before backslashes, so the
    // backslash it adds for the quote is doubled and the quote ends the string.
    it.fails("keeps a quote in the justification inside the string", () => {
      expect(actions.formatReviewDetail("item", reviewed({ justification: 'per "policy"' }))).toContain(
        'justification: "per \\"policy\\""',
      );
    });

    it("sends the adjusted package contents of a service", () => {
      const gql = squash(
        actions.formatReviewDetail("service", {
          ...reviewed({ item: undefined }),
          service: ref("ServiceGQLType", 6),
          items: [{ item: { code: "I1" }, qtyAdjusted: 1 }],
          services: [{ service: { code: "S1" }, qtyAdjusted: 2 }],
        }),
      );

      expect(gql).toContain('serviceServiceSet: [ { subServiceCode: "S1" qtyAdjusted: "2.00" },]');
      expect(gql).toContain('serviceItemSet: [ { subItemCode: "I1" qtyAdjusted: "1.00" },]');
    });

    // Currently fails: the approvals are guarded with `!== null` only, so an approved
    // quantity the reviewer cleared (the number input reports undefined) is saved as "NaN".
    it.fails("leaves out an approval the reviewer cleared", () => {
      const gql = actions.formatReviewDetail("item", reviewed({ qtyApproved: undefined }));

      expect(gql).not.toContain("NaN");
    });

    it("writes nothing when there are no reviewed lines", () => {
      expect(actions.formatReviewDetails("item", null)).toBe("");
      expect(actions.formatReviewDetails("item", [])).toBe("");
    });

    it("saves the review with its adjustment and both kinds of line", () => {
      const subject = {
        uuid: "c-1",
        adjustment: "cut\ta",
        items: [reviewed()],
        services: [{ ...reviewed({ id: 92, item: undefined }), service: ref("ServiceGQLType", 6) }],
      };
      const result = actions.saveReview(subject, "Review");

      expect(result.type).toEqual(["CLAIM_MUTATION_REQ", "CLAIM_SAVE_CLAIM_REVIEW_RESP", "CLAIM_MUTATION_ERR"]);
      expect(query(result)).toContain('claimUuid: "c-1" adjustment: "cut\\ta" services: [ { id: 92 serviceId: 6');
      expect(query(result)).toContain("items: [ { id: 91 itemId: 5");
      expect(subject.clientMutationId).toBe(result.meta.clientMutationId);
    });

    it("saves a review without adjustment or lines", () => {
      const result = actions.saveReview({ uuid: "c-1" }, "Review");

      expect(query(result)).not.toContain("adjustment");
      expect(query(result)).not.toContain("services:");
    });
  });
});
