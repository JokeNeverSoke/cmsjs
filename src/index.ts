import fs from "fs/promises";
import tesseract from "node-tesseract-ocr";
import pptr from "puppeteer";

import debug from "debug";

import { transformTable } from "./utils";

const rootLog = debug("sciecms");

export class Session {
  /** the base url of the site */
  baseUrl = "https://www.alevel.com.cn";

  logger: debug.Debugger;
  /** the username of the account */
  psid: string;
  password: string;
  /** the browser of the session */
  browser: pptr.Browser;
  cookies: boolean;

  /** whether the session is alive */
  status: "pending" | "open" | "closed" = "pending";

  constructor(
    psid: string,
    password: string,
    browser: pptr.Browser,
    cookies: boolean
  ) {
    this.logger = rootLog.extend("session");
    this.psid = psid;
    this.password = password;
    this.browser = browser;
    this.cookies = cookies;
  }

  /** get sub-logger */
  private gL(name: string) {
    return this.logger.extend(name);
  }

  /** enable/disable logging */
  toggleLogging(state = true) {
    const k = (u: string) => (state ? debug.enable(u) : debug.disable());
    k(this.logger.namespace);
    k(this.logger.namespace + ":*");
  }

  /** check if the current session is logged in */
  async checkLoggedIn() {
    const page = await this.browser.newPage();
    await page.goto(`${this.baseUrl}/user/${this.psid}`);
    const status = !page.url().includes("login");
    await page.close();
    return status;
  }

  private async getAuthScreenShot(page: pptr.Page) {
    const log = this.gL("get-auth-screen-shot");
    let captcha = (await page.$("#safecode"))!;
    log("taking captcha screenshot");
    return (await page.screenshot({
      clip: (await captcha.boundingBox())!,
      // path: './captcha.png',
      encoding: "binary",
    })) as Buffer;
  }

  private async guessAuthImg(img: Buffer) {
    return (
      await tesseract.recognize(img, {
        psm: 8,
        tessedit_char_whitelist:
          "1234567890abcdefghijklmnopqrstuvwxyzABCREFGHIJKLMNOPQRSTUVWXYZ",
      })
    ).trim();
  }

  private async solveAuthCode(page: pptr.Page) {
    const log = this.gL("solve-auth-code");
    let hasSafecode = false;
    try {
      await page.waitForSelector("#safecode", { timeout: 10000 });
      hasSafecode = true;
    } catch (e) {}
    if (hasSafecode) {
      let img = await this.getAuthScreenShot(page);
      let text = await this.guessAuthImg(img);

      while (text.length !== 6 && text.replace(/[^0-9]/g, "").length !== 4) {
        log("captcha not recognized, retrying");
        (await page.$("#safecode"))!.click();
        await page.waitForSelector("#safecode", {
          visible: true,
        });
        img = await this.getAuthScreenShot(page);
        text = await this.guessAuthImg(img);
      }
      log(`text recognized: "${text}"`);
      await page.$("input[name=authnum]").then((el) => el?.type(text));
    } else {
      log("no code discovered");
    }
  }

  private async fillLogin(page: pptr.Page) {
    await page.$("#psid").then((el) => el?.type(this.psid));
    await page.$("#passwd").then((el) => el?.type(this.password));
  }

  async saveCookies(p?: string) {
    const page = await this.browser.newPage();
    await page.goto(`https://www.alevel.com.cn/user/${this.psid}/`);
    const cookies = await page.cookies();
    let path = p ?? `./${this.psid}.json`;
    await fs.writeFile(path, JSON.stringify(cookies), {
      encoding: "utf-8",
    });
    await page.close();
  }

  async loadCookies(p?: string) {
    const log = this.gL("load-cookies");
    // TODO: create global cache directory
    const pageP = this.browser.newPage();
    let path = p ?? `./${this.psid}.json`;
    let cookiesString: string;
    try {
      cookiesString = await fs.readFile(path, { encoding: "utf-8" });
    } catch (e) {
      log("cannot get cookies");
      throw Error("Invalid path");
    }
    log("cookies found!");
    const cookies = JSON.parse(cookiesString);
    const page = await pageP;
    await page.setCookie(...cookies);
    await page.close();
  }

  /** login using the init credentials */
  async login() {
    const log = this.gL("login");
    const page = await this.browser.newPage();
    try {
      await this.loadCookies();
    } catch {
      // no cookies found
      log("no cookies found");
    }

    let status = await this.checkLoggedIn();
    if (!status) {
      log("no session found");
      while (!status) {
        await page.goto(`${this.baseUrl}/login/`, {
          waitUntil: "networkidle0",
        });
        log("filling in");
        await Promise.all([this.solveAuthCode(page), this.fillLogin(page)]);
        await page.$("input[name=post]").then((el) => el?.click());
        await page.waitForNavigation();
        if (!page.url().includes("login")) status = true;
      }
      log("saving cookeis");
      await this.saveCookies();
    } else {
      log("already logged in");
    }
    this.status = "open";
    await page.close();
    log("closed login window");
  }

  async getTimetable() {
    const log = this.gL("get-timetable");
    log("creating page");
    const page = await this.browser.newPage();
    log("fetching page");
    const table = await (
      await Promise.all([
        page.waitForResponse(
          "https://www.alevel.com.cn/user/getstudentcourse/"
        ),
        page.goto(`https://www.alevel.com.cn/user/${this.psid}/curriculum/`),
      ])
    )[0].json();
    await page.close();
    log("transforming table");
    return transformTable(table);
  }

  async close() {
    this.browser.close();
    this.status = "closed";
  }
}

export const getSession = async (
  { psid, password }: { psid: string; password: string },
  {
    cookies,
    launchOptions,
  }: {
    /** preserve cookies from different session, **on**
     * by default
     */
    cookies?: boolean;
    launchOptions?: Parameters<typeof pptr.launch>;
  } = {}
) => {
  const [browser] = await Promise.all([pptr.launch(...(launchOptions ?? []))]);
  return new Session(psid, password, browser, cookies ?? true);
};
