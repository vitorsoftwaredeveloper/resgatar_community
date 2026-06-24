import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as getMemberByIdServiceModule from "../../../../src/services/members/getMemberById";
import { execute } from "../../../../src/handlers/members/getMemberById";

const mockMember = {
  _id: "target-member-id",
  email: "joao@email.com",
  contributions: { year: 2026, months: { january: { paid: false } } },
};

function buildEvent(
  memberId: string | undefined = "target-member-id",
  token = "Bearer valid.token.here"
): APIGatewayEvent {
  return {
    headers: { authorization: token },
    pathParameters: memberId ? { memberId } : null,
  } as any;
}

describe("getMemberById handler (integration)", () => {
  let decodeTokenSpy: jest.SpyInstance;
  let getMemberByIdServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    decodeTokenSpy = jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "admin-id" } as any);

    getMemberByIdServiceSpy = jest
      .spyOn(getMemberByIdServiceModule, "getMemberByIdService")
      .mockResolvedValue(mockMember as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 200 and member data on success", async () => {
    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.data._id).toBe("target-member-id");
  });

  it("should call service with caller sub (admin) and path memberId", async () => {
    await execute(buildEvent("target-member-id"));

    expect(getMemberByIdServiceSpy).toHaveBeenCalledWith(
      "admin-id",
      "target-member-id"
    );
  });

  it("should return contributions in response", async () => {
    const result = await execute(buildEvent());

    const body = JSON.parse(result.body);
    expect(body.data.contributions).toBeDefined();
  });

  it("should return 400 when memberId path param is missing", async () => {
    const event = {
      headers: { authorization: "Bearer valid.token.here" },
      pathParameters: null,
    } as any;

    const result = await execute(event);

    expect(result.statusCode).toBe(400);
    expect(getMemberByIdServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 401 when caller is not an admin", async () => {
    getMemberByIdServiceSpy.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized access",
    });

    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(401);
  });

  it("should return 404 when member is not found", async () => {
    getMemberByIdServiceSpy.mockRejectedValue({
      statusCode: 404,
      message: "Member not found",
    });

    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(404);
  });

  it("should return 500 when service throws unexpected error", async () => {
    getMemberByIdServiceSpy.mockRejectedValue(new Error("Unexpected"));

    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(500);
  });
});
