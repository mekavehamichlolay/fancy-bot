import WikiBot from "./WikiBot.js";
import { Loger } from "./Loger.js";
import { Aklim } from "./Aklim.js";

const hamichlol = "https://www.hamichlol.org.il/w/api.php";

const bot = new WikiBot(hamichlol);

process.on("exit", handleExit);
process.on("SIGINT", handleExit);
process.on("SIGTERM", handleExit);
process.on("unhandledRejection", handleExit);

// Start the timeout immediately
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
const category = 603616;

const generatorParams = {
  action: "query",
  format: "json",
  prop: "revisions",
  rawcontinue: 1,
  pageids: category,
  generator: "categorymembers",
  formatversion: "2",
  rvprop: "ids|content",
  rvslots: "main",
  gcmpageid: category,
  gcmcontinue: "",
  gcmlimit: 100,
};

function parser(res) {
  return {
    continue: res["query-continue"]?.categorymembers?.gcmcontinue,
    pages:
      res.query?.pages?.map((page) => ({
        title: page.title,
        revid: page.revisions[0]?.revid,
        wikitext: page.revisions[0]?.slots?.main?.content,
      })) || [],
  };
}
async function recurser(continueParam) {
  if (continueParam && continueParam !== generatorParams.gcmcontinue) {
    console.log("continuing with", continueParam);
    generatorParams.gcmcontinue = continueParam;
    try {
      const newList = await bot.generator(generatorParams, parser);
      pageList.push(...newList.pages);
      return recurser(newList.continue);
    } catch (error) {
      console.error(error);
      console.log("currently stayed in line", pageList.length);
      return;
    }
  }
}
const loger = new Loger(bot);

const list = await bot.generator(generatorParams, parser);
pageList.push(...list.pages);
const workers = [];
const nomberOfWorkers = 5;
for (let i = 0; i < nomberOfWorkers; i++) {
  const worker = new Aklim(i + 1, loger, pageList, end, bot);
  workers.push(worker.start());
}
// await recurser(list.continue);
recurser(list.continue);
await Promise.all(workers).finally(async () => {
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
