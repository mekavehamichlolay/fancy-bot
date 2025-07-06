import { getTemplates } from "./parser.js";
import { Worker } from "./Worker.js";
export class LastUpdate extends Worker {
  async worker() {
    const template = getTemplates(this.wikitext, { name: "מיון ויקיפדיה" })[0];
    if (!template) {
        this.loger.warning(
            `לא נמצאה תבנית מיון ויקיפדיה בערך [[${this.title}]]`
        );
      return this.start();
    }
    if (template.parameters["תאריך"]) {
        this.loger.warning(
            `תבנית מיון ויקיפדיה בערך [[${this.title}]] כבר מכילה תאריך עדכון אחרון`
        );
      return this.start();
    }
    const oldText = template.fullText;
    template.fullText = template.fullText.replace(
      /\}\}$/,
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
    if(oldArticle === this.wikitext) {
      this.loger.warning(
        `לא נעשו שינויים בערך [[${this.title}]]`
      );
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
  }
}
