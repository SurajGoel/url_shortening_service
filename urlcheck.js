module.exports = function(prot, website) {
  var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
  var str = prot + "://" + website;
  //if(prot !== 'http' || prot !== 'https') return false;
  if(!regex .test(str)) {
    return false;
  } else {
    return true;
  }
};