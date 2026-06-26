import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as s3Util from "../../../../src/utils/s3";
import { execute } from "../../../../src/handlers/expenses/getReceiptUploadUrl";

function buildEvent(
  contentType?: string,
  token = "Bearer valid.token",
): APIGatewayEvent {
  return {
    headers: { authorization: token },
    queryStringParameters: contentType ? { contentType } : null,
  } as any;
}

describe("getReceiptUploadUrl handler (integration)", () => {
  let generateSpy: jest.SpyInstance;

  beforeEach(() => {
    jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "admin-id" } as any);

    generateSpy = jest
      .spyOn(s3Util, "generateReceiptUploadUrl")
      .mockResolvedValue({
        uploadUrl: "https://signed-put-url",
        key: "receipts/admin-id/abc.jpg",
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 200 with uploadUrl and key on success", async () => {
    const result = await execute(buildEvent("image/jpeg"));

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.data).toEqual({
      uploadUrl: "https://signed-put-url",
      key: "receipts/admin-id/abc.jpg",
    });
  });

  it("should pass adminId from the token and the content type to the util", async () => {
    await execute(buildEvent("application/pdf"));

    expect(generateSpy).toHaveBeenCalledWith("admin-id", "application/pdf");
  });

  it("should return 400 when contentType is missing", async () => {
    const result = await execute(buildEvent(undefined));

    expect(result.statusCode).toBe(400);
    expect(generateSpy).not.toHaveBeenCalled();
  });

  it("should return 400 for a content type outside the allowlist", async () => {
    const result = await execute(buildEvent("image/gif"));

    expect(result.statusCode).toBe(400);
    expect(generateSpy).not.toHaveBeenCalled();
  });

  it("should propagate the util error status code", async () => {
    generateSpy.mockRejectedValue({ statusCode: 500, message: "boom" });

    const result = await execute(buildEvent("image/png"));

    expect(result.statusCode).toBe(500);
  });
});
