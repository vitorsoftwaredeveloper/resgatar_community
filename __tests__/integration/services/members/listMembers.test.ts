import * as helperService from "../../../../src/services/helper";
import * as cryptoUtil from "../../../../src/utils/crypto";
import { MemberModel } from "../../../../src/models/Member";
import { listMembersService } from "../../../../src/services/members/listMembers";

const mockMembers = [
  {
    _id: "member-1",
    email: "joao@email.com",
    firstName: "João",
    lastName: "Silva",
    identification: { type: "CPF", numberType: "ENC:encrypted-1" },
  },
  {
    _id: "member-2",
    email: "maria@email.com",
    firstName: "Maria",
    lastName: "Santos",
    identification: { type: "CPF", numberType: "ENC:encrypted-2" },
  },
];

describe("listMembersService (integration)", () => {
  let verifyAdminSpy: jest.SpyInstance;
  let findSpy: jest.SpyInstance;
  let decryptSpy: jest.SpyInstance;

  beforeEach(() => {
    verifyAdminSpy = jest
      .spyOn(helperService, "verifyAdmin")
      .mockResolvedValue(undefined);

    findSpy = jest
      .spyOn(MemberModel, "find")
      .mockResolvedValue(mockMembers as any);

    decryptSpy = jest
      .spyOn(cryptoUtil, "decrypt")
      .mockImplementation((val) => `decrypted:${val}`);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should verify admin before listing", async () => {
    await listMembersService("admin-id");

    expect(verifyAdminSpy).toHaveBeenCalledWith("admin-id");
  });

  it("should throw when caller is not admin", async () => {
    verifyAdminSpy.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized access",
    });

    await expect(listMembersService("user-id")).rejects.toMatchObject({
      statusCode: 401,
    });

    expect(findSpy).not.toHaveBeenCalled();
  });

  it("should decrypt identification.numberType for each member", async () => {
    await listMembersService("admin-id");

    expect(decryptSpy).toHaveBeenCalledTimes(mockMembers.length);
    expect(decryptSpy).toHaveBeenCalledWith("ENC:encrypted-1");
    expect(decryptSpy).toHaveBeenCalledWith("ENC:encrypted-2");
  });

  it("should return members with decrypted CPF", async () => {
    const result = await listMembersService("admin-id");

    expect(result[0].identification.numberType).toBe(
      "decrypted:ENC:encrypted-1",
    );
    expect(result[1].identification.numberType).toBe(
      "decrypted:ENC:encrypted-2",
    );
  });

  it("should return empty array when there are no members", async () => {
    findSpy.mockResolvedValue([]);

    const result = await listMembersService("admin-id");

    expect(result).toHaveLength(0);
    expect(decryptSpy).not.toHaveBeenCalled();
  });
});
