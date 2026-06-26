import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as getReceiptViewUrlServiceModule from "../../../../src/services/expenses/getReceiptViewUrl";
import { execute } from "../../../../src/handlers/expenses/getReceiptViewUrl";

function buildEvent(
  expenseId?: string,
  token = "Bearer valid.token",
): APIGatewayEvent {
  return {
    headers: { authorization: token },
    pathParameters: expenseId ? { expenseId } : null,
  } as any;
}

describe("getReceiptViewUrl handler (integration)", () => {
  let serviceSpy: jest.SpyInstance;

  beforeEach(() => {
    jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "admin-id" } as any);

    serviceSpy = jest
      .spyOn(getReceiptViewUrlServiceModule, "getReceiptViewUrlService")
      .mockResolvedValue("https://signed-get-url");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 200 with the view url on success", async () => {
    const result = await execute(buildEvent("expense-id"));

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.data.viewUrl).toBe("https://signed-get-url");
  });

  it("should pass adminId and expenseId to the service", async () => {
    await execute(buildEvent("expense-id"));

    expect(serviceSpy).toHaveBeenCalledWith("admin-id", "expense-id");
  });

  it("should return 400 when expenseId is missing", async () => {
    const result = await execute(buildEvent(undefined));

    expect(result.statusCode).toBe(400);
    expect(serviceSpy).not.toHaveBeenCalled();
  });

  it("should propagate the service 404 (expense or receipt not found)", async () => {
    serviceSpy.mockRejectedValue({
      statusCode: 404,
      message: "Despesa não possui recibo.",
    });

    const result = await execute(buildEvent("expense-id"));

    expect(result.statusCode).toBe(404);
  });
});
