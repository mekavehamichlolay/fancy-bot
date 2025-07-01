import WikiBot from "./WikiBot.js";
import { Loger } from "./Loger.js";
import { ParamBot } from "./ParamBot.js";

const hamichlol = "https://www.hamichlol.org.il/w/api.php";

const bot = new WikiBot(hamichlol);

process.on("exit", handleExit);
process.on("SIGINT", handleExit);
process.on("SIGTERM", handleExit);
process.on("unhandledRejection", handleExit);

let timeout;
const TIMEOUT_LIMIT = 60 * 1000; // 60 seconds

function resetTimeout() {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => {
    console.error("❌ Timeout: No progress in 60 seconds. Exiting.");
    process.exit(1);
  }, TIMEOUT_LIMIT);
}

// Start the timeout immediately
resetTimeout();
const pageList = [];
const end = {
  terminate: false,
};

try {
  await bot.login();
  resetTimeout();
} catch (error) {
  console.error(error);
  process.exit(1);
}
const templates = [
  99196, 799918, 603638, 849488, 99217, 611748, 99203, 879781, 99398, 99464,
  99471, 99476, 99522, 609178, 99556, 99591, 99651, 99693, 99718, 99756,
];
const templateNames = {
  99196: "אישיות",
  799918: "אישיות ביטחונית",
  603638: "אישיות משחק",
  849488: 'אישיות תנ"כית',
  99217: "אמן",
  611748: "אישיות רבנית",
  99203: "אישיות תקשורת",
  879781: "חסיד אומות העולם",
  99398: "טייס חלל",
  99464: "מגלה ארצות",
  99471: "מדען",
  99476: "מוזיקאי",
  99522: "מנהיג",
  609178: "מרגל",
  99556: "משפטן",
  99591: "סופר",
  99651: "פילוסוף",
  99693: "קדוש נוצרי",
  99718: "רופא",
  99756: "שף",
};
const generatorParamsList = templates.map((template) => ({
  action: "query",
  format: "json",
  prop: "revisions",
  rawcontinue: 1,
  pageids: template,
  generator: "categorymembers",
  formatversion: "2",
  rvprop: "ids|content",
  rvslots: "main",
  gcmpageid: template,
  gcmcontinue: "",
  gcmlimit: 100,
}));
let currentPosition = 0;
let generatorParams = generatorParamsList[currentPosition];
const params = {
  מקצוע: "עיסוק",
  "מקום לימודים": "השכלה",
  "כינויים נוספים": "כינוי",
  דת: "השקפה דתית",
  מוסדות: "מעסיק",
  בוגר: "השכלה",
  מסעדות: "מעסיק",
  "לימודי רפואה": "השכלה",
  "מחלקות ובתי חולים": "מעסיק",
  צאצאים: "ילדים",
  "מספר צאצאים": "מספר ילדים",
  "ידועה בשל": "ידוע בשל",
  קישור: "IMDb",
};
function parser(template) {
  return (res) => ({
    continue: res["query-continue"]?.categorymembers?.gcmcontinue,
    pages:
      res.query?.pages?.map((page) => ({
        title: page.title,
        revid: page.revisions[0]?.revid,
        wikitext: page.revisions[0]?.slots?.main?.content,
        template: templateNames[template],
      })) || [],
  });
}
async function recurser(continueParam) {
  // console.log(currentPosition, generatorParams.pageids);
  if (continueParam && continueParam !== generatorParams.gcmcontinue) {
    console.log("continuing with", continueParam);
    generatorParams.gcmcontinue = continueParam;
    try {
      const newList = await bot.generator(
        generatorParams,
        parser(generatorParams.pageids)
      );
      pageList.push(...newList.pages);
      resetTimeout();
      return recurser(newList.continue);
    } catch (error) {
      console.error(error);
      console.log("currently stayed in line", pageList.length);
      return;
    }
  } else {
    currentPosition++;
    console.log("current position", currentPosition);
    if (currentPosition < generatorParamsList.length) {
      generatorParams = generatorParamsList[currentPosition];
      try {
        const newList = await bot.generator(
          generatorParams,
          parser(generatorParams.pageids)
        );
        pageList.push(...newList.pages);
        resetTimeout();
        return recurser(newList.continue);
      } catch (error) {
        console.error(error);
        console.log("currently stayed in line", pageList.length);
      }
    }
  }
}
const loger = new Loger(bot);

const list = await bot.generator(
  generatorParams,
  parser(generatorParams.pageids)
);
pageList.push(...list.pages);
resetTimeout();
await recurser(list.continue);
const workers = [];
const nomberOfWorkers = 5;

for (let i = 0; i < nomberOfWorkers; i++) {
  const worker = new ParamBot(
    i + 1,
    loger,
    pageList,
    end,
    bot,
    params,
    resetTimeout
  );
  workers.push(worker.start());
}
// recurser(list.continue);
await Promise.all(workers).finally(async () => {
  clearTimeout(timeout);
  await loger.log();
});
await bot.logout();

function handleExit() {
  end.terminate = true;
  console.log("waiting for workers to finish");
  Promise.all(workers).finally(() => {
    resetTimeout();
    loger.log().then(() => {
      clearTimeout(timeout);
      bot.logout().then(() => process.exit(0));
    });
  });
}
