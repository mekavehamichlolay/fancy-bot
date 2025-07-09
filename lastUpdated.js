import fs from "fs";
import { LastUpdate } from "./LastUpdate.js";
import { PM } from "./PM.js";

const pm = new PM(LastUpdate, {}, null, null, 5, [["timestamp"]]);
await pm.init();
console.log(typeof pm.generator);
const data = fs.readFileSync("./rev_time.txt", "utf8");
const pages = data
  .split("\n")
  .map((line) => {
    const [pageid, pagetitle, timestamp] = line.split("\t");
    return {
      pageid: parseInt(pageid, 10),
      pagetitle: pagetitle?.trim(),
      timestamp: parseInt(timestamp, 10),
    };
  })
  .filter((page) => {
    return (
      page.pageid &&
      page.pagetitle &&
      page.timestamp &&
      !isNaN(page.pageid) &&
      !isNaN(page.timestamp)
    );
  });
console.log(`Found ${pages.length} pages to process`);
if (!pages || !Array.isArray(pages)) {
  console.error("Invalid pages data in rev_time.txt");
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
  if (pm.end.terminate) {
    console.log("Termination requested, exiting...");
    return Promise.resolve();
  }
  if (pages.length === 0) {
    console.log("No more pages to process");
    return Promise.resolve();
  }
  const last50 = {};
  pages.splice(pages.length - 25, 25).forEach((page) => {
    last50[page.pagetitle] = converTimeStampToDate(page.timestamp);
  });
  const last50Params = paramCreator(last50);
  try {
    const list = await pm.generator(last50Params, parser(last50));
    if (!list || !Array.isArray(list)) {
      console.error("Invalid response from generator, expected an array");
      console.log(list);
      return recurser();
    }
    pm.setPageList(list);
    pm.maintainWorkersAmount();
    return recurser();
  } catch (e) {
    console.error("Error in recurser:", e);
    if (e.message.includes("API error")) {
      console.error("API error occurred, retrying...");
      return recurser();
    } else {
      console.error("Unexpected error:", e);
      return new Promise((resolve) => setTimeout(resolve, 1000)).then(recurser);
    }
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
const last50 = {};
pages.splice(pages.length - 25, 25).forEach((page) => {
  last50[page.pagetitle] = converTimeStampToDate(page.timestamp);
});
const list = await pm.generator(paramCreator(last50), parser(last50));
console.log(`found ${list.length} pages to process`);
pm.setPageList(list);
const workers = pm.run();
// await recurser(list.continue);
await recurser();
await pm.waitWorkers().finally(() => {
  console.log("the work was done");
});
