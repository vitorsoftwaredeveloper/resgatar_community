import * as dbModule from "../../../../src/db";
import { MemberModel } from "../../../../src/models/Member";
import * as notificationEngine from "../../../../src/services/notifications/sendNotification";
import { execute } from "../../../../src/services/agents/paymentDayReminder";

describe("paymentDayReminder agent (integration)", () => {
  let dbSpy: jest.SpyInstance;
  let memberFindSpy: jest.SpyInstance;
  let sendSpy: jest.SpyInstance;

  beforeEach(() => {
    dbSpy = jest.spyOn(dbModule, "db").mockResolvedValue(undefined as any);

    memberFindSpy = jest
      .spyOn(MemberModel, "find")
      .mockResolvedValue([{ _id: "m1" }, { _id: "m2" }] as any);

    sendSpy = jest
      .spyOn(notificationEngine, "sendNotification")
      .mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should connect to database", async () => {
    await execute();

    expect(dbSpy).toHaveBeenCalledTimes(1);
  });

  it("should query members whose payment day matches today", async () => {
    const today = new Date().getDate();

    await execute();

    expect(memberFindSpy).toHaveBeenCalledWith(
      expect.objectContaining({ "paymentInfo.datePayment": today }),
      expect.any(Object),
      expect.any(Object),
    );
  });

  it("should exclude guests from the payment reminder", async () => {
    await execute();

    expect(memberFindSpy).toHaveBeenCalledWith(
      expect.objectContaining({ role: { $in: ["user", "admin"] } }),
      expect.any(Object),
      expect.any(Object),
    );
  });

  it("should notify every member due today", async () => {
    await execute();

    expect(sendSpy).toHaveBeenCalledWith(
      ["m1", "m2"],
      expect.objectContaining({ title: "Lembrete de Pagamento" }),
    );
  });

  it("should deep link to the bills screen", async () => {
    await execute();

    expect(sendSpy.mock.calls[0][1].link).toBe("/bills");
  });

  it("should not send anything when nobody has a payment due today", async () => {
    memberFindSpy.mockResolvedValue([]);

    await execute();

    expect(sendSpy).not.toHaveBeenCalled();
  });

  it("should not throw when an error occurs", async () => {
    memberFindSpy.mockRejectedValue(new Error("DB error"));

    await expect(execute()).resolves.not.toThrow();
  });
});
