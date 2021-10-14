import { getSession, Session } from "../src";

test("create session", async () => {
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
});

describe("session", () => {
  let session: Session;

  beforeAll(async () => {
    session = await getSession({
      psid: process.env.CMS_PSID,
      password: process.env.CMS_PASSWORD,
    });
    await session.login();
  }, 20 * 1000);
  afterAll(async () => {
    await session.close();
  });

  it(
    "can get timetable",
    async () => {
      const tb = await session.getTimetable();
      expect(typeof tb.Mon).toEqual("object");
    },
    10 * 1000
  );
});
