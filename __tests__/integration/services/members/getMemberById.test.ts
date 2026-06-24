import * as helperService from "../../../../src/services/helper";
import * as getMemberModule from "../../../../src/services/members/getMember";
import { getMemberByIdService } from "../../../../src/services/members/getMemberById";

const ADMIN_ID = "admin-id";
const TARGET_ID = "member-id-123";

const mockMemberWithContributions = {
  _id: TARGET_ID,
  email: "joao@email.com",
  contributions: { year: 2026, months: { january: { paid: false } } },
} as any;

describe("getMemberByIdService (integration)", () => {
  let verifyAdminSpy: jest.SpyInstance;
  let getMemberServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    verifyAdminSpy = jest
      .spyOn(helperService, "verifyAdmin")
      .mockResolvedValue(undefined as any);

    getMemberServiceSpy = jest
      .spyOn(getMemberModule, "getMemberService")
      .mockResolvedValue(mockMemberWithContributions);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should verify the caller is an admin", async () => {
    await getMemberByIdService(ADMIN_ID, TARGET_ID);

    expect(verifyAdminSpy).toHaveBeenCalledWith(ADMIN_ID);
  });

  it("should fetch the target member (with contributions) by id", async () => {
    await getMemberByIdService(ADMIN_ID, TARGET_ID);

    expect(getMemberServiceSpy).toHaveBeenCalledWith(TARGET_ID);
  });

  it("should return the member with contributions", async () => {
    const result = await getMemberByIdService(ADMIN_ID, TARGET_ID);

    expect(result).toEqual(mockMemberWithContributions);
  });

  it("should not fetch the member when caller is not an admin", async () => {
    verifyAdminSpy.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized access",
    });

    await expect(
      getMemberByIdService(ADMIN_ID, TARGET_ID)
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(getMemberServiceSpy).not.toHaveBeenCalled();
  });
});
