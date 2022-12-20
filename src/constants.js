import _ from "lodash";

export const CLAIM_STATUS = [1, 2, 4, 8, 16];
export const REVIEW_STATUS = [1, 2, 4, 8, 16];
export const FEEDBACK_STATUS = [1, 2, 4, 8, 16];
export const APPROVAL_STATUS = [1, 2];
export const REJECTION_REASONS = _.range(-1, 20);
export const FEEDBACK_ASSESSMENTS = _.range(-1, 6);

export const RIGHT_CLAIM = 111000;
export const RIGHT_SEARCH = 111001;
export const RIGHT_ADD = 111002;
// export const RIGHT_EDIT = 111003
export const RIGHT_DELETE = 111004;
export const RIGHT_LOAD = 111005;
export const RIGHT_PRINT = 111006;
export const RIGHT_SUBMIT = 111007;
export const RIGHT_CLAIMREVIEW = 111008;
export const RIGHT_FEEDBACK = 111009;
export const RIGHT_UPDATE = 111010;
export const RIGHT_PROCESS = 111011;
