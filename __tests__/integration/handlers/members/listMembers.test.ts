import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as listMembersServiceModule from "../../../../src/services/members/listMembers";
import { execute } from "../../../../src/handlers/members/listMembers";

const mockMembers = [
  { _id: "member-1", firstName: "João", identification: { type: "CPF", numberType: "12345678900" } },
  { _id: "member-2", firstName: "Maria", identification: { type: "CPF", numberType: "98765432100" } },
];

function buildEvent(token = "Bearer valid.token.here"): APIGatewayEvent {
  return { headers: { authorization: token } } as any;
}

describe("listMembers handler (integration)", () => {
  let decodeTokenSpy: jest.SpyInstance;
  let listMembersServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    decodeTokenSpy = jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "admin-id-123" } as any);

    listMembersServiceSpy = jest
      .spyOn(listMembersServiceModule, "listMembersService")
      .mockResolvedValue(mockMembers as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 200 and members list on success", async () => {
    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.data).toHaveLength(2);
  });

  it("should call listMembersService with admin sub", async () => {
    await execute(buildEvent());

    expect(listMembersServiceSpy).toHaveBeenCalledWith("admin-id-123");
  });

  it("should return empty array when there are no members", async () => {
    listMembersServiceSpy.mockResolvedValue([]);

    const result = await execute(buildEvent());

    const body = JSON.parse(result.body);
    expect(body.data).toHaveLength(0);
  });

  it("should return 401 when caller is not admin", async () => {
    listMembersServiceSpy.mockRejectedValue({ statusCode: 401, message: "Unauthorized access" });

    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(401);
  });

  it("should return 500 when service throws unexpected error", async () => {
    listMembersServiceSpy.mockRejectedValue(new Error("Unexpected"));

    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(500);
  });
});
