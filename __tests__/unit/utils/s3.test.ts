import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  buildReceiptKey,
  generateReceiptUploadUrl,
  generateReceiptViewUrl,
  deleteReceipt,
  isAllowedReceiptContentType,
  isReceiptOwnedByAdmin,
} from "../../../src/utils/s3";

jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(),
}));

const getSignedUrlMock = getSignedUrl as jest.Mock;

const BUCKET = "resgatar-community-receipts-test";

beforeEach(() => {
  process.env.RECEIPTS_BUCKET_NAME = BUCKET;
  process.env.REGION = "us-east-1";
});

afterEach(() => {
  delete process.env.RECEIPTS_BUCKET_NAME;
  delete process.env.REGION;
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe("isAllowedReceiptContentType", () => {
  it("should accept the allowed content types", () => {
    expect(isAllowedReceiptContentType("image/jpeg")).toBe(true);
    expect(isAllowedReceiptContentType("image/png")).toBe(true);
    expect(isAllowedReceiptContentType("image/webp")).toBe(true);
    expect(isAllowedReceiptContentType("application/pdf")).toBe(true);
  });

  it("should reject content types outside the allowlist", () => {
    expect(isAllowedReceiptContentType("image/gif")).toBe(false);
    expect(isAllowedReceiptContentType("text/html")).toBe(false);
    expect(isAllowedReceiptContentType("")).toBe(false);
  });
});

describe("isReceiptOwnedByAdmin", () => {
  it("should return true when the key is under the admin prefix", () => {
    expect(
      isReceiptOwnedByAdmin("receipts/admin-1/abc.jpg", "admin-1"),
    ).toBe(true);
  });

  it("should return false for another admin prefix", () => {
    expect(
      isReceiptOwnedByAdmin("receipts/admin-2/abc.jpg", "admin-1"),
    ).toBe(false);
  });

  it("should return false when the prefix is missing", () => {
    expect(isReceiptOwnedByAdmin("abc.jpg", "admin-1")).toBe(false);
    expect(isReceiptOwnedByAdmin("other/admin-1/abc.jpg", "admin-1")).toBe(
      false,
    );
  });
});

describe("buildReceiptKey", () => {
  it("should build a key under receipts/<adminId>/ with the right extension", () => {
    const key = buildReceiptKey("admin-1", "image/jpeg");
    expect(key).toMatch(/^receipts\/admin-1\/[0-9a-f-]+\.jpg$/);
  });

  it("should map each content type to its extension", () => {
    expect(buildReceiptKey("a", "image/png")).toMatch(/\.png$/);
    expect(buildReceiptKey("a", "image/webp")).toMatch(/\.webp$/);
    expect(buildReceiptKey("a", "application/pdf")).toMatch(/\.pdf$/);
  });

  it("should generate unique keys on each call", () => {
    const first = buildReceiptKey("admin-1", "image/jpeg");
    const second = buildReceiptKey("admin-1", "image/jpeg");
    expect(first).not.toBe(second);
  });
});

describe("generateReceiptUploadUrl", () => {
  it("should return a presigned url and the key", async () => {
    getSignedUrlMock.mockResolvedValue("https://signed-put-url");

    const result = await generateReceiptUploadUrl("admin-1", "image/jpeg");

    expect(result.uploadUrl).toBe("https://signed-put-url");
    expect(result.key).toMatch(/^receipts\/admin-1\/[0-9a-f-]+\.jpg$/);
  });

  it("should sign a PutObjectCommand with bucket, key and content type", async () => {
    getSignedUrlMock.mockResolvedValue("https://signed-put-url");

    const { key } = await generateReceiptUploadUrl("admin-1", "application/pdf");

    const [, command] = getSignedUrlMock.mock.calls[0];
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect((command as any).input).toMatchObject({
      Bucket: BUCKET,
      Key: key,
      ContentType: "application/pdf",
    });
  });

  it("should throw when the bucket env var is not set", async () => {
    delete process.env.RECEIPTS_BUCKET_NAME;

    await expect(
      generateReceiptUploadUrl("admin-1", "image/jpeg"),
    ).rejects.toThrow("RECEIPTS_BUCKET_NAME");
  });

  it("should propagate signing errors", async () => {
    getSignedUrlMock.mockRejectedValue(new Error("sign failed"));

    await expect(
      generateReceiptUploadUrl("admin-1", "image/jpeg"),
    ).rejects.toThrow("sign failed");
  });
});

describe("generateReceiptViewUrl", () => {
  it("should return a presigned GET url", async () => {
    getSignedUrlMock.mockResolvedValue("https://signed-get-url");

    const url = await generateReceiptViewUrl("receipts/admin-1/abc.jpg");

    expect(url).toBe("https://signed-get-url");
  });

  it("should sign a GetObjectCommand with bucket and key", async () => {
    getSignedUrlMock.mockResolvedValue("https://signed-get-url");

    await generateReceiptViewUrl("receipts/admin-1/abc.jpg");

    const [, command] = getSignedUrlMock.mock.calls[0];
    expect(command).toBeInstanceOf(GetObjectCommand);
    expect((command as any).input).toMatchObject({
      Bucket: BUCKET,
      Key: "receipts/admin-1/abc.jpg",
    });
  });
});

describe("deleteReceipt", () => {
  it("should send a DeleteObjectCommand with bucket and key", async () => {
    const sendSpy = jest
      .spyOn(S3Client.prototype, "send")
      .mockResolvedValue({} as never);

    await deleteReceipt("receipts/admin-1/abc.jpg");

    const command = sendSpy.mock.calls[0][0];
    expect(command).toBeInstanceOf(DeleteObjectCommand);
    expect((command as any).input).toMatchObject({
      Bucket: BUCKET,
      Key: "receipts/admin-1/abc.jpg",
    });
  });

  it("should propagate delete errors", async () => {
    jest
      .spyOn(S3Client.prototype, "send")
      .mockRejectedValue(new Error("delete failed") as never);

    await expect(deleteReceipt("receipts/admin-1/abc.jpg")).rejects.toThrow(
      "delete failed",
    );
  });
});
