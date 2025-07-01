import { Loger } from "./Loger.js";
import { getTemplates } from "./parser.js";
import WikiBot from "./WikiBot.js";

export class Aklim {
  title = "";
  baseRevId = 0;
  wikitext = "";
  pagesArray = null;
  terminater = null;
  /**
   *
   * @param {number} id
   * @param {Loger} loger
   * @param {{title:String;revid:Number;wikitext:String}[]} pagesArray
   * @param {{terminate:boolean}} terminater
   * @param {WikiBot} bot
   */
  constructor(id, loger, pagesArray, terminater, bot) {
    this.id = id;
    this.loger = loger;
    this.pagesArray = pagesArray;
    this.terminater = terminater;
    this.bot = bot;
  }
  async start() {
    if (this.terminater?.terminate) {
      return Promise.resolve(`worker ${this.id} was terminated`);
    }
    const page = this.pagesArray.pop();
    if (!page) {
      console.log(this.pagesArray);
      return Promise.resolve(`worker ${this.id} was done`);
    }
    this.title = page.title;
    this.baseRevId = page.revid;
    this.wikitext = page.wikitext;
    if (!this.title || !this.baseRevId || !this.wikitext) {
      return this.start();
    }
    return this.worker();
  }
  async worker() {
    const templateName = "אקלים";
    try {
      const templates = [];
      templates.push(
        ...getTemplates(this.wikitext, {
          name: templateName,
          multi: true,
          nested: true,
        })
      );
      templates.push(
        ...getTemplates(this.wikitext, {
          name: "מזג אוויר",
          nested: true,
          multi: true,
        })
      );
      if (!templates.length) {
        this.loger.warning(
          `לא מצאתי תבנית אקלים בערך: ${this.title} (${this.baseRevId})`
        );
        return this.start();
      }
      let numberOfParametersChanged = 0;
      let changed = false;
      let emptyParamsRemoved = false;
      for (const template of templates) {
        const newParameters = {};
        for (const param in template.parameters) {
          if (param.endsWith("משק")) {
            newParameters[param.replace(/משק$/, "משקע")] =
              template.parameters[param];
            numberOfParametersChanged++;
            continue;
          }
          if (param.endsWith("מקס")) {
            newParameters[param.replace(/מקס$/, "מקס_טמפ")] =
              template.parameters[param];
            numberOfParametersChanged++;
            continue;
          }
          if (param.endsWith("שיא")) {
            newParameters[param.replace(/שיא$/, "שיא_טמפ")] =
              template.parameters[param];
            numberOfParametersChanged++;
            continue;
          }
          if (param.endsWith("מינ")) {
            newParameters[param.replace(/מינ$/, "מינ_טמפ")] =
              template.parameters[param];
            numberOfParametersChanged++;
            continue;
          }
          if (
            param.includes(" ") &&
            param !== "ללא מרכוז" &&
            param !== "סיווג אקלים"
          ) {
            newParameters[param.replace(/ /g, "_")] =
              template.parameters[param];
            numberOfParametersChanged++;
            continue;
          }
          newParameters[param] = template.parameters[param];
        }
        const oldtext = template.fullText;
        template.fullText = `{{${templateName}\n|${Object.entries(newParameters)
          .map(([key, value]) => `${key}=${value}`)
          .join("\n|")}\n}}`;
        if (oldtext !== template.fullText) {
          if (this.removeEmptyParams(template)) {
            emptyParamsRemoved = true;
          }
          const textReplaced = this.wikitext.replace(
            `${oldtext}`,
            template.fullText
          );
          if (textReplaced !== this.wikitext) {
            this.wikitext = textReplaced;
            changed = true;
          }
        }
      }
      if (!changed) {
        this.loger.warning(
          `לא שיניתי כלום בערך: [[${this.title}]] (${this.baseRevId})`
        );
        return this.start();
      }
      const editOptions = {
        title: this.title,
        text: this.wikitext,
        baseRevId: this.baseRevId,
        summary: `עדכון ${numberOfParametersChanged} פרמטרים ${
          emptyParamsRemoved ? " והסרת פרמטרים ריקים " : ""
        }בתבנית אקלים`,
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
      this.loger.error(
        `שגיאה בעיבוד [[${this.title}]]: ${error.message || error}`
      );
      return this.start();
    }
  }
  /**
   *
   * @param {import("./parser.js").Template} template
   */
  removeEmptyParams(template) {
    const templateFullText = template.fullText;
    for (const param in template.parameters) {
      if (template.parameters[param] === "") {
        const paramRegexp = new RegExp(
          `(\\|[\\s\\n]*)${param}(\\s*=[\\s\\n]*)`
        );
        template.fullText = template.fullText.replace(paramRegexp, "");
      }
    }
    return templateFullText !== template.fullText;
  }
}
