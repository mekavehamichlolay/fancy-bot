export class RedirectUpdater {
  title = "";
  baseRevId = 0;
  wikitext = "";
  pagesArray = null;
  terminater = null;

  /**
   * @param {number} id
   * @param {Loger} loger
   * @param {{title:String;revid:Number;wikitext:String}[]} pagesArray
   * @param {{terminate:boolean}} terminater
   * @param {Templates} templates
   */
  constructor(id, loger, pagesArray, terminater, bot) {
    this.id = id;
    this.loger = loger;
    this.pagesArray = pagesArray;
    this.terminater = terminater;
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
    return this.worker();
  }

  /**
   * @returns {Promise<String>}
   */
  async worker() {
    const newText = this.wikitext
      .replace("{{וח}}", "")
      .replace(/\{\{מיון ויקיפדיה[^}]+\}\}/, "");
    if (newText === this.wikitext) {
      this.loger.warning(`לא נערכו שינויים [[${this.title}]]`);
      return this.start();
    }
    const editOptions = {
      title: this.title,
      text: newText,
      baseRevId: this.baseRevId,
      summary: "בוט: הסרת תבנית מיון ויקיפדיה מהפניות",
    };
    try {
      await this.bot.edit(editOptions);
    } catch (error) {
      this.loger.error(`שגיאה בעריכת [[${this.title}]]: ${error}`);
      return this.start();
    }
    this.loger.success(`[[${this.title}]] נערך בהצלחה`);
    return this.start();
  }
}
