import { buildParamRegexp, escape } from "./escape.js";
import { Loger } from "./Loger.js";
import { getTemplates } from "./parser.js";
import WikiBot from "./WikiBot.js";

export class ParamBot {
  title = "";
  baseRevId = 0;
  wikitext = "";
  pagesArray = null;
  terminater = null;
  /**
   * @type {Object.<string,string>}
   * @description parameters to change in the template
   */
  params = null;

  /**
   * @param {number} id
   * @param {Loger} loger
   * @param {{title:String;revid:Number;wikitext:String}[]} pagesArray
   * @param {{terminate:boolean}} terminater
   * @param {WikiBot} bot
   * @param {Object.<string,string>} params
   * @param {CallableFunction} timeReseter
   */
  constructor(id, loger, pagesArray, terminater, bot, params, timeReseter) {
    this.id = id;
    this.loger = loger;
    this.pagesArray = pagesArray;
    this.terminater = terminater;
    this.bot = bot;
    this.params = params;
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
    this.templateName = page.template;
    if (
      !this.title ||
      !this.baseRevId ||
      !this.wikitext ||
      !this.templateName
    ) {
      return this.start();
    }
    return this.worker();
  }

  /**
   * @returns {Promise<String>}
   */
  async worker() {
    try {
      const template = getTemplates(this.wikitext, this.templateName)[0];
      if (!template) {
        if (this.templateName === "מנהיג") {
          this.templateName = "נושא משרה";
          return this.worker();
        } else if (this.templateName === "אישיות רבנית") {
          this.templateName = 'חז"ל';
          return this.worker();
        } else if (this.templateName === 'חז"ל') {
          this.templateName = "רב";
          return this.worker();
        } else if (this.templateName === "אמן") {
          this.templateName = "אדריכל";
          return this.worker();
        }
        this.loger.warning(
          `התבנית ${this.templateName} לא נמצאה ב[[${this.title}]]`
        );
        return this.start();
      }
      const changedParams = [];
      const removedParams = [];
      const templateText = template.fullText;
      for (const param in this.params) {
        if (template.parameters[param] !== undefined) {
          const paramRegexp = buildParamRegexp(param);
          if (template.parameters[param] === "") {
            template.fullText = template.fullText.replace(paramRegexp, "");
            removedParams.push(param);
          } else {
            if (template.parameters[this.params[param]]) {
              this.loger.warning(
                `תבנית ${this.templateName} ב[[${this.title}]] מכילה גם את הפרמטר ${this.params[param]}, יש לטפל בו ידנית`
              );
              continue;
            } else if (template.parameters[this.params[param]] === "") {
              template.fullText = template.fullText.replace(
                buildParamRegexp(this.params[param]),
                ""
              );
            }
            template.fullText = template.fullText.replace(
              paramRegexp,
              "$1" + this.params[param] + "$2"
            );
            changedParams.push({ [param]: this.params[param] });
          }
        }
      }
      if (this.templateName === "אישיות") {
        if (template.parameters["תפקיד"] !== undefined) {
          const paramRegexp = buildParamRegexp("תפקיד");
          if (template.parameters["תפקיד"] === "") {
            template.fullText = template.fullText.replace(paramRegexp, "");
            removedParams.push("תפקיד");
          } else {
            if (template.parameters["מקצוע"] || template.parameters["עיסוק"]) {
              this.loger.warning(
                `תבנית ${this.templateName} ב[[${this.title}]] מכילה גם את הפרמטר תפקיד, יש לטפל בו ידנית`
              );
            } else {
              template.fullText = template.fullText.replace(
                paramRegexp,
                "$1עיסוק$2"
              );
              changedParams.push({ תפקיד: "עיסוק" });
            }
          }
        }
        if (template.parameters["תקופת כהונה"] !== undefined) {
          const paramRegexp = buildParamRegexp("תקופת כהונה");
          if (template.parameters["תקופת כהונה"] === "") {
            template.fullText = template.fullText.replace(paramRegexp, "");
            removedParams.push("תקופת כהונה");
          } else {
            this.loger.warning(
              `תבנית ${this.templateName} ב[[${this.title}]] מכילה גם את הפרמטר תקופת כהונה, יש לטפל בו ידנית`
            );
          }
        }
      }
      if (this.templateName === "טייס חלל") {
        const oldParams = ["עיסוק נוכחי", "עיסוק בעבר", "עיסוקים נוספים"];
        let ocupation = "";
        for (const oldParam of oldParams) {
          if (template.parameters[oldParam] !== undefined) {
            const paramRegexp = buildParamRegexp(oldParam);
            if (template.parameters[oldParam] === "") {
              template.fullText = template.fullText.replace(paramRegexp, "");
              removedParams.push(oldParam);
            } else {
              const ocParamregex = new RegExp(
                `(\\|[\\s\\n]*)${oldParam}(\\s*=[\\s\\n]*)${escape(
                  template.parameters[oldParam]
                )}[\\s\\n]*`
              );
              ocupation += `${ocupation ? ", " : ""}${
                template.parameters[oldParam]
              }`;
              template.fullText = template.fullText.replace(ocParamregex, "");
              changedParams.push({ [oldParam]: "מוזג לתוך עיסוק" });
            }
          }
        }
        if (ocupation) {
          template.fullText = template.fullText.replace(
            /(\}\})$/,
            `| עיסוק = ${ocupation}\n$1`
          );
        }
      }
      if (this.templateName === "קדוש נוצרי") {
        if (template.parameters["תארים"] !== undefined) {
          const paramRegexp = buildParamRegexp("תארים");
          if (template.parameters["תארים"] === "") {
            template.fullText = template.fullText.replace(paramRegexp, "");
            removedParams.push("תארים");
          } else {
            template.fullText = template.fullText.replace(
              paramRegexp,
              "$1תואר$2"
            );
            changedParams.push({ תארים: "תואר" });
          }
        }
      }
      if (templateText === template.fullText) {
        this.loger.warning(
          `לא נערכו שינויים בתבנית ${this.templateName} ב[[${this.title}]]`
        );
        return this.start();
      }
      const cleanUp = this.removeEmptyParams(template);
      const newText = this.wikitext.replace(templateText, template.fullText);
      if (newText === this.wikitext) {
        this.loger.warning(
          `לא הצלחתי לערוך שינויים בתבנית ${this.templateName} ב[[${this.title}]]`
        );
        return this.start();
      }
      const changedParamsSummary = changedParams.length
        ? `${changedParams
            .map(
              (param) => `${Object.keys(param)[0]}>>>${Object.values(param)[0]}`
            )
            .join(", ")}`
        : "";
      const removedParamsSummary = removedParams.length
        ? `${removedParams.join(", ")} ${
            removedParams.length > 1 ? "הוסרו" : "הוסר"
          }`
        : "";
      const cleanUpSummary = "ניקוי פרמטרים";
      const summary = changedParamsSummary
        ? `${changedParamsSummary}${
            removedParamsSummary ? `, ${removedParamsSummary}` : ""
          }${cleanUp ? `, ${cleanUpSummary}` : ""}`
        : `${removedParamsSummary}${cleanUp ? `, ${cleanUpSummary}` : ""}`;
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
