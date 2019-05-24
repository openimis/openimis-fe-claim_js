import React, { Component } from "react";
import claimSearcherById from "./components/claimSearcherById";
import ClaimMainMenu from "./components/ClaimMainMenu";
import ClaimsPage from "./components/ClaimsPage";
import ReviewPage from "./components/ReviewPage";

class ClaimModule extends Component {
  static contributions = {
    "core.Router": [
      { path: "claim/claims", component: ClaimsPage },
      { path: "claim/review", component: ReviewPage }
    ],
    "core.MainMenu": [ClaimMainMenu],
    "core.MainSearcher": [{ label: "Claim by id", searcher: claimSearcherById }]
  };
}

export default ClaimModule;
