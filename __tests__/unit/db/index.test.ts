const connectMock = jest.fn();
const getSsmParameterMock = jest.fn();

jest.mock("mongoose", () => ({
  ...jest.requireActual("mongoose"),
  connect: (...args: any[]) => connectMock(...args),
}));

jest.mock("../../../src/utils/ssm", () => ({
  getSsmParameter: (...args: any[]) => getSsmParameterMock(...args),
}));

beforeEach(() => {
  jest.resetModules();
  connectMock.mockReset();
  getSsmParameterMock.mockReset();
  process.env.DB = "mongodb://localhost:27017/test";
});

afterEach(() => {
  delete process.env.DB;
});

describe("db", () => {
  it("should call mongoose.connect with the DB env variable when it is a direct URI", async () => {
    connectMock.mockResolvedValue({ conn: "mock" });
    const { db } = await import("../../../src/db");

    await db();

    expect(connectMock).toHaveBeenCalledWith("mongodb://localhost:27017/test");
    expect(getSsmParameterMock).not.toHaveBeenCalled();
  });

  it("should resolve the connection string from SSM when DB is a parameter name", async () => {
    process.env.DB = "/resgatar_community/db";
    getSsmParameterMock.mockResolvedValue("mongodb+srv://user:pass@cluster/db");
    connectMock.mockResolvedValue({ conn: "mock" });
    const { db } = await import("../../../src/db");

    await db();

    expect(getSsmParameterMock).toHaveBeenCalledWith("/resgatar_community/db");
    expect(connectMock).toHaveBeenCalledWith(
      "mongodb+srv://user:pass@cluster/db"
    );
  });

  it("should return the connection on success", async () => {
    const mockConn = { conn: "mock" };
    connectMock.mockResolvedValue(mockConn);
    const { db } = await import("../../../src/db");

    const result = await db();

    expect(result).toEqual(mockConn);
  });

  it("should reuse existing connection on subsequent calls", async () => {
    connectMock.mockResolvedValue({ conn: "mock" });
    const { db } = await import("../../../src/db");

    await db();
    await db();
    await db();

    expect(connectMock).toHaveBeenCalledTimes(1);
  });

  it("should not throw when mongoose.connect fails", async () => {
    connectMock.mockRejectedValue(new Error("Connection refused"));
    const { db } = await import("../../../src/db");

    await expect(db()).resolves.not.toThrow();
  });

  it("should return undefined when mongoose.connect fails", async () => {
    connectMock.mockRejectedValue(new Error("Connection refused"));
    const { db } = await import("../../../src/db");

    const result = await db();

    expect(result).toBeUndefined();
  });
});
