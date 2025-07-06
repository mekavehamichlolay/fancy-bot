import fs from "fs";
import WikiBot from "./WikiBot.js";
import { Loger } from "./Loger.js";
import { LastUpdate } from "./LastUpdate.js";
import { title } from "process";
const hamichlol = "https://www.hamichlol.org.il/w/api.php";

const bot = new WikiBot(hamichlol);

process.on("exit", handleExit);
process.on("SIGINT", handleExit);
process.on("SIGTERM", handleExit);
process.on("unhandledRejection", handleExit);

const pageList = [];
const end = {
  terminate: false,
};

try {
  await bot.login();
} catch (error) {
  console.error(error);
  process.exit(1);
}
const pages = JSON.parse(fs.readFileSync("./rev_time.json", "utf8"));
if (!pages || !Array.isArray(pages)) {
  console.error("Invalid pages data in rev_time.json");
  process.exit(1);
}
/**
 *
 * @param {Object<string,string>} pages
 * @returns {Object<string,string>}
 */
function paramCreator(pages) {
  return {
    action: "query",
    format: "json",
    prop: "revisions",
    titles: Object.keys(pages).join("|"),
    formatversion: "2",
    rvprop: "ids|content",
    rvslots: "main",
  };
}

/**
 *
 * @param {Object<string,string>} pages
 * @returns {(res: {query:{pages:Array<{title:String;revid:Number;revisions:Array<{revid:Number;slots:{main:{content:String}}}>}>}})=>Array<{title:String;revid:Number;wikitext:String,timestamp:String}>}
 */
function parser(pages) {
  return (res) => {
    return (
      res.query?.pages?.map((page) => ({
        title: page.title,
        revid: page.revisions[0]?.revid,
        wikitext: page.revisions[0]?.slots?.main?.content,
        timestamp: pages[page.title.replace(/ /g, "_")],
      })) || []
    );
  };
}
async function recurser() {
  if (pages.length > 0 && !end.terminate) {
    const last50 = {};
    pages.splice(pages.length - 50, 50).forEach((page) => {
      last50[page.pagetitle] = converTimeStampToDate(page.timestamp);
    });
    const last50Params = paramCreator(last50);
    const list = await bot.generator(last50Params, parser(last50));
    pageList.push(...list);
    if (pages.length > 0) {
      return recurser();
    }
    console.log("finished proccesing all pages");
  }
}
/**
 *
 * @param {number} timestamp
 * @returns {string}
 */
function converTimeStampToDate(timestamp) {
  // 20250703211432 that is the furmat as YYYYMMDDHHMMSS
  const year = parseInt(timestamp.toString().slice(0, 4), 10);
  const month = parseInt(timestamp.toString().slice(4, 6), 10) - 1; // Months are 0-indexed in JavaScript
  const monthNames = [
    "ינואר",
    "פברואר",
    "מרץ",
    "אפריל",
    "מאי",
    "יוני",
    "יולי",
    "אוגוסט",
    "ספטמבר",
    "אוקטובר",
    "נובמבר",
    "דצמבר",
  ];
  return `${monthNames[month]} ${year}`;
}
const loger = new Loger(bot);
const last50 = {};
pages.splice(pages.length - 5, 5).forEach((page) => {
  last50[page.pagetitle] = converTimeStampToDate(page.timestamp);
});
// console.log(paramCreator(last50));
const list = await bot.generator(paramCreator(last50), parser(last50));
console.log(`found ${list.length} pages to process`);
pageList.push(...list);
const workers = [];
const nomberOfWorkers = 5;
for (let i = 0; i < nomberOfWorkers; i++) {
  const worker = new LastUpdate(i + 1, loger, pageList, end, bot, [
    "timestamp",
  ]);
  workers.push(worker.start());
}
// await recurser(list.continue);
// recurser();
await Promise.all(workers).finally(async () => {
  console.log(pageList.length);
  await loger.log();
});
await bot.logout();

function handleExit() {
  end.terminate = true;
  console.log("waiting for workers to finish");
  Promise.all(workers).finally(() => {
    loger.log().then(() => {
      bot.logout().then(() => process.exit(0));
    });
  });
}
