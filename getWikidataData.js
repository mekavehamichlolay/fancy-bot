import { nameToCheck } from "./mich-utils.js";

class Wikidata {
  wikidataURL = "https://www.wikidata.org/w/api.php?";
  title = "";
  entity = "";
  claims = new Claims({});
  errorHandler = (e) => undefined;
  isError = false;
  wikidataGetEntityParam = {
    action: "wbgetentities",
    format: "json",
    sites: "hewiki",
    props: "",
    languages: "he",
    utf8: 1,
    formatversion: "2",
    origin: "*",
  };
  wikidataGetClaimParam = {
    action: "wbgetclaims",
    format: "json",
    utf8: 1,
    formatversion: "2",
    origin: "*",
  };

  /**
   *
   * @param {String} title
   * @param {(string)=>void} [errorHandler]
   */
  constructor(title, errorHandler) {
    if (!title) {
      throw new Error("Title is required");
    }
    this.title = `${title}`;
    if (errorHandler) {
      this.errorHandler = errorHandler;
    }
  }

  /**
   *
   * @param {String} title
   * @returns {Promise<String>}
   */
  async getEntity(title) {
    if (!title) {
      throw new Error("Title is required");
    }
    this.wikidataGetEntityParam.titles = title;
    const response = await fetch(
      `${this.wikidataURL}${new URLSearchParams(this.wikidataGetEntityParam)}`
    );
    const json = await response.json();
    if (json.entities) {
      return Object.keys(json.entities)[0];
    }
    if (nameToCheck(title) === title) {
      throw new Error("Entity not found");
    }
    return await this.getEntity(nameToCheck(title));
  }
  async setClaims() {
    this.wikidataGetClaimParam.entity = this.entity;
    try {
      const response = await fetch(
        `${this.wikidataURL}${new URLSearchParams(this.wikidataGetClaimParam)}`
      );
      const json = await response.json();
      if (!json.claims) {
        this.isError = true;
        this.errorHandler("Claims not found");
        return;
      }
      this.claims.reset(json.claims);
    } catch (error) {
      this.isError = true;
      this.errorHandler(error.message);
    }
  }

  /**
   *
   * @param {String} title
   * @returns {Promise<this>}
   */
  async reset(title) {
    if (!title) {
      throw new Error("Title is required");
    }
    this.isError = false;
    this.title = `${title}`;
    this.entity = "";
    try {
      this.entity = await this.getEntity(this.title);
    } catch (error) {
      this.isError = true;
      this.errorHandler(
        `שגיאה בעת חיפוש ערך ויקינתונים עבור [[${this.title}]]`
      );
      return this;
    }
    if (!this.entity) {
      this.isError = true;
      this.errorHandler(`לא נמצא ערך ויקינתונים עבור [[${this.title}]]`);
      return this;
    }
    await this.setClaims();
    return this;
  }
}

class Claims {
  claims = {};

  /**
   * @param {{}} claims
   */
  constructor(claims) {
    this.reset(claims);
  }

  /**
   *
   * @param {{}} claims
   */
  reset(claims) {
    for (const key in this.claims) {
      if (key in claims) {
        continue;
      }
      this.claims[key] = "";
    }
    for (const key in claims) {
      if (key === "P1559") {
        this.claims[key] = {
          text: claims[key][0].mainsnak.datavalue.value.text,
          language: claims[key][0].mainsnak.datavalue.value.language,
        };
        continue;
      }
      this.claims[key] = claims[key][0].mainsnak.datavalue?.value || "";
    }
  }

  /**
   *
   * @param {String} property
   * @param {String} param
   * @returns {String}
   */
  getClaim(property, param) {
    if (!this.claims[property]) {
      return "";
    }
    if (property === "P1559") {
      return param === "שפה"
        ? this.claims[property].language
        : this.claims[property].text.replace(/\=/g, "{{=}}");
    }
    return this.claims[property].replace(/\=/g, "{{=}}");
  }
}

class Template {
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
class Param {
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

export { Wikidata, Template, Claims };
