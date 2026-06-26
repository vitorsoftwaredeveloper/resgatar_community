import * as helperService from "../../../../src/services/helper";
import * as s3Util from "../../../../src/utils/s3";
import { ExpenseModel } from "../../../../src/models/Expense";
import { getReceiptViewUrlService } from "../../../../src/services/expenses/getReceiptViewUrl";

describe("getReceiptViewUrlService (integration)", () => {
  let verifyAdminSpy: jest.SpyInstance;
  let findByIdSpy: jest.SpyInstance;
  let generateSpy: jest.SpyInstance;

  beforeEach(() => {
    verifyAdminSpy = jest
      .spyOn(helperService, "verifyAdmin")
      .mockResolvedValue(undefined);

    findByIdSpy = jest.spyOn(ExpenseModel, "findById").mockResolvedValue({
      _id: "expense-id",
      receiptKey: "receipts/admin-id/abc.jpg",
    } as any);

    generateSpy = jest
      .spyOn(s3Util, "generateReceiptViewUrl")
      .mockResolvedValue("https://signed-get-url");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should require admin access", async () => {
    await getReceiptViewUrlService("admin-id", "expense-id");

    expect(verifyAdminSpy).toHaveBeenCalledWith("admin-id");
  });

  it("should return the presigned url for the stored receipt key", async () => {
    const url = await getReceiptViewUrlService("admin-id", "expense-id");

    expect(generateSpy).toHaveBeenCalledWith("receipts/admin-id/abc.jpg");
    expect(url).toBe("https://signed-get-url");
  });

  it("should throw 404 when the expense does not exist", async () => {
    findByIdSpy.mockResolvedValue(null);

    await expect(
      getReceiptViewUrlService("admin-id", "missing"),
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(generateSpy).not.toHaveBeenCalled();
  });

  it("should throw 404 when the expense has no receipt", async () => {
    findByIdSpy.mockResolvedValue({ _id: "expense-id" } as any);

    await expect(
      getReceiptViewUrlService("admin-id", "expense-id"),
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(generateSpy).not.toHaveBeenCalled();
  });
});
