import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as listBirthdayMembersServiceModule from "../../../../src/services/members/listBirthdayMembers";
import { execute } from "../../../../src/handlers/members/listBirthdayMembers";

const mockMembers = [
  { _id: "m1", firstName: "Ana", lastName: "Lima", dateOfBirth: "946684800000" },
  { _id: "m2", firstName: "Carlos", lastName: "Melo", dateOfBirth: "946598400000" },
];

function buildEvent(): APIGatewayEvent {
  return { headers: { authorization: "Bearer valid.token.here" } } as any;
}

describe("listBirthdayMembers handler (integration)", () => {
  let listBirthdayMembersServiceSpy: jest.SpyInstance;
  let decodeTokenSpy: jest.SpyInstance;

  beforeEach(() => {
    decodeTokenSpy = jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "member-id-123" } as any);

    listBirthdayMembersServiceSpy = jest
      .spyOn(listBirthdayMembersServiceModule, "listBirthdayMembersService")
      .mockResolvedValue(mockMembers as any);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should return 200 with birthday members list", async () => {
    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.data).toHaveLength(2);
  });

  it("should call listBirthdayMembersService with the caller id", async () => {
    await execute(buildEvent());

    expect(listBirthdayMembersServiceSpy).toHaveBeenCalledWith("member-id-123");
  });

  it("should decode the authorization header", async () => {
    await execute(buildEvent());

    expect(decodeTokenSpy).toHaveBeenCalledWith("Bearer valid.token.here");
  });

  it("should return 200 with empty array when no birthday members", async () => {
    listBirthdayMembersServiceSpy.mockResolvedValue([]);

    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.data).toHaveLength(0);
  });

  it("should propagate statusCode from service error", async () => {
    listBirthdayMembersServiceSpy.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized access",
    });

    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(401);
  });

  it("should return 500 when service throws unexpected error", async () => {
    listBirthdayMembersServiceSpy.mockRejectedValue(new Error("Unexpected"));

    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(500);
  });
});
