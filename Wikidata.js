import { Claims } from "./Claims.js";
import { nameToCheck } from "./mich-utils.js";

export class Wikidata {
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
