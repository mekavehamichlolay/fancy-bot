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
    if (!this.errors) {
      this.errors = [];
    }
    this.errors.push(error);
    if (this.errors.length > 10000) {
      this.log();
    }
  }
  warning(warning) {
    this.warnings.push(warning);
    if (this.warnings.length > 10000) {
      this.log();
    }
  }
  success(success) {
    this.successes.push(success);
    if (this.successes.length > 10000) {
      this.log();
    }
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
    const errors = this.errors.splice(0, this.errors.length);
    if (this.warnings.length) {
      wLog = true;
    }
    const warningOut = `== אזהרות ==\n*${this.warnings.join("\n*")}`;
    const warnings = this.warnings.splice(0, this.warnings.length);
    if (this.successes.length) {
      sLog = true;
    }
    const successOut = `== עריכות שבוצעו בהצלחה ==\n*${this.successes.join(
      "\n*"
    )}`;
    const successes = this.successes.splice(0, this.successes.length);
    this.loged = false;
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
      `./logs/${new Date().toISOString().replace(/\:/g, "-")}.json`,
      JSON.stringify({
        errors,
        warnings,
        successes,
      })
    );
    console.log(logout);
    return logout;
  }
}
