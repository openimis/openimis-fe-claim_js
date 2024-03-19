import { SERVICE_TYPE_PP_F, SERVICE_TYPE_PP_P, SERVICE_TYPE_PP_S } from "../constants";

function calculateSubItemTotal(subItems, currentPackageType) {
  return (
    subItems?.reduce((total, subItem) => {
      let qtyAsked = 0;
      if (currentPackageType === SERVICE_TYPE_PP_P) {
        qtyAsked = subItem.qtyAsked ?? 0;
      } else if (currentPackageType === SERVICE_TYPE_PP_F) {
        qtyAsked = subItem.qtyAsked ?? 0;
        if (subItem.qtyProvided < subItem.qtyAsked) {
          qtyAsked = subItem.qtyProvided;
        }
        return total + qtyAsked * subItem.priceAsked;
      }
    }, 0) ?? 0
  );
}

export function claimedAmount(r) {
  let totalPrice = 0;

  if (!Object.keys(r).length) return 0;

  const { qtyProvided, priceAsked, service } = r;

  if ("item" in r) {
    return qtyProvided && priceAsked ? qtyProvided * parseFloat(priceAsked) : 0;
  }

  if (service && Object.keys(service).length) {
    const { packagetype, serviceserviceSet, servicesLinked, claimlinkedService, claimlinkedItem } = service;

    if (packagetype === SERVICE_TYPE_PP_S) {
      totalPrice += parseFloat(service.price);
    } else {
      totalPrice += calculateSubItemTotal(serviceserviceSet, packagetype);
      totalPrice += calculateSubItemTotal(servicesLinked, packagetype);
      totalPrice += calculateSubItemTotal(claimlinkedService, packagetype);
      totalPrice += calculateSubItemTotal(claimlinkedItem, packagetype);
    }

    service.priceAsked = totalPrice;
    service.price = totalPrice;

    return totalPrice;
  }
}

export function approvedAmount(r) {
  if (r.status === 2) return 0;
  let qty = r.qtyApproved !== null && r.qtyApproved !== "" ? r.qtyApproved : r.qtyProvided;
  let price = r.priceApproved !== null && r.priceApproved !== "" ? r.priceApproved : r.priceAsked;
  return qty * parseFloat(price);
}
