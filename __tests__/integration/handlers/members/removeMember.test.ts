import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as removeMemberServiceModule from "../../../../src/services/members/removeMember";
import { execute } from "../../../../src/handlers/members/removeMember";

function buildEvent(memberId: string | undefined, token = "Bearer valid.token.here"): APIGatewayEvent {
  return {
    headers: { authorization: token },
    pathParameters: memberId ? { memberId } : null,
  } as any;
}

describe("removeMember handler (integration)", () => {
  let decodeTokenSpy: jest.SpyInstance;
  let removeMemberServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    decodeTokenSpy = jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "admin-id-123" } as any);

    removeMemberServiceSpy = jest
      .spyOn(removeMemberServiceModule, "removeMemberService")
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 204 on successful removal", async () => {
    const result = await execute(buildEvent("member-to-remove"));

    expect(result.statusCode).toBe(204);
  });

  it("should call removeMemberService with admin sub and target memberId", async () => {
    await execute(buildEvent("member-to-remove"));

    expect(removeMemberServiceSpy).toHaveBeenCalledWith("admin-id-123", "member-to-remove");
  });

  it("should throw when memberId is not in path parameters", async () => {
    await expect(execute(buildEvent(undefined))).rejects.toMatchObject({
      statusCode: 400,
      message: "Member Id is required",
    });
  });

  it("should return 401 when caller is not admin", async () => {
    removeMemberServiceSpy.mockRejectedValue({ statusCode: 401, message: "Unauthorized access" });

    const result = await execute(buildEvent("member-to-remove"));

    expect(result.statusCode).toBe(401);
  });

  it("should return 404 when member to remove is not found", async () => {
    removeMemberServiceSpy.mockRejectedValue({ statusCode: 404, message: "Member not found" });

    const result = await execute(buildEvent("unknown-member"));

    expect(result.statusCode).toBe(404);
  });

  it("should return 500 when service throws unexpected error", async () => {
    removeMemberServiceSpy.mockRejectedValue(new Error("Unexpected"));

    const result = await execute(buildEvent("member-to-remove"));

    expect(result.statusCode).toBe(500);
  });
});
