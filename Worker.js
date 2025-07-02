import { Loger } from "./Loger.js";
import WikiBot from "./WikiBot.js";

/**
 * @class Worker
 * @description Base class for workers that process pages in a wiki.
 * you must implement the worker method in subclasses.
 * @property {number} id - The ID of the worker.
 * @property {Loger} loger - The logger instance for logging messages.
 * @property {WikiBot} bot - The WikiBot instance for performing wiki operations.
 * @property {string} title - The title of the current page being processed.
 * @property {number} baseRevId - The base revision ID of the current page.
 * @property {string} wikitext - The wikitext content of the current page.
 * @property {Array<{title:String;revid:Number;wikitext:String}>}  #pagesArray - An array of pages to be processed by the worker.
 * @property {{terminate:boolean}} terminater - An object to signal termination of the worker.
 */
export class Worker {
  title = "";
  baseRevId = 0;
  wikitext = "";
  /**
   * @type {{title:String;revid:Number;wikitext:String}[]}
   * @private
   */
  #pagesArray = null;
  /**
   * @type {{terminate:boolean}}
   */
  terminater = null;
  /**
   *
   * @param {number} id
   * @param {Loger} loger
   * @param {{title:String;revid:Number;wikitext:String}[]} pagesArray
   * @param {{terminate:boolean}} terminater
   * @param {WikiBot} bot
   */
  constructor(id, loger, pagesArray, terminater, bot) {
    this.id = id;
    this.loger = loger;
    this.#pagesArray = pagesArray;
    this.terminater = terminater;
    this.bot = bot;
  }
  /**
   * Starts the worker process.
   * If the terminater is set to terminate, it resolves immediately.
   * Otherwise, it processes the next page in the pagesArray.
   * @returns {Promise<string>} A promise that resolves with a message indicating the status of the worker.
   */
  async start() {
    if (this.terminater?.terminate) {
      return Promise.resolve(`worker ${this.id} was terminated`);
    }
    const page = this.#pagesArray.pop();
    if (!page) {
      return Promise.resolve(`worker ${this.id} was done`);
    }
    this.title = page.title;
    this.baseRevId = page.revid;
    this.wikitext = page.wikitext;
    if (!this.title || !this.baseRevId || !this.wikitext) {
      return this.start();
    }
    return this.worker();
  }

  /**
   * @abstract
   * @description This method should be implemented in subclasses to perform the specific work of the worker it should allways return the start method.
   */
  async worker() {
    throw new Error("worker method has to be implemented in subclass");
  }
}
