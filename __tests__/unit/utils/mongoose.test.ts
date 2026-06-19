import mongoose from "mongoose";
import * as dbModule from "../../../src/db";
import { executeMongoTransaction } from "../../../src/utils/mongoose";

describe("executeMongoTransaction", () => {
  let dbSpy: jest.SpyInstance;
  let startSessionSpy: jest.SpyInstance;
  let withTransactionMock: jest.Mock;
  let endSessionMock: jest.Mock;
  let mockSession: any;

  beforeEach(() => {
    dbSpy = jest.spyOn(dbModule, "db").mockResolvedValue(undefined as any);

    endSessionMock = jest.fn().mockResolvedValue(undefined);
    withTransactionMock = jest.fn().mockImplementation(async (fn) => fn());

    mockSession = {
      withTransaction: withTransactionMock,
      endSession: endSessionMock,
    };

    startSessionSpy = jest
      .spyOn(mongoose, "startSession")
      .mockResolvedValue(mockSession as any);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should connect to DB before starting the session", async () => {
    const order: string[] = [];
    dbSpy.mockImplementation(async () => { order.push("db"); });
    startSessionSpy.mockImplementation(async () => { order.push("session"); return mockSession; });

    await executeMongoTransaction(async () => "result");

    expect(order).toEqual(["db", "session"]);
  });

  it("should start a mongoose session", async () => {
    await executeMongoTransaction(async () => "result");

    expect(startSessionSpy).toHaveBeenCalled();
  });

  it("should run operations inside withTransaction", async () => {
    const operations = jest.fn().mockResolvedValue("data");

    await executeMongoTransaction(operations);

    expect(withTransactionMock).toHaveBeenCalled();
    expect(operations).toHaveBeenCalledWith(mockSession);
  });

  it("should return the result of the operations", async () => {
    const result = await executeMongoTransaction(async () => "expected-value");

    expect(result).toBe("expected-value");
  });

  it("should always end the session even when operations succeed", async () => {
    await executeMongoTransaction(async () => "ok");

    expect(endSessionMock).toHaveBeenCalled();
  });

  it("should always end the session even when operations throw", async () => {
    withTransactionMock.mockRejectedValue(new Error("Transaction error"));

    await expect(executeMongoTransaction(async () => { throw new Error("ops"); }))
      .rejects.toThrow("Transaction error");

    expect(endSessionMock).toHaveBeenCalled();
  });

  it("should propagate errors from operations", async () => {
    withTransactionMock.mockRejectedValue(new Error("DB failure"));

    await expect(
      executeMongoTransaction(async () => { throw new Error("DB failure"); })
    ).rejects.toThrow("DB failure");
  });
});
