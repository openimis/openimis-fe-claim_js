export function claimedAmount(r) {
  console.log("Claimed Amount Helper");
  console.log(r);
  let totalPrice = 0;
  if(Object.keys(r).length!=0){
    if ('item' in r){
      return !!r.qtyProvided && !!r.priceAsked ? r.qtyProvided * parseFloat(r.priceAsked) : 0;
    }else{
      if(r.service){
        if(Object.keys(r.service).length!=0){
          let currentPackageType = r.service.packagetype;
          if(currentPackageType=="S"){
            totalPrice += parseFloat(r.service.price);
          }else{
            // if this product has subItems we had everything
            if(r.service.serviceserviceSet){
              r.service.serviceserviceSet.forEach(subItem => {
                let qtyAsked = 0;
                if(currentPackageType=="F"){
                  // A ajouter : Verifier que la quantité entré n'est pas superieur a la quantité max
                  // Si c'est le cas mettre la quantité max
                  if(subItem.qtyAsked){
                    qtyAsked = subItem.qtyAsked;
                  }
                  totalPrice += qtyAsked * subItem.priceAsked;
                }else if (currentPackageType=="P"){
                  // A ajouter : Si la quantite saisie est superieur a la quantite2 max
                  // reprendre la quantité saisi, sinon reprendre la quantité saisie
                  //console.log(subItem);
                  if(subItem.qtyAsked){
                    qtyAsked = subItem.qtyAsked;
                    if(subItem.qtyProvided<subItem.qtyAsked){
                      qtyAsked = subItem.qtyProvided;
                    }
                  }
                  totalPrice += qtyAsked * subItem.priceAsked;
                }
              });
            }
            if(r.service.servicesLinked){
              r.service.servicesLinked.forEach(subItem => {
                let qtyAsked = 0;
                if(currentPackageType=="F"){
                  if(subItem.qtyAsked){
                    qtyAsked = subItem.qtyAsked;
                  }
                  totalPrice += qtyAsked * subItem.priceAsked;
                }else if (currentPackageType=="P"){
                  if(subItem.qtyAsked){
                    qtyAsked = subItem.qtyAsked;
                    if(subItem.qtyProvided<subItem.qtyAsked){
                      qtyAsked = subItem.qtyProvided;
                    }
                  }
                  totalPrice += qtyAsked * subItem.priceAsked;
                }
              });
            }
          }

          //console.log("totalPrice");
          //console.log(totalPrice);
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
  let qty = r.qtyApproved !== null && r.qtyApproved !== "" ? r.qtyApproved : r.qtyProvided;
  let price = r.priceApproved !== null && r.priceApproved !== "" ? r.priceApproved : r.priceAsked;
  return qty * parseFloat(price);
}
