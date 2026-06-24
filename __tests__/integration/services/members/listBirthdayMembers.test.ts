import { MemberModel } from "../../../../src/models/Member";
import { listBirthdayMembersService } from "../../../../src/services/members/listBirthdayMembers";

const currentMonth = new Date().getMonth() + 1;

function makeDob(month: number, day: number): string {
  return String(new Date(2000, month - 1, day).getTime());
}

const memberThisMonth1 = {
  _id: "m1",
  firstName: "Ana",
  lastName: "Lima",
  dateOfBirth: makeDob(currentMonth, 10),
  profileImage: null,
};

const memberThisMonth2 = {
  _id: "m2",
  firstName: "Carlos",
  lastName: "Melo",
  dateOfBirth: makeDob(currentMonth, 5),
  profileImage: "base64img",
};

const memberOtherMonth = {
  _id: "m3",
  firstName: "Bruno",
  lastName: "Torres",
  dateOfBirth: makeDob(currentMonth === 12 ? 1 : currentMonth + 1, 1),
  profileImage: null,
};

describe("listBirthdayMembersService (integration)", () => {
  let memberFindSpy: jest.SpyInstance;

  beforeEach(() => {
    memberFindSpy = jest
      .spyOn(MemberModel, "find")
      .mockResolvedValue([
        memberThisMonth1,
        memberThisMonth2,
        memberOtherMonth,
      ] as any);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should return only members whose birth month matches the current month", async () => {
    const result = await listBirthdayMembersService();

    const ids = result.map((m: any) => m._id);
    expect(ids).toContain("m1");
    expect(ids).toContain("m2");
    expect(ids).not.toContain("m3");
  });

  it("should return members sorted by day ascending", async () => {
    const result = await listBirthdayMembersService();

    const days = result.map((m: any) =>
      new Date(Number(m.dateOfBirth)).getDate(),
    );
    expect(days).toEqual([...days].sort((a, b) => a - b));
  });

  it("should return an empty array when no members have birthday this month", async () => {
    memberFindSpy.mockResolvedValue([memberOtherMonth] as any);

    const result = await listBirthdayMembersService();

    expect(result).toHaveLength(0);
  });

  it("should query only members with dateOfBirth set", async () => {
    await listBirthdayMembersService();

    expect(memberFindSpy).toHaveBeenCalledWith(
      { dateOfBirth: { $ne: null } },
      expect.any(Object),
      expect.any(Object),
    );
  });

  it("should include firstName, lastName, dateOfBirth and profileImage in projection", async () => {
    await listBirthdayMembersService();

    expect(memberFindSpy).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        firstName: 1,
        lastName: 1,
        dateOfBirth: 1,
        profileImage: 1,
      }),
      expect.any(Object),
    );
  });

  it("should return an empty array when all members have null dateOfBirth", async () => {
    memberFindSpy.mockResolvedValue([
      { ...memberThisMonth1, dateOfBirth: null },
    ] as any);

    const result = await listBirthdayMembersService();

    expect(result).toHaveLength(0);
  });
});
