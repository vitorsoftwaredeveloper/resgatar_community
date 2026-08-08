import * as dbModule from "../../../../src/db";
import { MemberModel } from "../../../../src/models/Member";
import * as notificationEngine from "../../../../src/services/notifications/sendNotification";
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
};

const birthdayMember2 = {
  _id: "m2",
  firstName: "Maria",
  lastName: "Santos",
  dateOfBirth: String(makeDob(todayMonth, todayDay)),
};

const otherMember = {
  _id: "m3",
  firstName: "Pedro",
  lastName: "Costa",
  dateOfBirth: String(makeDob(todayMonth === 12 ? 1 : todayMonth + 1, 1)),
};

const callFor = (spy: jest.SpyInstance, memberId: string) =>
  spy.mock.calls.filter(([ids]) => ids.includes(memberId));

describe("birthdayNotification agent (integration)", () => {
  let dbSpy: jest.SpyInstance;
  let memberFindSpy: jest.SpyInstance;
  let sendSpy: jest.SpyInstance;

  beforeEach(() => {
    dbSpy = jest.spyOn(dbModule, "db").mockResolvedValue(undefined as any);

    memberFindSpy = jest
      .spyOn(MemberModel, "find")
      .mockResolvedValue([birthdayMember1, birthdayMember2, otherMember] as any);

    sendSpy = jest
      .spyOn(notificationEngine, "sendNotification")
      .mockResolvedValue(undefined);
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

  it("should send the community notification only to non-birthday members", async () => {
    await execute();

    const communityCalls = callFor(sendSpy, "m3");

    expect(communityCalls).toHaveLength(1);
    expect(communityCalls[0][0]).not.toContain("m1");
  });

  it("should send the birthday notification only to birthday members", async () => {
    await execute();

    const birthdayCalls = callFor(sendSpy, "m1");

    expect(birthdayCalls).toHaveLength(1);
    expect(birthdayCalls[0][0]).not.toContain("m3");
    expect(birthdayCalls[0][1].title).toContain("Feliz Aniversário");
  });

  it("should mention the birthday member name in the community body", async () => {
    memberFindSpy.mockResolvedValue([birthdayMember1, otherMember] as any);

    await execute();

    expect(callFor(sendSpy, "m3")[0][1].body).toContain("João Silva");
  });

  it("should not send anything when nobody has a birthday today", async () => {
    memberFindSpy.mockResolvedValue([otherMember] as any);

    await execute();

    expect(sendSpy).not.toHaveBeenCalled();
  });

  it("should not throw when an error occurs", async () => {
    memberFindSpy.mockRejectedValue(new Error("DB error"));

    await expect(execute()).resolves.not.toThrow();
  });

  it("should use the singular message when there is a single birthday member", async () => {
    memberFindSpy.mockResolvedValue([birthdayMember1, otherMember] as any);

    await execute();

    expect(callFor(sendSpy, "m3")[0][1].body).toMatch(
      /aniversário de João Silva!/,
    );
  });

  it("should use the plural message when there are several birthday members", async () => {
    await execute();

    expect(callFor(sendSpy, "m3")[0][1].body).toMatch(/a eles/);
  });
});
