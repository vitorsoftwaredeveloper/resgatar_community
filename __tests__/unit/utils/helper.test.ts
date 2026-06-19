import { parseDateBRToUTC, formatUTCToDateBR, decodeToken } from "../../../src/utils/helper";
import jwt from "jsonwebtoken";

describe("parseDateBRToUTC", () => {
  it("should convert DD/MM/YYYY to UTC timestamp", () => {
    const ts = parseDateBRToUTC("01/01/2000");
    expect(ts).toBe(Date.UTC(2000, 0, 1));
  });

  it("should throw on invalid date string", () => {
    expect(() => parseDateBRToUTC("")).toThrow("Data inválida");
    expect(() => parseDateBRToUTC("invalid")).toThrow("Data inválida");
  });

  it("should handle last day of year", () => {
    const ts = parseDateBRToUTC("31/12/2024");
    expect(ts).toBe(Date.UTC(2024, 11, 31));
  });
});

describe("formatUTCToDateBR", () => {
  it("should format UTC timestamp to DD/MM/YYYY", () => {
    const ts = Date.UTC(2000, 0, 1);
    expect(formatUTCToDateBR(ts)).toBe("01/01/2000");
  });

  it("should be the inverse of parseDateBRToUTC", () => {
    const original = "15/06/2023";
    const ts = parseDateBRToUTC(original);
    expect(formatUTCToDateBR(ts)).toBe(original);
  });
});

describe("decodeToken", () => {
  it("should decode a valid JWT and return its payload", () => {
    const payload = { sub: "user-123", username: "test@email.com" };
    const token = jwt.sign(payload, "secret");

    const result = decodeToken(`Bearer ${token}`);
    expect(result.sub).toBe("user-123");
  });

  it("should strip Bearer prefix before decoding", () => {
    const payload = { sub: "abc" };
    const token = jwt.sign(payload, "secret");

    const withBearer = decodeToken(`Bearer ${token}`);
    const withoutBearer = decodeToken(token);

    expect(withBearer.sub).toBe(withoutBearer.sub);
  });
});
