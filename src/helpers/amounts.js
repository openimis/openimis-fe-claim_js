import { SERVICE_TYPE_PP_F, SERVICE_TYPE_PP_P, SERVICE_TYPE_PP_S } from "../constants";

export function claimedAmount(r) {
  let totalPrice = 0;
  if (Object?.keys(r)?.length != 0) {
    if ('item' in r) {
      return !!r.qtyProvided && !!r.priceAsked ? r.qtyProvided * parseFloat(r.priceAsked) : 0;
    } else {
      if (r?.service) {
        if (Object?.keys(r.service)?.length != 0) {
          let currentPackageType = r.service.packagetype;
          if (currentPackageType == SERVICE_TYPE_PP_S) {
            totalPrice += (r?.qtyProvided * parseFloat(r.priceAsked));
          } else {
            if (r?.service.manualPrice) {
              totalPrice += parseFloat(r.service.price);
            } else {
              var subServices = r.service?.serviceServiceSet || r.service?.serviceserviceSet || r.services;
              var subItems = r.service.serviceItemSet || r.service.servicesLinked || r.items;
              if (!!subServices) {
                subServices.forEach(subService => {
                  let qtyAsked = 0;
                  if (currentPackageType == SERVICE_TYPE_PP_P) {
                    if (r.services) {
                      if (subService.qtyDisplayed) {
                        qtyAsked = subService.qtyDisplayed;
                      }
                    } else {
                      if (subService.qtyAsked) {
                        qtyAsked = subService.qtyAsked;
                      }
                    }
                    totalPrice += qtyAsked * subService.priceAsked;
                  } else if (currentPackageType == SERVICE_TYPE_PP_F) {
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
                    totalPrice += qtyAsked * subService.priceAsked;
                  }
                });
              }
              if (!!subItems) {
                subItems.forEach(subItem => {
                  let qtyAsked = 0;
                  if (currentPackageType == SERVICE_TYPE_PP_P) {
                    if (r.items) {
                      if (subItem.qtyDisplayed) {
                        qtyAsked = subItem.qtyDisplayed;
                      }
                    } else {
                      if (subItem.qtyAsked) {
                        qtyAsked = subItem.qtyAsked;
                      }
                    }
                    totalPrice += qtyAsked * subItem.priceAsked;
                  } else if (currentPackageType == SERVICE_TYPE_PP_F) {
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
                    totalPrice += qtyAsked * subItem.priceAsked;
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
  }
  return totalPrice;
  //
}
export function approvedAmount(r) {
  if (r.status === 2) return 0;
  let totalPrice = 0;
  if ('item' in r) {
    let qty = r.qtyApproved !== null && r.qtyApproved !== "" ? r.qtyApproved : r.qtyProvided;
    let price = r.priceApproved !== null && r.priceApproved !== "" ? r.priceApproved : r.priceAsked;
    return qty * parseFloat(price);
  } else {
    if (r?.service) {
      let currentPackageType = r.service.packagetype;
      if (currentPackageType == SERVICE_TYPE_PP_S) {
        let price = r.priceApproved !== null && r.priceApproved !== "" ? r.priceApproved : r.priceAsked;
        totalPrice += parseFloat(price);
      } else {
        if (r?.services) {
          r.services.forEach(subItem => {
            let qtyApproved = 0;
            if (currentPackageType == SERVICE_TYPE_PP_P) {
              if (subItem.qtyAdjusted != null) {
                qtyApproved = subItem.qtyAdjusted;
              } else {
                qtyApproved = subItem.qtyDisplayed;
              }
              totalPrice += qtyApproved * subItem.priceAsked;
            } else if (currentPackageType == SERVICE_TYPE_PP_F) {
              if (subItem.qtyAdjusted != null) {
                qtyApproved = subItem.qtyAdjusted;
                if (subItem.qtyProvided < subItem.qtyAdjusted) {
                  qtyApproved = subItem.qtyProvided;
                }
              } else {
                qtyApproved = subItem.qtyDisplayed;
              }
              totalPrice += qtyApproved * subItem.priceAsked;
            }
          });
        }
        if (r?.items) {
          r.items.forEach(subItem => {
            let qtyApproved = 0;
            if (currentPackageType == SERVICE_TYPE_PP_P) {
              if (subItem.qtyAdjusted != null) {
                qtyApproved = subItem.qtyAdjusted;
              } else {
                qtyApproved = subItem.qtyDisplayed;
              }
              totalPrice += qtyApproved * subItem.priceAsked;
            } else if (currentPackageType == SERVICE_TYPE_PP_F) {
              if (subItem.qtyAdjusted != null) {
                qtyApproved = subItem.qtyAdjusted;
                if (subItem.qtyProvided < subItem.qtyAdjusted) {
                  qtyApproved = subItem.qtyProvided;
                }
              } else {
                qtyApproved = subItem.qtyDisplayed;
              }
              totalPrice += qtyApproved * subItem.priceAsked;
            }
          });
        }
      }
      r.priceApproved = totalPrice;
      return totalPrice;
    }
  }
  return totalPrice;
}
