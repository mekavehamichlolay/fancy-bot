import WikiBot from "./WikiBot.js";
import fs from "fs";

export class Loger {
  errors = [];
  warnings = [];
  successes = [];
  loged = false;
  /**
   * @param {WikiBot} bot
   */
  constructor(bot) {
    this.bot = bot;
    this.errors = [];
    this.warnings = [];
    this.successes = [];
  }
  error(error) {
    console.log(error);
    if(!this.errors){
      this.errors = [];
    }
    this.errors.push(error);
  }
  warning(warning) {
    this.warnings.push(warning);
  }
  success(success) {
    this.successes.push(success);
  }
  async log() {
    if (this.loged) {
      return;
    }
    this.loged = true;
    let eLog = false,
      wLog = false,
      sLog = false;
    if (this.errors.length) {
      eLog = true;
    }
    const errorOut = `== שגיאות ==\n*${this.errors.join("\n*")}`;

    if (this.warnings.length) {
      wLog = true;
    }
    const warningOut = `== אזהרות ==\n*${this.warnings.join("\n*")}`;

    if (this.successes.length) {
      sLog = true;
    }
    const successOut = `== עריכות שבוצעו בהצלחה ==\n*${this.successes.join(
      "\n*"
    )}`;

    if (!eLog && !wLog && !sLog) {
      return;
    }
    const logout = await this.bot.edit({
      title: "משתמש:בוט מקוה/לוג" + new Date().toISOString(),
      text: `${eLog ? errorOut : ""}\n\n${wLog ? warningOut : ""}\n\n${
        sLog ? successOut : ""
      }`,
      summary: "בוט: דיווח על פעילות",
      nocreate: 0,
    });
   
    fs.writeFileSync(
      `./logs/${new Date().toISOString().replace(/\:/g, '-')}.json`,
      JSON.stringify({
        errors: this.errors,
        warnings: this.warnings,
        successes: this.successes,
      })
    );
    console.log(logout);
    return logout;
  }
}
