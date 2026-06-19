import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as createNewContributionByYearServiceModule from "../../../../src/services/contributions/createNewContributionByYear";
import { execute } from "../../../../src/handlers/contributions/createNewContributionByYear";

function buildEvent(body: any, token = "Bearer valid.token.here"): APIGatewayEvent {
  return {
    body: JSON.stringify(body),
    headers: { authorization: token },
  } as any;
}

describe("createNewContributionByYear handler (integration)", () => {
  let decodeTokenSpy: jest.SpyInstance;
  let createNewContributionByYearServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    decodeTokenSpy = jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "admin-id-123" } as any);

    createNewContributionByYearServiceSpy = jest
      .spyOn(createNewContributionByYearServiceModule, "createNewContributionByYearService")
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 204 on success", async () => {
    const result = await execute(buildEvent({ year: 2025 }));

    expect(result.statusCode).toBe(204);
  });

  it("should call service with admin sub and year", async () => {
    await execute(buildEvent({ year: 2025 }));

    expect(createNewContributionByYearServiceSpy).toHaveBeenCalledWith("admin-id-123", 2025);
  });

  it("should return 400 when year is missing", async () => {
    const result = await execute(buildEvent({}));

    expect(result.statusCode).toBe(400);
    expect(createNewContributionByYearServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when year is not a number", async () => {
    const result = await execute(buildEvent({ year: "dois-mil-e-vinte-cinco" }));

    expect(result.statusCode).toBe(400);
    expect(createNewContributionByYearServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when additional properties are sent", async () => {
    const result = await execute(buildEvent({ year: 2025, extra: "field" }));

    expect(result.statusCode).toBe(400);
    expect(createNewContributionByYearServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 401 when service throws Unauthorized", async () => {
    createNewContributionByYearServiceSpy.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized access",
    });

    const result = await execute(buildEvent({ year: 2025 }));

    expect(result.statusCode).toBe(401);
  });

  it("should return 500 when service throws unexpected error", async () => {
    createNewContributionByYearServiceSpy.mockRejectedValue(new Error("Unexpected"));

    const result = await execute(buildEvent({ year: 2025 }));

    expect(result.statusCode).toBe(500);
  });

  it("should return 400 when body is null", async () => {
    const event = { body: null, headers: { authorization: "Bearer token" } } as any;
    const result = await execute(event);

    expect(result.statusCode).toBe(400);
    expect(createNewContributionByYearServiceSpy).not.toHaveBeenCalled();
  });
});
