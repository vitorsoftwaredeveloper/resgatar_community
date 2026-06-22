import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as editMemberServiceModule from "../../../../src/services/members/editMember";
import { execute } from "../../../../src/handlers/members/editMember";
import { MAX_PROFILE_IMAGE_LENGTH } from "../../../../src/constants/members";

const validPayload = {
  email: "novo@email.com",
  firstName: "João",
  lastName: "Silva",
  phoneNumber: "11999999999",
};

const mockUpdatedMember = { _id: "member-id-123", ...validPayload };

function buildEvent(body: any, token = "Bearer valid.token.here"): APIGatewayEvent {
  return {
    body: JSON.stringify(body),
    headers: { authorization: token },
  } as any;
}

describe("editMember handler (integration)", () => {
  let decodeTokenSpy: jest.SpyInstance;
  let editMemberServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    decodeTokenSpy = jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "member-id-123" } as any);

    editMemberServiceSpy = jest
      .spyOn(editMemberServiceModule, "editMemberService")
      .mockResolvedValue(mockUpdatedMember as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 204 and updated member on success", async () => {
    const result = await execute(buildEvent(validPayload));

    expect(result.statusCode).toBe(204);
    const body = JSON.parse(result.body);
    expect(body.data._id).toBe("member-id-123");
  });

  it("should call editMemberService with member sub and payload", async () => {
    await execute(buildEvent(validPayload));

    expect(editMemberServiceSpy).toHaveBeenCalledWith(
      "member-id-123",
      expect.objectContaining({ email: validPayload.email })
    );
  });

  it("should throw 400 when email format is invalid", async () => {
    await expect(
      execute(buildEvent({ ...validPayload, email: "not-an-email" }))
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(editMemberServiceSpy).not.toHaveBeenCalled();
  });

  it("should throw 400 when identification has invalid numberType", async () => {
    await expect(
      execute(buildEvent({ identification: { type: "CPF", numberType: "ABC" } }))
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(editMemberServiceSpy).not.toHaveBeenCalled();
  });

  it("should throw 400 when paymentInfo amount has invalid format", async () => {
    await expect(
      execute(buildEvent({ paymentInfo: { datePayment: 5, amount: "50.00" } }))
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("should throw 400 when additional properties are sent", async () => {
    await expect(
      execute(buildEvent({ ...validPayload, unknown: "field" }))
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("should allow partial update with only one field", async () => {
    const result = await execute(buildEvent({ firstName: "Novo" }));

    expect(result.statusCode).toBe(204);
    expect(editMemberServiceSpy).toHaveBeenCalledWith(
      "member-id-123",
      expect.objectContaining({ firstName: "Novo" })
    );
  });

  it("should accept a profileImage update and forward it to the service", async () => {
    const profileImage = "data:image/png;base64,AAAA";
    const result = await execute(buildEvent({ profileImage }));

    expect(result.statusCode).toBe(204);
    expect(editMemberServiceSpy).toHaveBeenCalledWith(
      "member-id-123",
      expect.objectContaining({ profileImage })
    );
  });

  it("should throw 400 when profileImage exceeds the max length", async () => {
    const tooLong = "a".repeat(MAX_PROFILE_IMAGE_LENGTH + 1);

    await expect(
      execute(buildEvent({ profileImage: tooLong }))
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(editMemberServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 404 when member is not found", async () => {
    editMemberServiceSpy.mockRejectedValue({ statusCode: 404, message: "Member not found" });

    const result = await execute(buildEvent(validPayload));

    expect(result.statusCode).toBe(404);
  });

  it("should return 500 when service throws unexpected error", async () => {
    editMemberServiceSpy.mockRejectedValue(new Error("Unexpected"));

    const result = await execute(buildEvent(validPayload));

    expect(result.statusCode).toBe(500);
  });
});
