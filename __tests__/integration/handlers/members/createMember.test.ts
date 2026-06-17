import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as validateUtil from "../../../../src/utils/validate";
import * as createMemberServiceModule from "../../../../src/services/members/createMember";
import { execute } from "../../../../src/handlers/members/createMember";

const validPayload = {
  email: "joao@email.com",
  password: "Senha@123",
  phoneNumber: "11999999999",
  firstName: "João",
  lastName: "Silva",
  dateOfBirth: 946684800000,
  role: "user",
  paymentInfo: { datePayment: 5, amount: "50,00" },
  identification: { type: "CPF", numberType: "12345678900" },
};

function buildEvent(body: any, token = "Bearer valid.token.here"): APIGatewayEvent {
  return {
    body: JSON.stringify(body),
    headers: { authorization: token },
  } as any;
}

describe("createMember handler (integration)", () => {
  let decodeTokenSpy: jest.SpyInstance;
  let createMemberServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    decodeTokenSpy = jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "admin-id-123" } as any);

    createMemberServiceSpy = jest
      .spyOn(createMemberServiceModule, "createMemberService")
      .mockResolvedValue("new-member-id");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 201 and member id on success", async () => {
    const event = buildEvent(validPayload);
    const result = await execute(event);

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.data._id).toBe("new-member-id");
  });

  it("should call createMemberService with admin sub and payload", async () => {
    const event = buildEvent(validPayload);
    await execute(event);

    expect(createMemberServiceSpy).toHaveBeenCalledWith(
      "admin-id-123",
      expect.objectContaining({ email: validPayload.email })
    );
  });

  it("should return 400 when payload fails validation", async () => {
    const invalidPayload = { ...validPayload, email: "not-an-email" };
    const event = buildEvent(invalidPayload);
    const result = await execute(event);

    expect(result.statusCode).toBe(400);
    expect(createMemberServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when required field is missing", async () => {
    const { email, ...withoutEmail } = validPayload;
    const event = buildEvent(withoutEmail);
    const result = await execute(event);

    expect(result.statusCode).toBe(400);
  });

  it("should return 500 when service throws unexpected error", async () => {
    createMemberServiceSpy.mockRejectedValue(new Error("Unexpected"));
    const event = buildEvent(validPayload);
    const result = await execute(event);

    expect(result.statusCode).toBe(500);
  });

  it("should return service statusCode when service throws with statusCode", async () => {
    createMemberServiceSpy.mockRejectedValue({
      statusCode: 409,
      message: "Member with this email already exists.",
    });
    const event = buildEvent(validPayload);
    const result = await execute(event);

    expect(result.statusCode).toBe(409);
  });

  it("should return 500 when body is null", async () => {
    const event = { body: null, headers: { authorization: "Bearer token" } } as any;
    const result = await execute(event);

    expect(result.statusCode).toBe(500);
  });
});
