import { Claims } from "./Claims.js";
import { Param } from "./Param.js";

export class Template {
  name = "";
  regex = null;
  /** @type {Param[]} */
  params = [];

  /**
   * @param {String} name
   * @param {RegExp} regex
   * @param {[{claim:String;parameter:String;text:String}]} params
   */
  constructor(name, regex, params) {
    this.name = name;
    this.regex = regex;
    for (let i = 0; i < params.length; i++) {
      this.params[i] = new Param(
        params[i].claim,
        params[i].param,
        params[i].text
      );
    }
  }

  /**
   * @param {String} text
   * @param {Claims} claims
   * @returns {String}
   */
  changeText(text, claims) {
    if (!this.regex.test(text)) {
      return text;
    }
    let changes = "";
    for (let i = 0; i < this.params.length; i++) {
      const param = this.params[i];
      const data = claims.getClaim(param.claim);
      if (!data) {
        continue;
      }
      changes += param.getText(data);
    }
    if (!changes) {
      return text;
    }
    changes = `{{${this.name}${changes}}}`;
    return text.replace(this.regex, changes);
  }
}
