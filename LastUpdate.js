import { getTemplates } from "./parser.js";
import { Worker } from "./Worker.js";
const hebrewMonths = {
  ינואר: 1,
  פברואר: 2,
  מרץ: 3,
  אפריל: 4,
  מאי: 5,
  יוני: 6,
  יולי: 7,
  אוגוסט: 8,
  ספטמבר: 9,
  אוקטובר: 10,
  נובמבר: 11,
  דצמבר: 12,
};
export class LastUpdate extends Worker {
  async worker() {
    try {
      const template = getTemplates(this.wikitext, {
        name: "מיון ויקיפדיה",
        nested: true,
      })[0];
      if (!template) {
        this.loger.warning(
          `לא נמצאה תבנית מיון ויקיפדיה בערך [[${this.title}]]`
        );
        return this.start();
      }
      if (template.parameters["תאריך"]) {
        return this.start();
      }
      const oldText = template.fullText;
      template.fullText = template.fullText.replace(
        "}}",
        `|תאריך=${this.timestamp}}}`
      );
      if (oldText === template.fullText) {
        this.loger.warning(
          `לא נעשו שינויים בתבנית מיון ויקיפדיה בערך [[${this.title}]]`
        );
        return this.start();
      }
      const oldArticle = this.wikitext;
      this.wikitext = this.wikitext.replace(oldText, template.fullText);
      if (oldArticle === this.wikitext) {
        this.loger.warning(`לא נעשו שינויים בערך [[${this.title}]]`);
        return this.start();
      }
      const editSummary = `הוספת תאריך עדכון אחרון למיון ויקיפדיה`;
      const editOptions = {
        title: this.title,
        text: this.wikitext,
        baseRevId: this.baseRevId,
        summary: editSummary,
      };
      return this.edit(editOptions);
    } catch (e) {
      this.loger.error(`שגיאה ב[[${this.title}]]: ${e.message}`);
      return this.start();
    }
  }

  parseHebrewDate(str) {
    const parts = str.trim().split(" ");
    const month = hebrewMonths[parts[0]];
    const year = parseInt(parts[1], 10);
    return { year, month };
  }
  isGreater(a, b) {
    const dateA = this.parseHebrewDate(a);
    const dateB = this.parseHebrewDate(b);

    if (dateA.year !== dateB.year) {
      return dateA.year > dateB.year; // >0 means B is earlier
    }
    return dateA.month > dateB.month; // >0 means B is earlier
  }
}
