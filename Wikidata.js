import { Claims } from "./Claims.js";
import { Country } from "./Country.js";
import { nameToCheck } from "./mich-utils.js";

export class Wikidata {
  wikidataURL = "https://www.wikidata.org/w/api.php?";
  title = "";
  entity = "";
  /**
   * @type {Claims}
   */
  claims = null;
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
   * @param {Country} [countryClass]
   * @param {(string)=>void} [errorHandler]
   */
  constructor(title, countryClass, errorHandler) {
    if (!title) {
      throw new Error("Title is required");
    }
    this.title = `${title}`;
    this.claims = new Claims({}, countryClass);
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
      const entity = Object.keys(json.entities)[0];
      if (entity !== "-1") {
        return Object.keys(json.entities)[0];
      }
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
      await this.claims.reset(json.claims);
    } catch (error) {
      this.isError = true;
      this.errorHandler(error.message);
    }
  }

  /**
   *
   * @param {String} text
   * @returns {String}
   */
  getEntityFromText(text) {
    return text.match(/\|פריט=(Q[^}|]+)/)?.[1] || "";
  }

  getTitleFromText(text) {
    return text.match(/\{\{מיון ויקיפדיה\|דף=([^|}]+)/)?.[1] || "";
  }
  /**
   *
   * @param {String} title
   * @param {String} [textToParse]
   * @returns {Promise<this>}
   */
  async reset(title, textToParse) {
    if (!title || typeof title !== "string") {
      throw new Error("Title is required", title);
    }
    this.isError = false;
    this.title = `${title}`;
    this.entity = "";
    if (textToParse) {
      this.entity = this.getEntityFromText(textToParse);
      if (this.entity) {
        await this.setClaims();
        return this;
      }
      if (
        this.getTitleFromText(textToParse) &&
        this.title !== this.getTitleFromText(textToParse)
      ) {
        this.title = this.getTitleFromText(textToParse);
      }
    }
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
