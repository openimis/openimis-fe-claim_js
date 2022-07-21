import ClaimMainMenu from "./menus/ClaimMainMenu";
import HealthFacilitiesPage from "./pages/HealthFacilitiesPage";
import EditPage from "./pages/EditPage";
import ReviewsPage from "./pages/ReviewsPage";
import ReviewPage from "./pages/ReviewPage";
import FeedbackPage from "./pages/FeedbackPage";
import ClaimAdminPicker from "./pickers/ClaimAdminPicker";
import ClaimOfficerPicker from "./pickers/ClaimOfficerPicker";
import ClaimStatusPicker from "./pickers/ClaimStatusPicker";
import ReviewStatusPicker from "./pickers/ReviewStatusPicker";
import ServiceFilterPicker from "./pickers/MedicalServiceFilterPicker";
import ApprovalStatusPicker from "./pickers/ApprovalStatusPicker";
import RejectionReasonPicker from "./pickers/RejectionReasonPicker";
import FeedbackStatusPicker from "./pickers/FeedbackStatusPicker";
import ClaimMasterPanelExt from "./components/ClaimMasterPanelExt";
import AttachmentsDialog from "./components/AttachmentsDialog";
import messages_en from "./translations/en.json";
import reducer from "./reducer";

const ROUTE_HEALTH_FACILITIES = "claim/healthFacilities";
const ROUTE_CLAIM_EDIT = "claim/claim";
const ROUTE_REVIEWS = "claim/reviews";
const ROUTE_CLAIM_REVIEW = "claim/review";
const ROUTE_CLAIM_FEEDBACK = "claim/feedback";

const DEFAULT_CONFIG = {
  "translations": [{ key: "en", messages: messages_en }],
  "reducers": [{ key: "claim", reducer }],
  "refs": [
    { key: "claim.route.healthFacilities", ref: ROUTE_HEALTH_FACILITIES },
    { key: "claim.route.claimEdit", ref: ROUTE_CLAIM_EDIT },
    { key: "claim.route.reviews", ref: ROUTE_REVIEWS },
    { key: "claim.route.feedback", ref: ROUTE_CLAIM_FEEDBACK },
    { key: "claim.route.review", ref: ROUTE_CLAIM_REVIEW },
    { key: "claim.ClaimAdminPicker", ref: ClaimAdminPicker },
    {
      key: "claim.ClaimAdminPicker.projection",
      ref: [
        "id",
        "uuid",
        "code",
        "lastName",
        "otherNames",
        "healthFacility{id, uuid, code, name, level, servicesPricelist{id, uuid}, itemsPricelist{id, uuid}, location{id, uuid, code, name, parent{id, uuid, code, name}}}",
      ],
    },
    { key: "claim.ClaimOfficerPicker", ref: ClaimOfficerPicker },
    { key: "claim.ClaimOfficerPicker.projection", ref: ["id", "uuid", "code", "lastName", "otherNames"] },
    { key: "claim.ClaimStatusPicker", ref: ClaimStatusPicker },
    { key: "claim.ClaimStatusPicker.projection", ref: null },
    { key: "claim.ReviewStatusPicker", ref: ReviewStatusPicker },
    { key: "claim.ReviewStatusPicker.projection", ref: null },
    { key: "claim.ApprovalStatusPicker", ref: ApprovalStatusPicker },
    { key: "claim.ApprovalStatusPicker.projection", ref: null },
    { key: "claim.FeedbackStatusPicker", ref: FeedbackStatusPicker },
    { key: "claim.FeedbackStatusPicker.projection", ref: null },
    { key: "claim.RejectionReasonPicker", ref: RejectionReasonPicker },
    { key: "claim.RejectionReasonPicker.projection", ref: null },
    { key: "medical.ServiceFilterPicker", ref: ServiceFilterPicker },
    { key: "claim.CreateClaim.feedbackStatus", ref: 1 },
    { key: "claim.CreateClaim.reviewStatus", ref: 1 },
    { key: "claim.ClaimMasterPanelExt", ref: ClaimMasterPanelExt },
    { key: "claim.AttachmentsDialog", ref: AttachmentsDialog },
  ],
  "core.Router": [
    { path: ROUTE_HEALTH_FACILITIES, component: HealthFacilitiesPage },
    { path: ROUTE_CLAIM_EDIT + "/:claim_uuid?", component: EditPage }, // ? = optional (needed to route new claims)
    { path: ROUTE_REVIEWS, component: ReviewsPage },
    { path: ROUTE_CLAIM_REVIEW + "/:claim_uuid", component: ReviewPage },
    { path: ROUTE_CLAIM_FEEDBACK + "/:claim_uuid", component: FeedbackPage },
  ],
  "core.MainMenu": [ClaimMainMenu],
  "claim.MasterPanel": [ClaimMasterPanelExt],
};

export const ClaimModule = (cfg) => {
  return { ...DEFAULT_CONFIG, ...cfg };
};
