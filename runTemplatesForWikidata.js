import WikiBot from "./WikiBot.js";

import { Wikidata } from "./getWikidataData.js";

import Templates from "./templates.js";

const hamichlol = "https://www.hamichlol.org.il/w/api.php";

const bot = new WikiBot(hamichlol);

const templates = new Templates();
process.on("exit", handleExit);
process.on("SIGINT", handleExit);
process.on("SIGTERM", handleExit);
process.on("unhandledRejection", handleExit);
const pageList = [];
const end = {
  terminate: false,
};
class Updater {
  title = "";
  baseRevId = 0;
  wikitext = "";
  /** @type {Wikidata | null} */
  wikidataClass = null;

  /**
   * @param {number} id
   * @param {Loger} loger
   */
  constructor(id, loger) {
    this.id = id;
    this.loger = loger;
  }

  /**
   *
   * @returns {Promise<String>}
   */
  async start() {
    if (end.terminate) {
      return Promise.resolve(`worker ${this.id} was terminated`);
    }
    const page = pageList.pop();
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
    await this.wikidataClass.reset(this.title);
    if (this.wikidataClass.isError) {
      return this.start();
    }
    if (!templates.check(this.wikitext)) {
      this.loger.warning(`לא נמצא מה לשנות ב[[${this.title}]]`);
      return this.start();
    }
    const newText = templates.updateText(
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
    await bot.edit(editOptions);
    this.loger.success(`[[${this.title}]] עודכן`);
    return this.start();
  }
}

class Loger {
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
    console.log(logout);
  }
}

try {
  await bot.login();
} catch (error) {
  console.error(error);
  process.exit(1);
}
const generatorParams = {
  action: "query",
  format: "json",
  prop: "revisions",
  rawcontinue: 1,
  pageids: "99359",
  generator: "categorymembers",
  formatversion: "2",
  rvprop: "ids|content",
  rvslots: "main",
  gcmpageid: "99359",
  gcmcontinue: "",
  gcmlimit: 100,
};
function parser(res) {
  return {
    continue: res["query-continue"]?.categorymembers?.gcmcontinue,
    pages: res.query?.pages?.map((page) => ({
      title: page.title,
      revid: page.revisions[0]?.revid,
      wikitext: page.revisions[0]?.slots?.main?.content,
    })),
  };
}
async function recurser(continueParam) {
  if (continueParam && continueParam !== generatorParams.gcmcontinue) {
    generatorParams.gcmcontinue = continueParam;
    const newList = await bot.generator(generatorParams, parser);
    pageList.push(...newList.pages);
    recurser(newList.continue);
  }
}
const loger = new Loger(bot);

const list = await bot.generator(generatorParams, parser);
pageList.push(...list.pages);
const workers = [];
for (let i = 0; i < 10; i++) {
  const worker = new Updater(i + 1, loger);
  workers.push(worker.start());
}
recurser(list.continue);
await Promise.all(workers);
await loger.log();
await bot.logout();

function handleExit() {
  end.terminate = true;
  console.log("waiting for workers to finish");
  Promise.all(workers).then(() => {
    loger.log().then(() => {
      bot.logout().then(() => process.exit(0));
    });
  });
}
