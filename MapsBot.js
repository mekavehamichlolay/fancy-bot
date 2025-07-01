import { Loger } from "./Loger.js";
import { getTemplates } from "./parser.js";
import WikiBot from "./WikiBot.js";
import { Wikidata } from "./Wikidata.js";

export class MapsBot {
  title = "";
  baseRevId = 0;
  wikitext = "";
  pagesArray = null;
  terminater = null;
  /**
   * @type {Wikidata}
   */
  wikidata = null;

  /**
   * @param {number} id
   * @param {Loger} loger
   * @param {{title:String;revid:Number;wikitext:String}[]} pagesArray
   * @param {{terminate:boolean}} terminater
   * @param {WikiBot} bot
   * @param {import("./Country.js").Country} country
   * @param {CallableFunction} timeReseter
   */
  constructor(id, loger, pagesArray, terminater, bot, country, timeReseter) {
    this.id = id;
    this.loger = loger;
    this.pagesArray = pagesArray;
    this.terminater = terminater;
    this.bot = bot;
    this.country = country;
    this.timeReseter = timeReseter;
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
      console.log(this.pagesArray);
      return Promise.resolve(`worker ${this.id} was done`);
    }
    this.timeReseter();
    this.title = page.title;
    this.baseRevId = page.revid;
    this.wikitext = page.wikitext;
    if (!this.title || !this.baseRevId || !this.wikitext) {
      return this.start();
    }
    return this.worker();
  }

  /**
   * @returns {Promise<String>}
   */
  async worker() {
    if (!this.wikidata) {
      this.wikidata = new Wikidata(this.title, this.country, this.loger.error);
    }
    const wikidata = await this.wikidata.reset(this.title, this.wikitext);
    if (wikidata.isError) {
      return this.start();
    }
    try {
      const template =
        getTemplates(this.wikitext, { name: "מממו", nested: true })[0] ||
        getTemplates(this.wikitext, {
          name: "מפת מיקום מוויקינתונים",
          nested: true,
        })[0];
      if (
        !template ||
        (template.name !== "מממו" && template.name !== "מפת מיקום מוויקינתונים")
      ) {
        this.loger.warning(`תבנית מממו לא נמצאה ב[[${this.title}]]`);
        return this.start();
      }

      const templateText = template.fullText;
      const type = template.parameters["סוג"];
      let country =
        template.parameters["מדינה"] ||
        template.anonParameters[0] ||
        wikidata.claims.getClaim("P17");
      if (country === "{{ויקינתונים|P17}}") {
        country = wikidata.claims.getClaim("P17");
      }
      if (!country) {
        this.loger.warning(`לא נמצאה מדינה עבור מממו ב[[${this.title}]]`);
        return this.start();
      }

      const latitude =
        type === "ריק"
          ? `{{מפת מיקום/${country}|עליון}}`
          : wikidata.claims.getClaim("P625", "רוחב");
      const longitude =
        type === "ריק"
          ? `{{מפת מיקום/${country}|ימין}}`
          : wikidata.claims.getClaim("P625", "אורך");
      template.fullText = `{{מפת מיקום|רוחב=${latitude}|אורך=${longitude}|מדינה=${country}`;
      for (const param in template.parameters) {
        if (param === "מדינה") {
          continue;
        }
        template.fullText += `|${param}=${template.parameters[param]}`;
      }
      if (template.anonParameters.length > 1 && template.anonParameters[1]) {
        template.fullText += `|מפה נוספת=${template.anonParameters[1]}`;
      }
      template.fullText += "}}";
      if (templateText === template.fullText) {
        this.loger.warning(`לא נערכו שינויים בתבנית מממו ב[[${this.title}]]`);
        return this.start();
      }
      const newText = this.wikitext.replace(templateText, template.fullText);
      if (newText === this.wikitext) {
        this.loger.warning(
          `לא הצלחתי לערוך שינויים בתבנית מממו ב[[${this.title}]]`
        );
        return this.start();
      }

      const summary = "המרת תבנית מממו למפת מיקום";
      const editOptions = {
        title: this.title,
        text: newText,
        baseRevId: this.baseRevId,
        summary: summary,
      };
      let result = "";
      try {
        result = await this.bot.edit(editOptions);
      } catch (error) {
        this.loger.error(`שגיאה בעריכת [[${this.title}]]: ${error}`);
        return this.start();
      }
      if (result === "Success") {
        this.loger.success(`[[${this.title}]] נערך בהצלחה`);
      } else {
        this.loger.error(`עריכת [[${this.title}]] נכשלה: ${result}`);
      }
      return this.start();
    } catch (error) {
      this.loger.error(`שגיאה בעיבוד [[${this.title}]]: ${error}`);
      return this.start();
    }
  }
}
