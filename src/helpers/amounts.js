import { SERVICE_TYPE_PP_F, SERVICE_TYPE_PP_P, SERVICE_TYPE_PP_S } from "../constants";

const safeParseFloat = (val) => {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
};

export function claimedAmount(r) {
  let totalPrice = 0;
  if (r && Object.keys(r).length !== 0) {
    if ('item' in r) {
      const qty = safeParseFloat(r.qtyProvided);
      const price = safeParseFloat(r.priceAsked);
      return qty * price;
    } else if (r?.service) {
      if (Object.keys(r.service).length !== 0) {
        let currentPackageType = r.service.packagetype;
        if (currentPackageType === SERVICE_TYPE_PP_S) {
          const qty = safeParseFloat(r.qtyProvided);
          const price = safeParseFloat(r.priceAsked);
          totalPrice += qty * price;
        } else {
          if (r?.service.manualPrice) {
            totalPrice += safeParseFloat(r.service.price);
          } else {
            var subServices = r.service?.serviceServiceSet || r.service?.serviceserviceSet || r.services;
            var subItems = r.service.serviceItemSet || r.service.servicesLinked || r.items;
            if (!!subServices) {
              subServices.forEach(subService => {
                let qtyAsked = 0;
                if (currentPackageType === SERVICE_TYPE_PP_P) {
                  if (r.services) {
                    if (subService.qtyDisplayed) {
                      qtyAsked = subService.qtyDisplayed;
                    }
                  } else {
                    if (subService.qtyAsked) {
                      qtyAsked = subService.qtyAsked;
                    }
                  }
                  totalPrice += qtyAsked * safeParseFloat(subService.priceAsked);
                } else if (currentPackageType === SERVICE_TYPE_PP_F) {
                  if (r.services) {
                    if (subService.qtyDisplayed) {
                      qtyAsked = subService.qtyDisplayed;
                      if (subService.qtyProvided < subService.qtyDisplayed) {
                        qtyAsked = subService.qtyProvided;
                      }
                    }
                  } else {
                    if (subService.qtyAsked) {
                      qtyAsked = subService.qtyAsked;
                      if (subService.qtyProvided < subService.qtyAsked) {
                        qtyAsked = subService.qtyProvided;
                      }
                    }
                  }
                  totalPrice += qtyAsked * safeParseFloat(subService.priceAsked);
                }
              });
            }
            if (!!subItems) {
              subItems.forEach(subItem => {
                let qtyAsked = 0;
                if (currentPackageType === SERVICE_TYPE_PP_P) {
                  if (r.items) {
                    if (subItem.qtyDisplayed) {
                      qtyAsked = subItem.qtyDisplayed;
                    }
                  } else {
                    if (subItem.qtyAsked) {
                      qtyAsked = subItem.qtyAsked;
                    }
                  }
                  totalPrice += qtyAsked * safeParseFloat(subItem.priceAsked);
                } else if (currentPackageType === SERVICE_TYPE_PP_F) {
                  if (r.items) {
                    if (subItem.qtyDisplayed) {
                      qtyAsked = subItem.qtyDisplayed;
                      if (subItem.qtyProvided < subItem.qtyDisplayed) {
                        qtyAsked = subItem.qtyProvided;
                      }
                    }
                  } else {
                    if (subItem.qtyAsked) {
                      qtyAsked = subItem.qtyAsked;
                      if (subItem.qtyProvided < subItem.qtyAsked) {
                        qtyAsked = subItem.qtyProvided;
                      }
                    }
                  }
                  totalPrice += qtyAsked * safeParseFloat(subItem.priceAsked);
                }
              });
            }
          }
        }
        r.service.priceAsked = totalPrice;
        r.service.price = totalPrice;
        return totalPrice;
      }
    }
  }
  return totalPrice;
}

export function approvedAmount(r) {
  if (r.status === 2) return 0;
  let totalPrice = 0;
  if (!r) return 0;
  if ('item' in r) {
    let qty = r.qtyApproved !== null && r.qtyApproved !== "" ? r.qtyApproved : r.qtyProvided;
    let price = r.priceApproved !== null && r.priceApproved !== "" ? r.priceApproved : r.priceAsked;
    return safeParseFloat(qty) * safeParseFloat(price);
  } else if (r?.service) {
    let currentPackageType = r.service.packagetype;
    if (currentPackageType === SERVICE_TYPE_PP_S) {
      let price = r.priceApproved !== null && r.priceApproved !== "" ? r.priceApproved : r.priceAsked;
      totalPrice += safeParseFloat(price);
    } else {
      if (r?.services) {
        r.services.forEach(subItem => {
          let qtyApproved = 0;
          if (currentPackageType === SERVICE_TYPE_PP_P) {
            if (subItem.qtyAdjusted != null) {
              qtyApproved = subItem.qtyAdjusted;
            } else {
              qtyApproved = subItem.qtyDisplayed;
            }
            totalPrice += qtyApproved * safeParseFloat(subItem.priceAsked);
          } else if (currentPackageType === SERVICE_TYPE_PP_F) {
            if (subItem.qtyAdjusted != null) {
              qtyApproved = subItem.qtyAdjusted;
              if (subItem.qtyProvided < subItem.qtyAdjusted) {
                qtyApproved = subItem.qtyProvided;
              }
            } else {
              qtyApproved = subItem.qtyDisplayed;
            }
            totalPrice += qtyApproved * safeParseFloat(subItem.priceAsked);
          }
        });
      }
      if (r?.items) {
        r.items.forEach(subItem => {
          let qtyApproved = 0;
          if (currentPackageType === SERVICE_TYPE_PP_P) {
            if (subItem.qtyAdjusted != null) {
              qtyApproved = subItem.qtyAdjusted;
            } else {
              qtyApproved = subItem.qtyDisplayed;
            }
            totalPrice += qtyApproved * safeParseFloat(subItem.priceAsked);
          } else if (currentPackageType === SERVICE_TYPE_PP_F) {
            if (subItem.qtyAdjusted != null) {
              qtyApproved = subItem.qtyAdjusted;
              if (subItem.qtyProvided < subItem.qtyAdjusted) {
                qtyApproved = subItem.qtyProvided;
              }
            } else {
              qtyApproved = subItem.qtyDisplayed;
            }
            totalPrice += qtyApproved * safeParseFloat(subItem.priceAsked);
          }
        });
      }
    }
    r.priceApproved = totalPrice;
    return totalPrice;
  }
  return totalPrice;
}
