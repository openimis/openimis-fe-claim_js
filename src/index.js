import { ClaimMainMenu } from "./components/ClaimMainMenu";
import { ClaimsPage } from "./components/ClaimsPage";
import { ReviewPage } from "./components/ReviewPage";
import { BatchPage } from "./components/BatchPage";

const ClaimModule = {
  "core.Router": [
    { path: "claim/claims", component: ClaimsPage },
    { path: "claim/review", component: ReviewPage },
    { path: "claim/batch", component: BatchPage }
  ],
  "core.MainMenu": [ClaimMainMenu]
}

export { ClaimModule };
