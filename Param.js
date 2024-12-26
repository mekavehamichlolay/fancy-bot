export class Param {
  claim = "";
  parameter = "";
  text = "";

  /**
   *
   * @param {String} claim
   * @param {String} parameter
   * @param {String} text
   */
  constructor(claim, parameter, text) {
    this.claim = claim;
    this.parameter = parameter;
    this.text = text;
  }
  getText(data) {
    if (!data) {
      return "";
    }
    if (this.parameter && this.text) {
      return `|${this.parameter}=${this.text}${data}`;
    }
    if (this.parameter) {
      return `|${this.parameter}=${data}`;
    }
    if (this.text) {
      return `|${this.text}${data}`;
    }
    return `|${data}`;
  }
}
