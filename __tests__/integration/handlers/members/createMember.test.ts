import { APIGatewayEvent } from "aws-lambda";
import * as createMemberServiceModule from "../../../../src/services/members/createMember";
import { execute } from "../../../../src/handlers/members/createMember";
import { MAX_PROFILE_IMAGE_LENGTH } from "../../../../src/constants/members";

// CPF válido (dígito verificador correto) e domínio não descartável
const validPayload = {
  email: "joao@gmail.com",
  password: "Senha@123",
  phoneNumber: "11999999999",
  firstName: "João",
  lastName: "Silva",
  dateOfBirth: 946684800000,
  role: "user",
  paymentInfo: { datePayment: 5, amount: "50,00" },
  identification: { type: "CPF", numberType: "52998224725" },
};

function buildEvent(body: any): APIGatewayEvent {
  return {
    body: JSON.stringify(body),
    headers: {},
  } as any;
}

describe("createMember handler (integration)", () => {
  let createMemberServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    createMemberServiceSpy = jest
      .spyOn(createMemberServiceModule, "createMemberService")
      .mockResolvedValue("new-member-id");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 201 and member id on success", async () => {
    const result = await execute(buildEvent(validPayload));

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.data._id).toBe("new-member-id");
  });

  it("should call createMemberService with the payload", async () => {
    await execute(buildEvent(validPayload));

    expect(createMemberServiceSpy).toHaveBeenCalledWith(
      expect.objectContaining({ email: validPayload.email }),
    );
  });

  it("should return 400 when email format is invalid", async () => {
    const result = await execute(buildEvent({ ...validPayload, email: "not-an-email" }));

    expect(result.statusCode).toBe(400);
    expect(createMemberServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when email domain is disposable", async () => {
    const result = await execute(buildEvent({ ...validPayload, email: "joao@mailinator.com" }));

    expect(result.statusCode).toBe(400);
    expect(createMemberServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when CPF is invalid", async () => {
    const result = await execute(
      buildEvent({ ...validPayload, identification: { type: "CPF", numberType: "12345678900" } }),
    );

    expect(result.statusCode).toBe(400);
    expect(createMemberServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when password is too weak", async () => {
    const result = await execute(buildEvent({ ...validPayload, password: "fraca" }));

    expect(result.statusCode).toBe(400);
    expect(createMemberServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when password has no special character", async () => {
    const result = await execute(buildEvent({ ...validPayload, password: "SenhaForte1" }));

    expect(result.statusCode).toBe(400);
    expect(createMemberServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when phoneNumber has fewer than 10 digits", async () => {
    const result = await execute(buildEvent({ ...validPayload, phoneNumber: "123456789" }));

    expect(result.statusCode).toBe(400);
    expect(createMemberServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when required field is missing", async () => {
    const { email, ...withoutEmail } = validPayload;
    const result = await execute(buildEvent(withoutEmail));

    expect(result.statusCode).toBe(400);
  });

  it("should accept a profileImage and forward it to the service", async () => {
    const profileImage = "data:image/png;base64,AAAA";
    await execute(buildEvent({ ...validPayload, profileImage }));

    expect(createMemberServiceSpy).toHaveBeenCalledWith(
      expect.objectContaining({ profileImage }),
    );
  });

  it("should return 400 when profileImage exceeds the max length", async () => {
    const tooLong = "a".repeat(MAX_PROFILE_IMAGE_LENGTH + 1);
    const result = await execute(buildEvent({ ...validPayload, profileImage: tooLong }));

    expect(result.statusCode).toBe(400);
    expect(createMemberServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 500 when service throws unexpected error", async () => {
    createMemberServiceSpy.mockRejectedValue(new Error("Unexpected"));
    const result = await execute(buildEvent(validPayload));

    expect(result.statusCode).toBe(500);
  });

  it("should return service statusCode when service throws with statusCode", async () => {
    createMemberServiceSpy.mockRejectedValue({
      statusCode: 409,
      message: "Member with this email already exists.",
    });
    const result = await execute(buildEvent(validPayload));

    expect(result.statusCode).toBe(409);
  });

  it("should return 500 when body is null", async () => {
    const result = await execute({ body: null, headers: {} } as any);

    expect(result.statusCode).toBe(500);
  });
});
