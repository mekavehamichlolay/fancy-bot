import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();
import { extractCookie } from "./utils/cookie.mjs";
/**
 * client for mmediawiki wiki api,
 * use only with A user with bot rights,
 * create A sub user with [[Special:BotPasswords]],
 * instruction see in {@link https://www.mediawiki.org/wiki/Manual:Bot_passwords}
 * @class Client
 */
class Client {
  wikiUrl;
  #cookie = "";
  userName = process.env.UNAME || "";
  #password = process.env.PWD || "";
  isLogedIn = false;
  csrfToken = "";
  botAuth = process.env.BOT_AUTH || "";
  /**
   *
   * @param {String} wikiUrl
   */
  constructor(wikiUrl) {
    if (!wikiUrl) {
      throw new Error("you didn't pass the url of your wiki");
    }
    this.wikiUrl = wikiUrl;
    if (!this.userName || !this.#password) {
      console.log(
        "you didn't pass your user name or password, you can set them in .env file"
      );
      process.exit(1);
    }
  }
  async #postWiki(body) {
    return fetch(this.wikiUrl, {
      headers: {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "user-agent": "node-fetch mw-api-node-client",
        cookie: this.#cookie,
        "Bot-Auth": this.botAuth || "",
      },
      method: "POST",
      credentials: "include",
      body: new URLSearchParams({ format: "json", utf8: 1, ...body }),
    });
  }
  async getWikiWithCookie(queryString) {
    if (!this.isLogedIn) {
      await this.login();
    }
    return fetch(`${this.wikiUrl}?${queryString}`, {
      headers: { cookie: this.#cookie, "Bot-Auth": this.botAuth || "" },
    });
  }
  /**
   * method to login the user and get a cookie for forther operations
   * @param {String} [userName]
   * @param {String} [password]
   * @returns {Promise<Boolean>}
   */
  async login(userName, password) {
    if (userName) {
      this.userName = userName;
    }
    if (password) {
      this.#password = password;
    }
    if (!this.userName || !this.#password) {
      throw new Error("you dinwt pass your user name or your password");
    }
    const { logintoken: lgtoken } = await this.#getToken("login");
    const loginParams = {
      action: "login",
      lgname: this.userName,
      lgpassword: this.#password,
      lgtoken,
    };
    const res = await this.#postWiki(loginParams);
    const resp = await res.json();
    const login = resp?.login;
    if (!login?.result || login.result !== "Success") {
      console.log(login);
      this.isLogedIn = false;
      return false;
    }
    this.#cookie = extractCookie(res.headers.raw()["set-cookie"]);
    this.isLogedIn = true;
    return true;
  }
  async logout() {
    const { csrftoken: token } = await this.#getToken("csrf");
    const logOutParams = {
      action: "logout",
      token,
    };
    this.#postWiki(logOutParams)
      .then(() => console.log("loged out successfully"))
      .catch((err) => console.log(err));
  }
  /**
   *
   * @param {String} type
   * @returns {Promise<Object>}
   */
  async #getToken(type) {
    const res = await fetch(
      `${this.wikiUrl}?action=query&format=json&meta=tokens&type=${type}`,
      {
        headers: {
          cookie: this.#cookie || "",
          "Bot-Auth": this.botAuth || "",
        },
      }
    );
    // console.log(await res.text());
    // process.exit(1)
    const jsonRes = await res.json();
    if (res.headers.raw()["set-cookie"]) {
      this.#cookie = extractCookie(res.headers.raw()["set-cookie"]);
    }
    return jsonRes.query.tokens;
  }
  /**
   * method for making edit, you most provide title or pageid, providing both will return error from the api, you most even provide text, all other arguments are optional
   * @param {Object} param
   * @param {String} [param.title]
   * @param {Number} [param.pageId]
   * @param {String} param.text
   * @param {number} param.undo
   * @param {Number} [param.baseRevId]
   * @param {String} [param.summary]
   * @param {Number} param.nocreate
   * @param {Number|String} [param.section]
   * @param {String} [param.sectiontitle]
   * @returns {Promise<String>}
   */
  async edit({
    title,
    pageId: pageid,
    text,
    undo,
    baseRevId: baserevid,
    summary,
    nocreate = 1,
    section,
    sectiontitle,
    appendtext,
  }) {
    if (!title && !pageid) {
      throw new Error(
        "you didn't pass the details of the article you want to edit"
      );
    }
    if (!this.isLogedIn) {
      await this.login();
    }
    if (!this.csrfToken) {
      const { csrftoken: token } = await this.#getToken("csrf&assert=bot");
      this.csrfToken = token;
    }
    const editParams = {
      action: "edit",
      text,
      appendtext,
      undo,
      summary: summary || "",
      minor: 1,
      bot: 1,
      nocreate,
      baserevid,
      section,
      sectiontitle,
      token: this.csrfToken,
    };
    if (!baserevid) {
      delete editParams.baserevid;
    }
    if (!section) {
      delete editParams.section;
    }
    if (!sectiontitle) {
      delete editParams.sectiontitle;
    }
    if (!nocreate) {
      delete editParams.nocreate;
    }
    if (!appendtext) {
      delete editParams.appendtext;
    } else {
      delete editParams.text;
    }
    if (title) {
      editParams.title = title;
    } else {
      editParams.pageid = pageid;
    }
    if (!text) {
      delete editParams.text;
    }
    if (!undo) {
      delete editParams.undo;
    } else {
      editParams.undo = parseInt(undo);
    }

    const res = await this.#postWiki(editParams);
    const { edit, error } = await res.json();
    return edit?.result || error?.code;
  }
  /**
   * method to delete article
   * @param {String} title
   * @param {String} [reason]
   */
  async delete(title, reason) {
    if (!this.isLogedIn) await this.login();
    const { csrftoken: token } = await this.#getToken("csrf&assert=bot");
    const deleteParams = {
      action: "delete",
      title,
      token,
      reason,
    };
    if (!reason) delete deleteParams.reason;
    const res = await this.#postWiki(deleteParams);
    const parsed = await res.json();
    // console.log(parsed?.delete?.title || `problem deleting ${title}`);
    return parsed?.delete?.title;
  }

  async rollback({ pageid, user, summary }) {
    if (!this.isLogedIn) await this.login();
    const { rollbacktoken: token } = await this.#getToken("rollback");
    const rollbackParams = {
      action: "rollback",
      pageid,
      markbot: 1,
      user,
      summary,
      token,
    };
    const res = await this.#postWiki(rollbackParams);
    const parsed = await res.json();
    console.log(parsed);
  }

  /**
   *
   * @param {number} rcid
   */
  async patrol(rcid) {
    if (!this.isLogedIn) await this.login();
    const { patroltoken: token } = await this.#getToken("patrol");
    const patrolParams = {
      action: "patrol",
      rcid,
      token,
    };
    const res = await this.#postWiki(patrolParams);
    const parsed = await res.json();
    console.log(parsed);
  }
  /**
   * method for moving pages
   * @param {String} from
   * @param {String} to
   * @param {String} [reason]
   * @param {Object} [param3]
   * @param {Number} param3.movtalk
   * @param {Number} param3.movesubpages
   * @param {Number} param3.noredirect
   */
  async move(
    from,
    to,
    reason,
    { movetalk = 1, movesubpages = 1, noredirect = 1 }
  ) {
    const { csrftoken: token } = await this.#getToken("csrf&assert=bot");
    const moveParams = {
      action: "move",
      from,
      to,
      reason,
      movetalk,
      movesubpages,
      noredirect,
      ignorewarnings: 1,
      token,
    };
    const res = await this.#postWiki(moveParams);
    const parsed = await res.json();
    console.log(
      (parsed?.move?.from, "was moved to ", parsed?.move?.to) ||
        `problem to move ${from}`
    );
  }
  async unDelete({ title, reason }) {
    const { csrftoken: token } = await this.#getToken("csrf");
    const params = {
      action: "undelete",
      format: "json",
      title,
      reason,
      token,
      utf8: 1,
    };
    const res = await this.#postWiki(params);
    const parsed = await res.json();
    if (parsed.error) {
      console.log(parsed.error.code, title);
    } else {
      console.log(parsed.undelete.title);
    }
  }
  async sendMail({ target, subject, text }) {
    const { csrftoken: token } = await this.#getToken("csrf");
    const mailParams = {
      action: "emailuser",
      target,
      subject,
      text,
      token,
    };
    const res = await this.#postWiki(mailParams);
    const parsed = await res.json();
    console.log(parsed);
    return parsed?.emailuser?.result;
  }
  async sendMessageToTalkPage({ page, topic, content }) {
    const { csrftoken: token } = await this.#getToken("csrf&assert=bot");
    const flowParams = {
      action: "flow",
      submodule: "new-topic",
      page,
      token,
      nttopic: topic,
      ntcontent: content,
    };
    const res = await this.#postWiki(flowParams);
    const parsed = await res.json();
    if (parsed?.error?.code === "invalid-page") {
      return await this.edit({
        title: page,
        text: content + "~~" + "~",
        summary: topic,
        section: "new",
        sectiontitle: topic,
      });
    }
    return parsed?.flow ? parsed?.flow["new-topic"]?.status : parsed;
  }

  /**
   *
   * @param {Object} params
   * @param {string} [params.title]
   * @param {number} [params.id]
   * @param {string} [params.reason]
   * @param {"read"|"edit"|"none"|"create"|"edit-semi"|"edit-full"} params.level
   */
  async lockPage({ title, id, level, reason = "" }) {
    if (!level) {
      throw new Error("you didn't pass the level of the lock");
    }
    if (!this.isLogedIn) {
      await this.login();
    }
    if (!this.csrfToken) {
      this.csrfToken = (await this.#getToken("csrf")).csrftoken;
    }
    // const { csrftoken: token } = await this.#getToken("csrf");
    const params = {
      action: "aspaklaryalockdown",
      title,
      pageid: id,
      level,
      token: this.csrfToken,
      reason,
    };
    if (!title && !id) {
      throw new Error(
        "you didn't pass the title or the id of the page you want to lock"
      );
    }
    if (!title) {
      delete params.title;
    }
    if (!id) {
      delete params.pageid;
    }
    const res = await this.#postWiki(params);
    const parsed = await res.json();
    if (parsed.error && parsed.error.code === "customjsprotected") {
      console.error(parsed);
    }
    return parsed.error
      ? parsed.error.code
      : parsed.aspaklaryalockdown
      ? parsed.aspaklaryalockdown.level
      : parsed;
  }

  async deleteRevision({ ids }) {
    const { csrftoken: token } = await this.#getToken("csrf");
    const params = {
      action: "revisiondelete",
      format: "json",
      type: "logging",
      ids: ids.join("|"),
      hide: "content",
      token,
      formatversion: "2",
    };
    const res = await this.#postWiki(params);
    const parsed = await res.json();
    return parsed?.revisiondelete?.status;
  }
}

export default Client;
