import { Loger } from "./Loger.js";
import WikiBot from "./WikiBot.js";
import { Worker } from "./Worker.js";

export class PM {
  hamichlol = "https://www.hamichlol.org.il/w/api.php";
  /**
   * @description the class that we will instanciate and work
   * @type {typeof Worker}
   */
  workerClass = null;
  numberOfWorkers = 10;
  /**
   * @type {Array<Promise<any>>}
   * @description Array of worker promises that handle page processing.
   */
  workers = [];
  workersStatus = [];
  /**
   * @type {Array<{title:String;revid:Number;wikitext:String}>}
   */
  pageList = [];
  /**
   * @type {Loger}
   * @description Logger instance for logging operations.
   */
  loger = null;
  /**
   * @type {WikiBot}
   * @description Instance of WikiBot for interacting with the wiki.
   */
  bot = null;
  /**
   * @type {{terminate:Boolean}}
   * @description Object to signal termination of the process.
   */
  end = { terminate: false };
  /**
   * @type {Array<any>}
   * @description Extra properties for workers, can be used to pass additional data to worker class.
   */
  extraProertiesForWorkers = [];

  params = null;
  callback = null;
  generationHandler = null;
  /**
   *
   * @param {Worker} workerClass
   * @param {Object<string,string|number} params
   * @param {(any)=>Array<{title:String;revid:Number;wikitext:String}>} callback
   * @param {()=>void} generationHandler
   * @param {number} [numberOfWorkers]
   * @param {Array<any>} [extraProertiesForWorkers]
   */
  constructor(
    workerClass,
    params,
    callback,
    generationHandler,
    numberOfWorkers,
    extraProertiesForWorkers
  ) {
    if (!workerClass || !(workerClass.prototype instanceof Worker)) {
      throw new Error("workerClass must be a subclass of Worker");
    }
    this.workerClass = workerClass;
    this.params = params || {};
    this.callback = callback || ((res) => res);
    this.generationHandler = generationHandler || (() => {});
    this.numberOfWorkers = numberOfWorkers || this.numberOfWorkers;
    this.extraProertiesForWorkers = extraProertiesForWorkers || [];
  }

  /**
   *
   * @returns {Promise<PM>}
   */
  async init() {
    const bot = new WikiBot(this.hamichlol);
    const logedIn = await bot.login();
    if (!logedIn) {
      console.error("Failed to login to the bot");
      process.exit(1);
    }
    this.bot = bot;
    this.loger = new Loger(bot);
    console.log("Bot initialized and logged in successfully");
    console.log("in init function", typeof this.generator);
    process.on("exit", this.#handleExit.bind(this));
    process.on("SIGINT", this.#handleExit.bind(this));
    process.on("SIGTERM", this.#handleExit.bind(this));
    process.on("unhandledRejection", this.#handleExit.bind(this));

    return this;
  }

  async run() {
    if (!this.bot || !this.loger) {
      throw new Error("PM not initialized. Call init() first.");
    }
    if (this.pageList.length === 0) {
      console.error("No pages to process");
      return Promise.allSettled([Promise.reject("No pages to process")]);
    }
    const bot = this.bot;
    const loger = this.loger;
    const pageList = this.pageList;
    const terminater = this.end;
    const extraParams = this.extraProertiesForWorkers || [];

    for (let i = 0; i < this.numberOfWorkers; i++) {
      const worker = new this.workerClass(
        i + 1,
        loger,
        pageList,
        terminater,
        bot,
        ...extraParams
      );
      this.workersStatus[i] = "running";
      this.workers[i] = worker.start().finally((r) => {
        this.workersStatus[i] = "finished";
        return r;
      });
    }
    return this.workers;
  }

  maintainWorkersAmount() {
    if (this.pageList.length <= 0 || this.end.terminate) {
      return;
    }
    const finished = this.workersStatus
      .map((v, i) => v === "finished" && i + 1)
      .filter(Boolean);
    if (finished.length) {
      if (finished.length === this.workers.length) {
        console.log("all workers are finished, re running workers");
        return this.run();
      }
      const bot = this.bot;
      const loger = this.loger;
      const pageList = this.pageList;
      const terminater = this.end;
      const extraParams = this.extraProertiesForWorkers || [];
      for (let n = 0; n < finished.length; n++) {
        const id = finished[n];
        const worker = new this.workerClass(
          id,
          loger,
          pageList,
          terminater,
          bot,
          ...extraParams
        );
        this.workersStatus[id - 1] = "running";
        this.workers[id - 1] = worker.start().finally((r) => {
          this.workersStatus[id - 1] = "finished";
          return r;
        });
      }
    }
  }

  async waitWorkers() {
    return Promise.allSettled(this.workers)
      .then((w) => {
        console.log(w);
        console.log(this.workers);
      })
      .finally(async () => {
        console.log(`all workers are settled`);
        await this.loger.log();
        await this.bot.logout();
      });
  }

  /**
   *
   * @template T
   * @param {Object<string,string|number>} params
   * @param {(any)=>T} callback
   * @returns {Promise<T>}
   */
  async generator(params, callback) {
    return this.bot.generator(params, callback);
  }

  setPageList(list) {
    if (!Array.isArray(list)) {
      throw new Error("list must be an array");
    }
    this.pageList.push(...list);
  }

  async #handleExit() {
    this.end.terminate = true;
    console.log("waiting for workers to finish");
    await Promise.allSettled(this.workers).finally(() => {
      this.loger.log().then(() => {
        this.bot.logout().then(() => process.exit(0));
      });
    });
  }
}
