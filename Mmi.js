import { getTemplates } from "./parser.js";
import { Wikidata } from "./Wikidata.js";
import { Worker } from "./Worker.js";

export class Mmi extends Worker {
  /**
   * @type {Wikidata}
   */
  wikidata = null;
  templateName = "ממי";
  async worker() {
    if (!this.wikidata) {
      this.wikidata = new Wikidata(this.title, null, this.loger.error);
    }
    try {
      const templates = [];
      templates.push(
        ...getTemplates(this.wikitext, {
          name: this.templateName,
          //   multi: true,
          nested: true,
        })
      );
      //   templates.push(
      //     ...getTemplates(this.wikitext, {
      //       name: "מיקום מפורט בישראל",
      //       nested: true,
      //       multi: true,
      //     })
      //   );
      if (templates.length === 0) {
        this.loger.warning(`לא מצאתי תבנית ממי ב[[${this.title}]]`);
        return this.start();
      }
      if (templates[0].parameters["אורך"] && templates[0].parameters["רוחב"]) {
        const oldtext = templates[0].fullText;
        templates[0].fullText = `{{מיקום מפורט בישראל|רוחב=${templates[0].parameters["רוחב"]}|אורך=${templates[0].parameters["אורך"]}`;
        for (const param in templates[0].parameters) {
          if (param === "אורך" || param === "רוחב") {
            continue;
          }
          templates[0].fullText += `|${param}=${templates[0].parameters[param]}`;
        }
        templates[0].fullText += "}}";
        if (oldtext === templates[0].fullText) {
          this.loger.warning(`לא נערכו שינויים בתבנית ממי ב[[${this.title}]]`);
          return this.start();
        }
        this.wikitext = this.wikitext.replace(oldtext, templates[0].fullText);
        const editOptions = {
          title: this.title,
          text: this.wikitext,
          baseRevId: this.baseRevId,
          summary: "החלפת תבנית ממי למיקום מפורט בישראל",
        };
        let result = "";
        try {
          result = await this.bot.edit(editOptions);
        } catch (error) {
          this.loger.error(`שגיאה בעריכת [[${this.title}]]: ${error.message}`);
          return this.start();
        }
        if (result === "Success") {
          this.loger.success(`[[${this.title}]] נערך בהצלחה`);
        } else {
          this.loger.error(`עריכת [[${this.title}]] נכשלה: ${result}`);
        }
        return this.start();
      }
      const wikidata = await this.wikidata.reset(this.title, this.wikitext);
      if (wikidata.isError) {
        return this.start();
      }
      const latitude = wikidata.claims.getClaim("P625", "רוחב");
      const longitude = wikidata.claims.getClaim("P625", "אורך");
      if (!latitude || !longitude) {
        this.loger.warning(`לא נמצאו קואורדינטות עבור [[${this.title}]]`);
        return this.start();
      }
      let changed = false;
      let newText = "";
      for (const template of templates) {
        const oldText = template.fullText;
        if (template.parameters["אורך"] && template.parameters["רוחב"]) {
          continue;
        }
        template.fullText = `{{מיקום מפורט בישראל|רוחב=${latitude}|אורך=${longitude}`;
        for (const param in template.parameters) {
          if (param === "רוחב" || param === "אורך") {
            continue;
          }
          template.fullText += `|${param}=${template.parameters[param]}`;
        }
        template.fullText += "}}";
        if (oldText !== template.fullText) {
          newText = this.wikitext.replace(oldText, template.fullText);
          if (newText && this.wikitext !== newText) {
            changed = true;
          }
        }
      }
      if (!changed) {
        // this.loger.warning(`לא נערכו שינויים בתבנית ממי ב[[${this.title}]]`);
        return this.start();
      }
      const editOptions = {
        title: this.title,
        text: newText,
        baseRevId: this.baseRevId,
        summary: "הוספת קואורדינטות לתבנית ממי",
      };
      let result = "";
      try {
        result = await this.bot.edit(editOptions);
      } catch (error) {
        this.loger.error(`שגיאה בעריכת [[${this.title}]]: ${error.message}`);
        return this.start();
      }
      if (result === "Success") {
        this.loger.success(`[[${this.title}]] נערך בהצלחה`);
      } else {
        this.loger.error(`עריכת [[${this.title}]] נכשלה: ${result}`);
      }
      return this.start();
    } catch (error) {
      this.loger.error(`שגיאה בפענוח  [[${this.title}]]: ${error.message}`);
      return this.start();
    }
  }
}
