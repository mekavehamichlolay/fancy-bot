import WikiBot from "./WikiBot.js";
import Templates from "./Templates.js";
import { Loger } from "./Loger.js";
import { Updater } from "./Updater.js";

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
  pageids: "620368",
  generator: "categorymembers",
  formatversion: "2",
  rvprop: "ids|content",
  rvslots: "main",
  gcmpageid: "620368",
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
    try {
      const newList = await bot.generator(generatorParams, parser);
      pageList.push(...newList.pages);
      recurser(newList.continue);
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
for (let i = 0; i < 25; i++) {
  const worker = new Updater(i + 1, loger, pageList, end, templates);
  workers.push(worker.start());
}
recurser(list.continue);
await Promise.all(workers).finally(() => {
  loger.log();
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
