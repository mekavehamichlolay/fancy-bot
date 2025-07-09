import Client from "./Client.js";

class WikiBot extends Client {
  constructor(wikiUrl) {
    super(wikiUrl);
  }
  /**
   *
   * @param {String} wikiUrl
   * @param {Object} details
   * @param {String} [details.userName]
   * @param {String} [details.password]
   * @param {String} [details.title]
   * @param {Number} [details.pageId]
   * @param {String} details.text
   * @param {Number} [details.baseRevId]
   * @param {String} [details.summary]
   * @param {Number} [details.nocreate]
   */
  static async singleEdit(wikiUrl, details) {
    const bot = new this(wikiUrl);
    const { userName, password } = details;
    bot
      .login(userName, password)
      .then(() => bot.edit({ ...details }))
      .then(() => bot.logout());
  }
  /**
   *
   * @param {String} wikiUrl
   * @param {Object} targets
   * @param {String} targets.type
   * @param {Object} targets.query
   * @param {CallableFunction} targets.callBack
   * @param {{from:RegExp;to:String;}[]} replacements
   * @param {Object} [options]
   * @param {String} options.summary
   * @param {String} options.userName
   * @param {String} options.password
   * @param {Number} options.amountOfCalls
   */
  static async botMasiveReplacement(
    wikiUrl,
    targets,
    replacements,
    options = {}
  ) {
    const bot = new this(wikiUrl);
    const { userName, password } = options;
    await bot.login(userName, password);
    const list = await bot.generator(targets.query, targets.callBack);
    const { amountOfCalls = 5 } = options;
    for (let i = 0; list.length; i += amountOfCalls) {
      // console.log(list);
      const subList = list.splice(
        0,
        amountOfCalls < list.length ? amountOfCalls : list.length
      );
      const newList = Promise.all(
        subList.map(async (target) => {
          try {
            const { parse, error } = await bot.getArticleText(
              target,
              targets.type
            );
            if (error) throw error;
            const {
              wikitext: { "*": oldText },
              revid,
              pageid,
              title,
            } = parse;
            const newText = replacements.reduce((text, reg) => {
              return text.replace(reg.from, reg.to);
            }, oldText);
            if (oldText === newText)
              return Promise.resolve(`no changes in ${title}`);
            const editOptions = {
              pageId: pageid,
              text: newText,
              baseRevId: revid,
              summary: options.summary ? options.summary : "",
            };
            return await bot.edit(editOptions);
          } catch (err) {
            console.error(err);
            return Promise.resolve("problem: " + JSON.stringify(err));
          }
        })
      );
      await newList;
      console.log(newList);
    }
    bot.logout();
  }

  /**
   *
   * @template T
   * @param {Object} params
   * @param {(any) => T} callBack
   * @returns {Promise<T>}
   */
  async generator(params, callBack) {
    const generatorParams = {
      format: "json",
      utf8: 1,
      ...params,
    };
    try {
      const res = await this.getWikiWithCookie(
        new URLSearchParams(generatorParams)
      );
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const result = await res.json();
      return callBack(result);
    } catch (err) {
      console.error(err);
      return err;
    }
  }
  /**
   *
   * @param {String} article
   * @param {"page"|"pageid"} type
   * @returns {Promise<import("./Client.js").ArticleParse|import("./Client.js").ArticleError>}
   */
  async getArticleText(article, type) {
    const parseParams = new URLSearchParams({
      action: "parse",
      format: "json",
      [type]: article,
      prop: "revid|wikitext",
      disablelimitreport: 1,
      contentmodel: "wikitext",
      utf8: 1,
    });
    try {
      const res = await this.getWikiWithCookie(parseParams);
      const article = await res.json();
      return article;
    } catch (error) {
      return { error };
    }
  }
}

export default WikiBot;
