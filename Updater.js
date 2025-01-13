import { Loger } from "./Loger.js";
import Templates from "./Templates.js";
import { Wikidata } from "./Wikidata.js";

export class Updater {
  title = "";
  baseRevId = 0;
  wikitext = "";
  /** @type {Wikidata | null} */
  wikidataClass = null;
  pagesArray = null;
  terminater = null;

  /**
   * @param {number} id
   * @param {Loger} loger
   * @param {{title:String;revid:Number;wikitext:String}[]} pagesArray
   * @param {{terminate:boolean}} terminater
   * @param {Templates} templates
   */
  constructor(id, loger, pagesArray, terminater, templates, bot) {
    this.id = id;
    this.loger = loger;
    this.pagesArray = pagesArray;
    this.terminater = terminater;
    this.templates = templates;
    this.bot = bot;
  }

  /**
   *
   * @returns {Promise<String>}
   */
  async start() {
    if (this.terminater?.terminate) {
      return Promise.resolve(`worker ${this.id} was terminated`);
    }
    const page = this.pagesArray.pop();
    if (!page) {
      return Promise.resolve(`worker ${this.id} was done`);
    }
    this.title = page.title;
    this.baseRevId = page.revid;
    this.wikitext = page.wikitext;
    if (!this.title || !this.baseRevId || !this.wikitext) {
      return this.start();
    }
    if (!this.wikidataClass) {
      this.wikidataClass = new Wikidata(this.title, (e) => this.loger.error(e));
    }
    return this.worker();
  }

  /**
   * @returns {Promise<String>}
   */
  async worker() {
    await this.wikidataClass.reset(
      this.title,
      this.wikitext.match(/\{\{מיון ויקיפדיה[^}]+\}\}/)?.[0]
    );
    if (this.wikidataClass.isError) {
      return this.start();
    }
    if (!this.templates.check(this.wikitext)) {
      this.loger.warning(`לא נמצא מה לשנות ב[[${this.title}]]`);
      return this.start();
    }
    const newText = this.templates.updateText(
      this.wikitext,
      this.wikidataClass.claims
    );
    if (newText === this.wikitext) {
      this.loger.warning(`לא נערכו שינויים [[${this.title}]]`);
      return this.start();
    }
    const editOptions = {
      title: this.title,
      text: newText,
      baseRevId: this.baseRevId,
      summary: "בוט: עדכון מויקינתונים",
    };
    try {
      await this.bot.edit(editOptions);
    } catch (error) {
      this.loger.error(`שגיאה בעריכת [[${this.title}]]: ${error}`);
      return this.start();
    }
    this.loger.success(`[[${this.title}]] עודכן`);
    return this.start();
  }
}
