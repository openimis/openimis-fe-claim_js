export function claimedAmount(r) {
  //console.log("Claimed Amount Helper");
  //console.log(r);
  let totalPrice = 0;
  if(Object.keys(r).length!=0){
    if ('item' in r){
      //console.log("Item Calcul");
      //console.log(r.qtyProvided * parseFloat(r.priceAsked));
      return !!r.qtyProvided && !!r.priceAsked ? r.qtyProvided * parseFloat(r.priceAsked) : 0;
    }else{
      if(Object.keys(r.service).length!=0){
        let currentPackageType = r.service.packagetype;
        if(currentPackageType=="S"){
          totalPrice += parseFloat(r.service.price);
        }else{
          // if this product has subItems we had everything
          if(Object.keys(r.subItems).length!=0){
            r.subItems.forEach(subItem => {
              console.log(subItem);
              if(currentPackageType=="F"){
                // A ajouter : Verifier que la quantité entré n'est pas superieur a la quantité max
                // Si c'est le cas mettre la quantité max
                totalPrice += subItem.qtyProvided * subItem.priceAsked;
              }else if (currentPackageType=="P"){
                // A ajouter : Si la quantite saisie est superieur a la quantite2 max
                // reprendre la quantité saisi, sinon reprendre la quantité saisie
                totalPrice += subItem.qtyProvided * subItem.priceAsked;
              }
            });
          }
          // if this product has subServices we had everything
          if(Object.keys(r.subServices).length!=0){
            r.subServices.forEach(subService => { 
              totalPrice += subService.qtyProvided * subService.priceAsked;        
            });
          }
        }
      }
      //console.log("totalPrice");
      //console.log(totalPrice);
      return totalPrice;  
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
