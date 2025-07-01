/**
 * Escapes special characters in a string for use in a regular expression.
 * @param {string} str
 * @returns {string}
 * @throws {TypeError} If the input is not a string.
 */
export function escape(str) {
  if (typeof str !== "string") {
    throw new TypeError("Expected a string");
  }
  return str.replace(/([\{\}\[\]\|\)\(])/g, "\\$1");
}

/**
 * Builds a regular expression to match a specific parameter in a template.
 * @param {string} param
 * @returns {RegExp} A regular expression that matches the parameter in a template.
 */
export function buildParamRegexp(param) {
  return new RegExp(`(\\|[\\s\\n]*)${param}(\\s*=[\\s\\n]*)`);
}
