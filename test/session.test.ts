import { getSession, Session } from "../src";

import * as t from "./time";

test(
  "create session",
  async () => {
    const psid = "s9999";
    const password = "123456789";
    jest.mock("fs/promises", () => {
      return {
        readFile: async () => Error("Cannot find file"),
        writeFile: async () => undefined,
      };
    });
    const session = await getSession({ psid, password });
    expect(session.psid).toEqual(psid);
    expect(session.password).toEqual(password);
    expect(session.cookies).toEqual(true);
    await session.close();
  },
  t.Short
);

describe("session", () => {
  let session: Session;

  beforeAll(async () => {
    session = await getSession({
      psid: process.env.CMS_PSID,
      password: process.env.CMS_PASSWORD,
    });
    await session.login();
  }, t.Medium);
  afterAll(async () => {
    await session.close();
  }, t.Short);

  it(
    "can get timetable",
    async () => {
      const tb = await session.getTimetable();
      expect(typeof tb.Mon).toEqual("object");
    },
    t.Medium
  );
});
