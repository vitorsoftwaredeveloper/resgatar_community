import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as getMemberServiceModule from "../../../../src/services/members/getMember";
import { execute } from "../../../../src/handlers/members/getMember";

const mockMember = {
  _id: "member-id-123",
  email: "joao@email.com",
  firstName: "João",
  lastName: "Silva",
  identification: { type: "CPF", numberType: "12345678900" },
  contributions: [{ year: 2025, months: { january: { paid: false } } }],
};

function buildEvent(token = "Bearer valid.token.here"): APIGatewayEvent {
  return { headers: { authorization: token } } as any;
}

describe("getMember handler (integration)", () => {
  let decodeTokenSpy: jest.SpyInstance;
  let getMemberServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    decodeTokenSpy = jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "member-id-123" } as any);

    getMemberServiceSpy = jest
      .spyOn(getMemberServiceModule, "getMemberService")
      .mockResolvedValue(mockMember as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 200 and member data on success", async () => {
    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.data._id).toBe("member-id-123");
  });

  it("should call getMemberService with token sub", async () => {
    await execute(buildEvent());

    expect(getMemberServiceSpy).toHaveBeenCalledWith("member-id-123");
  });

  it("should return contributions in response", async () => {
    const result = await execute(buildEvent());

    const body = JSON.parse(result.body);
    expect(body.data.contributions).toBeDefined();
  });

  it("should return 404 when member is not found", async () => {
    getMemberServiceSpy.mockRejectedValue({ statusCode: 404, message: "Member not found" });

    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(404);
  });

  it("should return 500 when service throws unexpected error", async () => {
    getMemberServiceSpy.mockRejectedValue(new Error("Unexpected"));

    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(500);
  });
});
