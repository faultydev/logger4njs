/** properHex 
 * 
 * @param {string} val original value
 * 
 * @returns {{hex: Array<number>, str: string}}
*/
let properHex = (val) => {
  let retval = {
    hex: [],
    str: ""
  };
  if (Buffer.isBuffer(val)) 
  {
    retval.str = val.toString('hex').toUpperCase().replace(/([0-9A-F]{2})/g, '$1 ');
    retval.str = "[ " + retval.str.substring(0, retval.str.length - 1) + " ]";
    retval.hex = val;
    return retval;
  }
  if (typeof val === 'string')
  {
    let b = Buffer.from(val);
    return properHex(b);
  }
}

/** dictionaryConversion
 * 
 * @param {string} origin 
 * @param {Map} dict 
 * 
 * @returns {string}
 * 
 */
let dictionaryConversion = (origin, dict) => {
  let retval = "";
  dict.forEach((v, k, m) => {
    // if k is found in origin replace it with v
    if (origin.indexOf(k) > -1) {
      retval = origin.replace(k, v);
    }
  });
  return retval;
}

module.exports = {
  properHex,
  dictionaryConversion
}