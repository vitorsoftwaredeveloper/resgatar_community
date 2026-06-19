import { sendErrorResponse, sendSuccessResponse } from "../../../src/utils/http";

describe("sendErrorResponse", () => {
  it("should use error.statusCode when present", () => {
    const result = sendErrorResponse({ statusCode: 404, message: "Not found" });
    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).message).toBe("Not found");
  });

  it("should fall back to error.status", () => {
    const result = sendErrorResponse({ status: 422, message: "Unprocessable" });
    expect(result.statusCode).toBe(422);
  });

  it("should default to 500 when no status provided", () => {
    const result = sendErrorResponse({});
    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toBe("Internal Server Error");
  });

  it("should include errors array when present", () => {
    const errors = [{ field: "email", message: "invalid" }];
    const result = sendErrorResponse({ statusCode: 400, message: "Validation Error", errors });
    const body = JSON.parse(result.body);
    expect(body.errors).toEqual(errors);
  });

  it("should include code when present", () => {
    const result = sendErrorResponse({ statusCode: 400, message: "Bad Request", code: "DUPLICATE" });
    const body = JSON.parse(result.body);
    expect(body.code).toBe("DUPLICATE");
  });

  it("should not include errors or code keys when absent", () => {
    const result = sendErrorResponse({ statusCode: 500, message: "Ops" });
    const body = JSON.parse(result.body);
    expect(body).not.toHaveProperty("errors");
    expect(body).not.toHaveProperty("code");
  });
});

describe("sendSuccessResponse", () => {
  it("should return correct statusCode and message", () => {
    const result = sendSuccessResponse("Created", 201);
    expect(result.statusCode).toBe(201);
    expect(JSON.parse(result.body).message).toBe("Created");
  });

  it("should include data when provided", () => {
    const result = sendSuccessResponse("OK", 200, { id: "abc" });
    const body = JSON.parse(result.body);
    expect(body.data).toEqual({ id: "abc" });
  });

  it("should not include data key when omitted", () => {
    const result = sendSuccessResponse("OK", 200);
    const body = JSON.parse(result.body);
    expect(body).not.toHaveProperty("data");
  });
});
