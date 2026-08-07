import * as dbModule from "../../../../src/db";
import { MemberModel } from "../../../../src/models/Member";
import * as firebaseIntegration from "../../../../src/integrations/firebase";
import { execute } from "../../../../src/services/agents/birthdayNotification";

const today = new Date();
const todayMonth = today.getMonth() + 1;
const todayDay = today.getDate();

function makeDob(month: number, day: number): number {
  return new Date(2000, month - 1, day).getTime();
}

const birthdayMember1 = {
  _id: "m1",
  firstName: "João",
  lastName: "Silva",
  dateOfBirth: String(makeDob(todayMonth, todayDay)),
  pushTokens: ["token-birthday-1"],
};

const birthdayMember2 = {
  _id: "m2",
  firstName: "Maria",
  lastName: "Santos",
  dateOfBirth: String(makeDob(todayMonth, todayDay)),
  pushTokens: [],
};

const otherMember = {
  _id: "m3",
  firstName: "Pedro",
  lastName: "Costa",
  dateOfBirth: String(makeDob(todayMonth === 12 ? 1 : todayMonth + 1, 1)),
  pushTokens: ["token-other"],
};

describe("birthdayNotification agent (integration)", () => {
  let dbSpy: jest.SpyInstance;
  let memberFindSpy: jest.SpyInstance;
  let memberUpdateManySpy: jest.SpyInstance;
  let sendPushToTokensSpy: jest.SpyInstance;

  beforeEach(() => {
    dbSpy = jest.spyOn(dbModule, "db").mockResolvedValue(undefined as any);

    memberFindSpy = jest
      .spyOn(MemberModel, "find")
      .mockResolvedValue([birthdayMember1, birthdayMember2, otherMember] as any);

    memberUpdateManySpy = jest
      .spyOn(MemberModel, "updateMany")
      .mockResolvedValue({} as any);

    sendPushToTokensSpy = jest
      .spyOn(firebaseIntegration, "sendPushNotificationToTokens")
      .mockResolvedValue([]);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should connect to database", async () => {
    await execute();

    expect(dbSpy).toHaveBeenCalledTimes(1);
  });

  it("should exclude guests from both the birthday list and the community audience", async () => {
    await execute();

    expect(memberFindSpy).toHaveBeenCalledWith(
      expect.objectContaining({ role: { $in: ["user", "admin"] } }),
      expect.any(Object),
      expect.any(Object),
    );
  });

  it("should send community notification only to non-birthday members", async () => {
    await execute();

    const communityCalls = sendPushToTokensSpy.mock.calls.filter(
      ([tokens]) => tokens.includes("token-other"),
    );
    expect(communityCalls).toHaveLength(1);
    expect(communityCalls[0][0]).not.toContain("token-birthday-1");
  });

  it("should send birthday notification only to birthday members with token", async () => {
    await execute();

    const birthdayCalls = sendPushToTokensSpy.mock.calls.filter(
      ([tokens]) => tokens.includes("token-birthday-1"),
    );
    expect(birthdayCalls).toHaveLength(1);
    expect(birthdayCalls[0][0]).not.toContain("token-other");
  });

  it("should not include null push tokens in birthday notification", async () => {
    await execute();

    const allTokensSent = sendPushToTokensSpy.mock.calls.flatMap(([tokens]) => tokens);
    expect(allTokensSent).not.toContain(null);
  });

  it("should mention birthday member name in community notification body", async () => {
    memberFindSpy.mockResolvedValue([birthdayMember1, otherMember] as any);

    await execute();

    const communityCalls = sendPushToTokensSpy.mock.calls.filter(
      ([tokens]) => tokens.includes("token-other"),
    );
    expect(communityCalls[0][2]).toContain("João Silva");
  });

  it("should not send any notification when no members have birthday today", async () => {
    memberFindSpy.mockResolvedValue([otherMember] as any);

    await execute();

    expect(sendPushToTokensSpy).not.toHaveBeenCalled();
  });

  it("should clear invalid push tokens returned by Firebase", async () => {
    sendPushToTokensSpy.mockResolvedValue(["token-birthday-1"]);

    await execute();

    expect(memberUpdateManySpy).toHaveBeenCalledWith(
      { pushTokens: { $in: expect.arrayContaining(["token-birthday-1"]) } },
      { $pull: { pushTokens: { $in: expect.arrayContaining(["token-birthday-1"]) } } },
    );
  });

  it("should not call updateMany when there are no invalid tokens", async () => {
    sendPushToTokensSpy.mockResolvedValue([]);

    await execute();

    expect(memberUpdateManySpy).not.toHaveBeenCalled();
  });

  it("should not throw when an error occurs", async () => {
    memberFindSpy.mockRejectedValue(new Error("DB error"));

    await expect(execute()).resolves.not.toThrow();
  });

  it("should use singular message when only one birthday member", async () => {
    memberFindSpy.mockResolvedValue([birthdayMember1, otherMember] as any);

    await execute();

    const communityCalls = sendPushToTokensSpy.mock.calls.filter(
      ([tokens]) => tokens.includes("token-other"),
    );
    expect(communityCalls[0][2]).toMatch(/aniversário de João Silva!/);
  });

  it("should use plural message when multiple birthday members", async () => {
    memberFindSpy.mockResolvedValue([
      birthdayMember1,
      { ...birthdayMember2, pushTokens: ["token-birthday-2"] },
      otherMember,
    ] as any);

    await execute();

    const communityCalls = sendPushToTokensSpy.mock.calls.filter(
      ([tokens]) => tokens.includes("token-other"),
    );
    expect(communityCalls[0][2]).toMatch(/a eles/);
  });
});
