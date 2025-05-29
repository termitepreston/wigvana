/**
 * Create an object composed of the picked object properties from the source object.
 * @param {Record<string, any>} object - The source object.
 * @param {string[]} keys - An array of keys to pick.
 * @returns {Record<string, any>} A new object with the picked properties.
 * @example
 * pick({ a: 1, b: '2', c: 3 }, ['a', 'c']) // => { a: 1, c: 3 }
 */
const pick = (object, keys) => {
  return keys.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      // eslint-disable-next-line no-param-reassign
      obj[key] = object[key];
    }
    return obj;
  }, {});
};

export default pick;
