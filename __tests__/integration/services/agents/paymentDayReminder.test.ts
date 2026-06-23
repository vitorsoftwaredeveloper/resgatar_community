import * as dbModule from "../../../../src/db";
import { MemberModel } from "../../../../src/models/Member";
import * as firebaseIntegration from "../../../../src/integrations/firebase";
import { execute } from "../../../../src/services/agents/paymentDayReminder";

describe("paymentDayReminder agent (integration)", () => {
  let dbSpy: jest.SpyInstance;
  let memberFindSpy: jest.SpyInstance;
  let memberUpdateManySpy: jest.SpyInstance;
  let sendPushSpy: jest.SpyInstance;

  beforeEach(() => {
    dbSpy = jest.spyOn(dbModule, "db").mockResolvedValue(undefined as any);

    memberFindSpy = jest
      .spyOn(MemberModel, "find")
      .mockResolvedValue([
        { _id: "m1", firstName: "João", pushToken: "token-1" },
        { _id: "m2", firstName: "Maria", pushToken: "token-2" },
      ] as any);

    memberUpdateManySpy = jest
      .spyOn(MemberModel, "updateMany")
      .mockResolvedValue({} as any);

    sendPushSpy = jest
      .spyOn(firebaseIntegration, "sendPushNotificationToTokens")
      .mockResolvedValue([]);
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

  it("should send push notification to all tokens", async () => {
    await execute();

    expect(sendPushSpy).toHaveBeenCalledWith(
      ["token-1", "token-2"],
      "Lembrete de Pagamento",
      expect.any(String),
    );
  });

  it("should not send notification when no members have payment due today", async () => {
    memberFindSpy.mockResolvedValue([]);

    await execute();

    expect(sendPushSpy).not.toHaveBeenCalled();
  });

  it("should clear invalid push tokens returned by Firebase", async () => {
    sendPushSpy.mockResolvedValue(["token-1"]);

    await execute();

    expect(memberUpdateManySpy).toHaveBeenCalledWith(
      { pushToken: { $in: ["token-1"] } },
      { $set: { pushToken: null } },
    );
  });

  it("should not call updateMany when there are no invalid tokens", async () => {
    sendPushSpy.mockResolvedValue([]);

    await execute();

    expect(memberUpdateManySpy).not.toHaveBeenCalled();
  });

  it("should not throw when an error occurs", async () => {
    memberFindSpy.mockRejectedValue(new Error("DB error"));

    await expect(execute()).resolves.not.toThrow();
  });
});
