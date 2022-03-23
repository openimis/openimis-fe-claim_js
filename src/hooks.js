import { useGraphqlQuery, useModulesManager } from "@openimis/fe-core";

export const useLatestClaimsQuery = ({ adminUuid, first = 10 }, config) => {
  const modulesManager = useModulesManager();
  const { isLoading, error, data, refetch } = useGraphqlQuery(
    `
  query useLatestClaimsQuery ($first: Int = 10, $adminUuid: String!) {
    claims(first: $first, orderBy: "-dateClaimed", admin_Uuid: $adminUuid) {
      edges {
        node {
          id
          code
          uuid
          claimed
          approved
          dateClaimed
          status
          insuree ${modulesManager.getProjection("insuree.InsureePicker.projection")}
          healthFacility ${modulesManager.getProjection("location.HealthFacilityPicker.projection")}
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  } 
`,
    { adminUuid, first },
    config,
  );

  return { isLoading, error, data, refetch };
};
