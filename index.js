import { nameToCheck } from "./mich-utils.js";
import { PM } from "./PM.js";
import { Worker } from "./Worker.js";
import fs from "fs";

class NotInCat extends Worker {
  wikiRevParams = {
    action: "query",
    format: "json",
    prop: "revisions|pageprops",
    indexpageids: 1,
    redirects: 1,
    formatversion: "2",
    rvprop: "timestamp|comment|ids",
    rvslots: "main",
    rvlimit: "1",
    ppprop: "wikibase_item",
  };
  reg = /\[\[קטגוריה\:המכלול\: ערכים שעודכנו לאחרונה ב[^\]]+\]\]/;
  async worker() {
    const wikiResult = await this.getFromWiki();
    const { parse, error } = await this.bot.getArticleText(
      this.pageid,
      "pageid"
    );
    if (error || !parse?.wikitext?.["*"]) {
      this.loger.error(`שגיאה בקבלת הטקסט עבור הדף ${this.pageid}: ${error}`);
      return this.start();
    }
    this.wikitext = parse.wikitext["*"];
    if (`${this.wikitext}`.includes("{{מיון ויקיפדיה|")) {
      this.loger.warning(`הדף [[${this.title}]] מכיל כבר תבנית מיון ויקיפדיה`);
      return this.start();
    }
    const categoryesExist = `${this.wikitext}`.includes(
      "[[קטגוריה:המכלול: ערכים שעודכנו לאחרונה ב"
    );

    if (!wikiResult) {
      if (categoryesExist) {
        return this.start();
      }
      return this.edit({
        pageId: this.pageid,
        appendtext: `\n[[קטגוריה:המכלול: ערכים שעודכנו לאחרונה ב${this.timestamp}]]`,
        summary: `הוספת [[:קטגוריה:המכלול: ערכים שעודכנו לאחרונה ב${this.timestamp}]]`,
        baseRevId: this.baseRevId,
      });
    }

    const { revid, prop } = wikiResult;
    const text = `{{מיון ויקיפדיה|דף=${this.title}|גרסה=${revid}${
      prop ? `|פריט=${prop}` : ""
    }|תאריך=${this.timestamp}}}`;
    let editParams = {
      pageId: this.pageid,
    };
    if (categoryesExist) {
      editParams.text = `${this.wikitext}`.replace(this.reg, text);
      editParams.summary = `הוספת תבנית מיון ויקיפדיה והסרת קטגוריה`;
      editParams.baseRevId = parse.revid;
    } else {
      editParams.appendtext = `\n${text}`;
      editParams.summary = `הוספת תבנית מיון ויקיפדיה`;
      editParams.baseRevId = this.baseRevId;
    }
    return this.edit(editParams);
  }
  async getFromWiki(title) {
    const wikiUrl = "https://he.wikipedia.org/w/api.php";
    const params = new URLSearchParams(this.wikiRevParams);
    if (title) {
      params.set("titles", title);
    } else {
      params.set("titles", this.title);
    }
    params.set("rvstart", this.normalizeTs(this.ts.toString()));
    try {
      const response = await fetch(`${wikiUrl}?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error when calling wikipedia for ${title || this.title}! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data?.query?.pages?.[0] || data.query.pageids[0] === "-1") {
        if (title) {
          return null;
        }
        const newName = nameToCheck(this.page.title);
        if (newName.replace(/_/g, " ") === this.page.title.replace(/_/g, " ")) {
          return null;
        } else {
          return this.getFromWiki(newName);
        }
      }
      if (title) {
        this.title = title;
      }
      return {
        revid: data.query.pages[0].revisions[0]?.revid,
        prop: data.query.pages[0].pageprops?.wikibase_item,
      };
    } catch (error) {
      console.log(error)
      return null;
    }
  }
  normalizeTs(ts) {
    return (
      ts.slice(0, 4) +
      "-" +
      ts.slice(4, 6) +
      "-" +
      ts.slice(6, 8) +
      "T" +
      ts.slice(8, 10) +
      ":" +
      ts.slice(10, 12) +
      ":" +
      ts.slice(12, 14) +
      ".000Z"
    );
  }
}

const pm = await new PM(NotInCat, null, null, null, 1, [
  ["pageid", "timestamp", "ts"],
]).init();

const data = fs.readFileSync("not1.txt", "utf-8");
const pages = data
  .split("\n")
  .map((line) => {
    const [pageid, title, revid, timestamp] = line.split("\t");
    return {
      pageid: parseInt(pageid, 10),
      title: title?.trim(),
      revid: parseInt(revid, 10),
      timestamp: converTimeStampToDate(parseInt(timestamp, 10)),
      ts: timestamp,
      wikitext: "a",
    };
  })
  .filter((page) => {
    return (
      page.pageid &&
      page.title &&
      page.revid &&
      page.timestamp &&
      !isNaN(page.pageid) &&
      !isNaN(page.revid)
    );
  });
console.log(`Found ${pages.length} pages to process`);

pm.setPageList(pages.slice(0, 5));
pm.run();
await pm.waitWorkers().finally(() => {
  console.log("the work was done");
});
/**
 *
 * @param {number} timestamp
 * @returns {string}
 */
function converTimeStampToDate(timestamp) {
  if (isNaN(timestamp)) return "";
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
