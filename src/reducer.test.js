import { describe, expect, it, vi } from "vitest";

// fe-core's barrel imports itself, so the real helpers come from their defining modules.
vi.mock("@openimis/fe-core", async () => vi.importActual("@openimis/fe-core/helpers/api"));

const { default: reducer } = await import("./reducer");
const { graphqlErrors, relayPage, serverError } = await import("@openimis/fe-core/testing");

const initial = () => reducer(undefined, { type: "@@INIT" });
const dispatch = (state, type, { payload, meta } = {}) => reducer(state, { type, payload, meta });
const respond = (state, type, data, extra = {}) => dispatch(state, type, { payload: { data, ...extra } });
const fail = (state, type, payload = serverError(500, "Internal Server Error", "boom")) =>
  dispatch(state, type, { payload });

const SERVER_ERROR = { code: 500, message: "Internal Server Error", detail: "boom" };
const DATA_ERROR = { code: "Data error", message: "Server returned data error status", detail: "bad filter" };

describe("claim reducer", () => {
  describe("initialisation", () => {
    it("starts with nothing loaded and nothing in flight", () => {
      const state = initial();

      expect(state.claims).toBeNull();
      expect(state.claimsPageInfo).toEqual({ totalCount: 0 });
      expect(state.claim).toEqual({});
      expect(state.claimAttachments).toBeNull();
      expect(state.history).toBeNull();
      expect(state.submittingMutation).toBe(false);
      expect(state.mutation).toEqual({});
      expect(state.claimOfficers).toEqual({
        items: [],
        isFetching: false,
        isFetched: false,
        pageInfo: { totalCount: 0 },
        error: null,
      });
    });

    it("returns the same state object for an unrelated action", () => {
      const state = initial();

      expect(reducer(state, { type: "SOMETHING_ELSE" })).toBe(state);
    });
  });

  describe("paged lists", () => {
    const LISTS = [
      ["claim attachments", "CLAIM_CLAIM_ATTACHMENTS", "claimAttachments", "ClaimAttachments", "claimAttachments"],
      ["claims", "CLAIM_CLAIM_SEARCHER", "claims", "Claims", "claims"],
    ];

    it.each(LISTS)("empties the %s and clears the error when a request starts", (_l, type, _key, suffix, field) => {
      const stale = {
        ...initial(),
        [field]: [{ uuid: "old" }],
        [`fetched${suffix}`]: true,
        [`error${suffix}`]: SERVER_ERROR,
      };
      const state = dispatch(stale, `${type}_REQ`);

      expect(state[`fetching${suffix}`]).toBe(true);
      expect(state[`fetched${suffix}`]).toBe(false);
      expect(state[field]).toBeNull();
      expect(state[`error${suffix}`]).toBeNull();
    });

    it.each(LISTS)("unwraps the %s page", (_l, type, key, suffix, field) => {
      const state = respond(initial(), `${type}_RESP`, { [key]: relayPage([{ uuid: "a" }, { uuid: "b" }]) });

      expect(state[`fetching${suffix}`]).toBe(false);
      expect(state[`fetched${suffix}`]).toBe(true);
      expect(state[field]).toEqual([{ uuid: "a" }, { uuid: "b" }]);
      expect(state[`error${suffix}`]).toBeNull();
    });

    it.each(LISTS)("keeps a data error returned with the %s page", (_l, type, key, suffix) => {
      const state = respond(initial(), `${type}_RESP`, { [key]: relayPage([]) }, graphqlErrors("bad filter"));

      expect(state[`error${suffix}`]).toEqual(DATA_ERROR);
    });

    it.each(LISTS)("stops fetching and reports a transport failure of the %s", (_l, type, _key, suffix) => {
      const state = fail(dispatch(initial(), `${type}_REQ`), `${type}_ERR`);

      expect(state[`fetching${suffix}`]).toBe(false);
      expect(state[`error${suffix}`]).toEqual(SERVER_ERROR);
    });

    it("resets the claim count while a search is running", () => {
      const stale = { ...initial(), claimsPageInfo: { totalCount: 42, hasNextPage: true } };

      expect(dispatch(stale, "CLAIM_CLAIM_SEARCHER_REQ").claimsPageInfo).toEqual({ totalCount: 0 });
    });

    it("counts the claims and keeps the cursors for paging", () => {
      const state = respond(initial(), "CLAIM_CLAIM_SEARCHER_RESP", {
        claims: relayPage([{ uuid: "a" }], { totalCount: 31, pageInfo: { hasNextPage: true, endCursor: "YXJyYXk6MA==" } }),
      });

      expect(state.claimsPageInfo).toMatchObject({ totalCount: 31, hasNextPage: true, endCursor: "YXJyYXk6MA==" });
    });

    it("treats a missing attachment list as empty", () => {
      expect(respond(initial(), "CLAIM_CLAIM_ATTACHMENTS_RESP", { claimAttachments: null }).claimAttachments).toEqual(
        [],
      );
    });
  });

  describe("the claim being edited", () => {
    it("drops the previous claim when a load starts", () => {
      const state = dispatch({ ...initial(), claim: { uuid: "old" }, errorClaim: SERVER_ERROR }, "CLAIM_CLAIM_REQ");

      expect(state).toMatchObject({ fetchingClaim: true, fetchedClaim: false, claim: null, errorClaim: null });
    });

    it("keeps the claim exactly as the server returned it", () => {
      const claim = { uuid: "c-1", code: "C1", services: [{ id: 1 }], claimed: "12.50" };
      const state = respond(initial(), "CLAIM_CLAIM_RESP", { claim });

      expect(state).toMatchObject({ fetchingClaim: false, fetchedClaim: true, errorClaim: null });
      expect(state.claim).toBe(claim);
    });

    it("keeps a data error returned with the claim", () => {
      expect(respond(initial(), "CLAIM_CLAIM_RESP", { claim: null }, graphqlErrors("bad filter")).errorClaim).toEqual(
        DATA_ERROR,
      );
    });

    it("stops loading and reports a transport failure", () => {
      const state = fail(dispatch(initial(), "CLAIM_CLAIM_REQ"), "CLAIM_CLAIM_ERR");

      expect(state.fetchingClaim).toBe(false);
      expect(state.errorClaim).toEqual(SERVER_ERROR);
    });

    it("forgets the claim when cleared", () => {
      const loaded = respond(initial(), "CLAIM_CLAIM_RESP", { claim: { uuid: "c-1" } });

      expect(dispatch(loaded, "CLAIM_CLAIM_CLEAR")).toMatchObject({
        fetchingClaim: false,
        fetchedClaim: false,
        claim: null,
        errorClaim: null,
      });
    });
  });

  describe("previous-claim lookups", () => {
    const LOOKUPS = [
      ["last claim", "CLAIM_LAST_CLAIM_AT", "claims", "LastClaimAt", "lastClaimAt"],
      ["same-diagnosis claim", "CLAIM_SAME_DIAGNOSIS", "claimWithSameDiagnosis", "SameDiagnosisClaim", "sameDiagnosisClaim"],
    ];

    it.each(LOOKUPS)("drops the previous %s when a lookup starts", (_l, type, _key, suffix, field) => {
      const state = dispatch({ ...initial(), [field]: { code: "old" } }, `${type}_REQ`);

      expect(state[`fetching${suffix}`]).toBe(true);
      expect(state[`fetched${suffix}`]).toBe(false);
      expect(state[field]).toBeNull();
      expect(state[`error${suffix}`]).toBeNull();
    });

    it.each(LOOKUPS)("keeps only the first %s found", (_l, type, key, suffix, field) => {
      const state = respond(initial(), `${type}_RESP`, { [key]: relayPage([{ code: "C9" }, { code: "C8" }]) });

      expect(state[`fetching${suffix}`]).toBe(false);
      expect(state[`fetched${suffix}`]).toBe(true);
      expect(state[field]).toEqual({ code: "C9" });
    });

    it.each(LOOKUPS)("records that there is no %s when nothing matches", (_l, type, key, _suffix, field) => {
      expect(respond(initial(), `${type}_RESP`, { [key]: relayPage([]) })[field]).toBeNull();
      expect(respond(initial(), `${type}_RESP`, { [key]: null })[field]).toBeNull();
    });

    it.each(LOOKUPS)("stops looking and reports a transport failure of the %s", (_l, type, _key, suffix) => {
      const state = fail(dispatch(initial(), `${type}_REQ`), `${type}_ERR`);

      expect(state[`fetching${suffix}`]).toBe(false);
      expect(state[`error${suffix}`]).toEqual(SERVER_ERROR);
    });

    it("keeps a data error returned with the same-diagnosis claim", () => {
      const state = respond(
        initial(),
        "CLAIM_SAME_DIAGNOSIS_RESP",
        { claimWithSameDiagnosis: relayPage([]) },
        graphqlErrors("bad filter"),
      );

      expect(state.errorSameDiagnosisClaim).toEqual(DATA_ERROR);
    });

    // Currently fails: the success branch writes the data error to `errorCLastClaimAt`
    // (a typo), so the panel reading errorLastClaimAt never shows it.
    it.fails("keeps a data error returned with the last claim", () => {
      const state = respond(initial(), "CLAIM_LAST_CLAIM_AT_RESP", { claims: relayPage([]) }, graphqlErrors("bad filter"));

      expect(state.errorLastClaimAt).toEqual(DATA_ERROR);
    });
  });

  describe("claim code count", () => {
    it("drops the previous count when a count starts", () => {
      const state = dispatch({ ...initial(), claimCodeCount: 3 }, "CLAIM_CLAIM_CODE_COUNT_REQ");

      expect(state).toMatchObject({ fetchingClaimCodeCount: true, fetchedClaimCodeCount: false, claimCodeCount: null });
    });

    it("stores how many claims share the code", () => {
      const state = respond(initial(), "CLAIM_CLAIM_CODE_COUNT_RESP", { claims: { totalCount: 2 } });

      expect(state).toMatchObject({ fetchingClaimCodeCount: false, fetchedClaimCodeCount: true, claimCodeCount: 2 });
    });

    it("stops counting and reports a transport failure", () => {
      const state = fail(dispatch(initial(), "CLAIM_CLAIM_CODE_COUNT_REQ"), "CLAIM_CLAIM_CODE_COUNT_ERR");

      expect(state.fetchingClaimCodeCount).toBe(false);
      expect(state.errorClaimCodeCount).toEqual(SERVER_ERROR);
    });
  });

  describe("claim officers", () => {
    const officer = (code) => ({ id: `id-${code}`, code, lastName: "Doe", otherNames: "Jo" });

    it("keeps the current officers on screen while a search runs", () => {
      const loaded = respond(initial(), "CLAIM_ENROLMENT_OFFICERS_RESP", { claimOfficers: relayPage([officer("A")]) });
      const state = dispatch(loaded, "CLAIM_ENROLMENT_OFFICERS_REQ");

      expect(state.claimOfficers.isFetching).toBe(true);
      expect(state.claimOfficers.items).toEqual([officer("A")]);
    });

    it("unwraps and counts the officers found", () => {
      const state = respond(initial(), "CLAIM_ENROLMENT_OFFICERS_RESP", {
        claimOfficers: relayPage([officer("A"), officer("B")], { totalCount: 7 }),
      });

      expect(state.claimOfficers).toMatchObject({
        isFetching: false,
        isFetched: true,
        items: [officer("A"), officer("B")],
        pageInfo: { totalCount: 7 },
      });
    });

    it("stops searching when the officer search fails", () => {
      const state = fail(dispatch(initial(), "CLAIM_ENROLMENT_OFFICERS_REQ"), "CLAIM_ENROLMENT_OFFICERS_ERR");

      expect(state.claimOfficers).toMatchObject({ isFetching: false, isFetched: false });
    });

    // Currently fails: the error branch formats a transport failure with the GraphQL
    // formatter, which returns null when the payload has no top-level errors array.
    it.fails("reports a transport failure of the officer search", () => {
      const state = fail(dispatch(initial(), "CLAIM_ENROLMENT_OFFICERS_REQ"), "CLAIM_ENROLMENT_OFFICERS_ERR");

      expect(state.claimOfficers.error).toEqual(SERVER_ERROR);
    });
  });

  describe("claim code validation", () => {
    const claimCode = (state) => state.validationFields.claimCode;
    const withOtherField = () => ({ ...initial(), validationFields: { other: { isValid: true } } });

    it("marks the code as being checked", () => {
      expect(claimCode(dispatch(initial(), "CLAIM_CODE_FIELDS_VALIDATION_REQ"))).toEqual({
        isValidating: true,
        isValid: false,
        validationError: null,
      });
    });

    it.each([true, false])("records the server's verdict (%s)", (isValid) => {
      const state = respond(initial(), "CLAIM_CODE_FIELDS_VALIDATION_RESP", { isValid });

      expect(claimCode(state)).toEqual({ isValidating: false, isValid, validationError: null });
    });

    it("keeps a data error returned with the verdict", () => {
      const state = respond(initial(), "CLAIM_CODE_FIELDS_VALIDATION_RESP", { isValid: null }, graphqlErrors("bad filter"));

      expect(claimCode(state).validationError).toEqual(DATA_ERROR);
    });

    it("treats a transport failure as an invalid code", () => {
      const state = fail(initial(), "CLAIM_CODE_FIELDS_VALIDATION_ERR");

      expect(claimCode(state)).toEqual({ isValidating: false, isValid: false, validationError: SERVER_ERROR });
    });

    it("can be told the code is valid without asking the server", () => {
      expect(claimCode(dispatch(initial(), "CLAIM_CODE_FIELDS_VALIDATION_SET_VALID"))).toEqual({
        isValidating: false,
        isValid: true,
        validationError: null,
      });
    });

    it.each([
      "CLAIM_CODE_FIELDS_VALIDATION_REQ",
      "CLAIM_CODE_FIELDS_VALIDATION_ERR",
      "CLAIM_CODE_FIELDS_VALIDATION_CLEAR",
      "CLAIM_CODE_FIELDS_VALIDATION_SET_VALID",
    ])("leaves the other validated fields alone on %s", (type) => {
      expect(fail(withOtherField(), type).validationFields.other).toEqual({ isValid: true });
    });

    it("forgets the verdict and error on clear", () => {
      const checked = fail(initial(), "CLAIM_CODE_FIELDS_VALIDATION_ERR");
      const state = dispatch(checked, "CLAIM_CODE_FIELDS_VALIDATION_CLEAR");

      expect(claimCode(state)).toMatchObject({ isValid: false, validationError: null });
    });

    // Currently fails: clearing sets isValidating true, so the form believes a check it
    // just cancelled is still running.
    it.fails("stops validating on clear", () => {
      const state = dispatch(initial(), "CLAIM_CODE_FIELDS_VALIDATION_CLEAR");

      expect(claimCode(state).isValidating).toBe(false);
    });
  });

  describe("location selection", () => {
    const region = { uuid: "r-1", code: "R1" };
    const district = { uuid: "d-1", code: "D1", parent: region };
    const healthFacility = { uuid: "hf-1", code: "HF1", location: district };
    const admin = { uuid: "a-1", code: "A1", healthFacility };
    const everything = () => ({
      ...initial(),
      claimAdmin: admin,
      claimHealthFacility: healthFacility,
      claimDistrict: district,
      claimRegion: region,
    });

    it("fills the health facility, district and region from the selected admin", () => {
      const state = dispatch(initial(), "CLAIM_CLAIM_ADMIN_SELECTED", { payload: admin });

      expect(state).toMatchObject({
        claimAdmin: admin,
        claimHealthFacility: healthFacility,
        claimDistrict: district,
        claimRegion: region,
      });
    });

    it("keeps the facility and location when the admin is cleared", () => {
      const state = dispatch(everything(), "CLAIM_CLAIM_ADMIN_SELECTED", { payload: null });

      expect(state).toMatchObject({ claimAdmin: null, claimHealthFacility: healthFacility, claimRegion: region });
    });

    it("fills the district and region from the selected health facility", () => {
      const state = dispatch(initial(), "CLAIM_CLAIM_HEALTH_FACILITY_SELECTED", { payload: healthFacility });

      expect(state).toMatchObject({ claimHealthFacility: healthFacility, claimDistrict: district, claimRegion: region });
    });

    it("drops the admin but keeps the location when the facility is cleared", () => {
      const state = dispatch(everything(), "CLAIM_CLAIM_HEALTH_FACILITY_SELECTED", { payload: null });

      expect(state).not.toHaveProperty("claimAdmin");
      expect(state).toMatchObject({ claimHealthFacility: null, claimDistrict: district, claimRegion: region });
    });

    it("fills the region from the selected district", () => {
      const state = dispatch(initial(), "CLAIM_CLAIM_DISTRICT_SELECTED", { payload: district });

      expect(state).toMatchObject({ claimDistrict: district, claimRegion: region });
    });

    it("drops the facility and admin but keeps the region when the district is cleared", () => {
      const state = dispatch(everything(), "CLAIM_CLAIM_DISTRICT_SELECTED", { payload: null });

      expect(state).not.toHaveProperty("claimAdmin");
      expect(state).not.toHaveProperty("claimHealthFacility");
      expect(state).toMatchObject({ claimDistrict: null, claimRegion: region });
    });

    it("keeps everything below a newly selected region", () => {
      const other = { uuid: "r-2" };
      const state = dispatch(everything(), "CLAIM_CLAIM_REGION_SELECTED", { payload: other });

      expect(state).toMatchObject({ claimRegion: other, claimDistrict: district, claimAdmin: admin });
    });

    it("drops everything below the region when it is cleared", () => {
      const state = dispatch(everything(), "CLAIM_CLAIM_REGION_SELECTED", { payload: null });

      expect(state.claimRegion).toBeNull();
      expect(state).not.toHaveProperty("claimDistrict");
      expect(state).not.toHaveProperty("claimHealthFacility");
      expect(state).not.toHaveProperty("claimAdmin");
    });

    it("does not change the state it was given", () => {
      const before = everything();
      dispatch(before, "CLAIM_CLAIM_REGION_SELECTED", { payload: null });

      expect(before.claimAdmin).toBe(admin);
    });
  });

  describe("mutations", () => {
    const MUTATION_RESULTS = [
      ["CLAIM_CREATE_CLAIM_RESP", "createClaim"],
      ["CLAIM_UPDATE_CLAIM_RESP", "updateClaim"],
      ["CLAIM_SUBMIT_CLAIMS_RESP", "submitClaims"],
      ["CLAIM_DELETE_CLAIMS_RESP", "deleteClaims"],
      ["CLAIM_SELECT_CLAIMS_FOR_FEEDBACK_RESP", "selectClaimsForFeedback"],
      ["CLAIM_BYPASS_CLAIMS_FEEDBACK_RESP", "bypassClaimsFeedback"],
      ["CLAIM_SKIP_CLAIMS_FEEDBACK_RESP", "skipClaimsFeedback"],
      ["CLAIM_DELIVER_CLAIM_FEEDBACK_RESP", "deliverClaimFeedback"],
      ["CLAIM_SELECT_CLAIMS_FOR_REVIEW_RESP", "selectClaimsForReview"],
      ["CLAIM_BYPASS_CLAIMS_REVIEW_RESP", "bypassClaimsReview"],
      ["CLAIM_SKIP_CLAIMS_REVIEW_RESP", "skipClaimsReview"],
      ["CLAIM_SAVE_CLAIM_REVIEW_RESP", "saveClaimReview"],
      ["CLAIM_DELIVER_CLAIMS_REVIEW_RESP", "deliverClaimsReview"],
      ["CLAIM_PROCESS_CLAIMS_RESP", "processClaims"],
      ["CLAIM_CREATE_CLAIM_ATTACHMENT_RESP", "createClaimAttachment"],
      ["CLAIM_UPDATE_CLAIM_ATTACHMENT_RESP", "updateClaimAttachment"],
      ["CLAIM_DELETE_CLAIM_ATTACHMENT_RESP", "deleteClaimAttachment"],
    ];

    const submitting = () =>
      dispatch(initial(), "CLAIM_MUTATION_REQ", {
        meta: { clientMutationId: "cmid-1", clientMutationLabel: "Save claim C1" },
      });

    it("records the request metadata while a mutation is in flight", () => {
      expect(submitting()).toMatchObject({
        submittingMutation: true,
        mutation: { id: "cmid-1", clientMutationLabel: "Save claim C1" },
      });
    });

    it("serialises a Date requested time so the store stays serialisable", () => {
      const requestedDateTime = new Date("2026-09-30T09:00:00.000Z");
      const state = dispatch(initial(), "CLAIM_MUTATION_REQ", { meta: { requestedDateTime } });

      expect(state.mutation.requestedDateTime).toBe("2026-09-30T09:00:00.000Z");
    });

    it.each(MUTATION_RESULTS)("clears the in-flight flag and keeps the internal id of %s", (type, service) => {
      const state = dispatch(submitting(), type, { payload: { data: { [service]: { internalId: "internal-1" } } } });

      expect(state.submittingMutation).toBe(false);
      expect(state.mutation).toMatchObject({ id: "internal-1", clientMutationLabel: "Save claim C1" });
    });

    it("raises an alert when a mutation fails", () => {
      const state = fail(submitting(), "CLAIM_MUTATION_ERR", { status: 500, statusText: "Internal Server Error" });

      expect(JSON.parse(state.alert)).toEqual({ status: 500, statusText: "Internal Server Error" });
    });

    // Currently fails: dispatchMutationErr in fe-core only stores the alert, so every
    // module is left believing the mutation is still being submitted.
    it.fails("stops submitting once a mutation has failed", () => {
      expect(fail(submitting(), "CLAIM_MUTATION_ERR", { status: 500 }).submittingMutation).toBe(false);
    });

    it("drops the alert when core clears it", () => {
      const alerted = fail(submitting(), "CLAIM_MUTATION_ERR", { status: 500 });

      expect(dispatch(alerted, "CORE_ALERT_CLEAR")).not.toHaveProperty("alert");
    });
  });

  describe("printing", () => {
    it("is generating from print until the document arrives", () => {
      const printing = dispatch(initial(), "CLAIM_PRINT");

      expect(printing.generating).toBe(true);
      expect(dispatch(printing, "CLAIM_PRINT_DONE").generating).toBe(false);
    });
  });

  describe("claim history", () => {
    it("drops the previous history when a load starts", () => {
      const state = dispatch({ ...initial(), history: [{ uuid: "old" }], errorHistory: "x" }, "CLAIM_HISTORY_FETCH_REQ");

      expect(state).toMatchObject({ fetchingHistory: true, fetchedHistory: false, history: null, errorHistory: null });
    });

    it("unwraps the history page", () => {
      const state = respond(initial(), "CLAIM_HISTORY_FETCH_RESP", {
        claimHistory: relayPage([{ uuid: "v2" }, { uuid: "v1" }]),
      });

      expect(state).toMatchObject({ fetchingHistory: false, fetchedHistory: true });
      expect(state.history).toEqual([{ uuid: "v2" }, { uuid: "v1" }]);
    });

    it("treats a response without data as an empty history", () => {
      expect(dispatch(initial(), "CLAIM_HISTORY_FETCH_RESP", { payload: {} }).history).toEqual([]);
    });

    // Currently fails: the error branch hands formatGraphQLError the bare `errors` array,
    // which has no `.errors` of its own, so every failure is recorded as null.
    it.fails("keeps the history failure so the panel can report it", () => {
      const state = fail(dispatch(initial(), "CLAIM_HISTORY_FETCH_REQ"), "CLAIM_HISTORY_FETCH_ERR");

      expect(state.fetchingHistory).toBe(false);
      expect(state.errorHistory).not.toBeNull();
    });

    // Currently fails: with no response body, `payload.response.errors` is undefined and
    // formatGraphQLError(undefined) throws, so the reducer itself crashes.
    it.fails("stops fetching when the history request fails without a response body", () => {
      const state = fail(dispatch(initial(), "CLAIM_HISTORY_FETCH_REQ"), "CLAIM_HISTORY_FETCH_ERR", serverError(502, "Bad Gateway"));

      expect(state.fetchingHistory).toBe(false);
    });
  });
});
