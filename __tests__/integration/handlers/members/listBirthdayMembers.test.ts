import { APIGatewayEvent } from "aws-lambda";
import * as listBirthdayMembersServiceModule from "../../../../src/services/members/listBirthdayMembers";
import { execute } from "../../../../src/handlers/members/listBirthdayMembers";

const mockMembers = [
  { _id: "m1", firstName: "Ana", lastName: "Lima", dateOfBirth: "946684800000" },
  { _id: "m2", firstName: "Carlos", lastName: "Melo", dateOfBirth: "946598400000" },
];

function buildEvent(): APIGatewayEvent {
  return {} as any;
}

describe("listBirthdayMembers handler (integration)", () => {
  let listBirthdayMembersServiceSpy: jest.SpyInstance;

  beforeEach(() => {
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

  it("should call listBirthdayMembersService", async () => {
    await execute(buildEvent());

    expect(listBirthdayMembersServiceSpy).toHaveBeenCalledTimes(1);
  });

  it("should return 200 with empty array when no birthday members", async () => {
    listBirthdayMembersServiceSpy.mockResolvedValue([]);

    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.data).toHaveLength(0);
  });

  it("should return error response when service throws", async () => {
    listBirthdayMembersServiceSpy.mockRejectedValue({
      statusCode: 500,
      message: "Internal error",
    });

    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(500);
  });
});
