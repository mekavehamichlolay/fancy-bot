import WikiBot from "./WikiBot.js";
import { Loger } from "./Loger.js";
import { Mmi } from "./Mmi.js";

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
const template = 17498;

const generatorParams = {
  action: "query",
  format: "json",
  prop: "revisions",
  rawcontinue: 1,
  pageids: template,
  generator: "transcludedin",
  formatversion: "2",
  rvprop: "ids|content",
  rvslots: "main",
  gtiprop: "pageid",
  gticontinue: "0",
  gtilimit: 100,
  gtinamespace: "0",
};

function parser(res) {
  return {
    continue: res["query-continue"]?.transcludedin?.gticontinue,
    pages:
      res.query?.pages?.map((page) => ({
        title: page.title,
        revid: page.revisions[0]?.revid,
        wikitext: page.revisions[0]?.slots?.main?.content,
      })) || [],
  };
}
async function recurser(continueParam) {
  // console.log(currentPosition, generatorParams.pageids);
  if (continueParam && continueParam !== generatorParams.gticontinue) {
    console.log("continuing with", continueParam);
    generatorParams.gticontinue = continueParam;
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
  const worker = new Mmi(i + 1, loger, pageList, end, bot);
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
