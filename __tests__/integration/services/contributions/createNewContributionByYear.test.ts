import * as helperService from "../../../../src/services/helper";
import * as helperModule from "../../../../src/services/helper";
import { MemberModel } from "../../../../src/models/Member";
import { createNewContributionByYearService } from "../../../../src/services/contributions/createNewContributionByYear";

const mockMembers = [
  { _id: "member-1" },
  { _id: "member-2" },
  { _id: "member-3" },
];

describe("createNewContributionByYearService (integration)", () => {
  let verifyAdminSpy: jest.SpyInstance;
  let findSpy: jest.SpyInstance;
  let createContributionByYearSpy: jest.SpyInstance;

  beforeEach(() => {
    verifyAdminSpy = jest
      .spyOn(helperService, "verifyAdmin")
      .mockResolvedValue(undefined);

    findSpy = jest
      .spyOn(MemberModel, "find")
      .mockResolvedValue(mockMembers as any);

    createContributionByYearSpy = jest
      .spyOn(helperModule, "createContributionByYear")
      .mockResolvedValue({} as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should verify admin before proceeding", async () => {
    await createNewContributionByYearService("admin-id", 2025);

    expect(verifyAdminSpy).toHaveBeenCalledWith("admin-id");
  });

  it("should throw when caller is not admin", async () => {
    verifyAdminSpy.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized access",
    });

    await expect(
      createNewContributionByYearService("user-id", 2025)
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(findSpy).not.toHaveBeenCalled();
    expect(createContributionByYearSpy).not.toHaveBeenCalled();
  });

  it("should fetch all members with only _id projection", async () => {
    await createNewContributionByYearService("admin-id", 2025);

    expect(findSpy).toHaveBeenCalledWith({}, { _id: 1 }, { lean: true });
  });

  it("should create contribution for each member starting from january (monthIndex 0)", async () => {
    await createNewContributionByYearService("admin-id", 2025);

    expect(createContributionByYearSpy).toHaveBeenCalledTimes(mockMembers.length);
    mockMembers.forEach(({ _id }) => {
      expect(createContributionByYearSpy).toHaveBeenCalledWith(_id, 2025, 0);
    });
  });

  it("should pass the correct year to each contribution", async () => {
    await createNewContributionByYearService("admin-id", 2026);

    expect(createContributionByYearSpy).toHaveBeenCalledWith(
      expect.any(String),
      2026,
      0
    );
  });

  it("should complete successfully even if some contributions fail (allSettled)", async () => {
    createContributionByYearSpy
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("Duplicate"))
      .mockResolvedValueOnce({});

    await expect(
      createNewContributionByYearService("admin-id", 2025)
    ).resolves.not.toThrow();
  });

  it("should process all members even if one fails", async () => {
    createContributionByYearSpy
      .mockRejectedValueOnce(new Error("Duplicate"))
      .mockResolvedValue({});

    await createNewContributionByYearService("admin-id", 2025);

    expect(createContributionByYearSpy).toHaveBeenCalledTimes(mockMembers.length);
  });

  it("should not call createContributionByYear when there are no members", async () => {
    findSpy.mockResolvedValue([]);

    await createNewContributionByYearService("admin-id", 2025);

    expect(createContributionByYearSpy).not.toHaveBeenCalled();
  });
});
