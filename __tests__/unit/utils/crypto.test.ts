import { encrypt, decrypt, isEncrypted } from "../../../src/utils/crypto";

const VALID_KEY = "a".repeat(64); // 64 hex chars = 32 bytes

beforeEach(() => {
  process.env.ENCRYPTION_KEY = VALID_KEY;
});

afterEach(() => {
  delete process.env.ENCRYPTION_KEY;
});

describe("crypto", () => {
  describe("encrypt", () => {
    it("should return a string with ENC: prefix", () => {
      const result = encrypt("hello");
      expect(result.startsWith("ENC:")).toBe(true);
    });

    it("should produce different ciphertext on each call (random IV)", () => {
      const a = encrypt("hello");
      const b = encrypt("hello");
      expect(a).not.toBe(b);
    });

    it("should throw if ENCRYPTION_KEY is missing", () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => encrypt("hello")).toThrow("ENCRYPTION_KEY");
    });

    it("should throw if ENCRYPTION_KEY has wrong length", () => {
      process.env.ENCRYPTION_KEY = "abc";
      expect(() => encrypt("hello")).toThrow("64-character");
    });
  });

  describe("decrypt", () => {
    it("should decrypt what encrypt produced", () => {
      const plaintext = "dados sensiveis";
      const ciphertext = encrypt(plaintext);
      expect(decrypt(ciphertext)).toBe(plaintext);
    });

    it("should return the original value when not prefixed with ENC:", () => {
      expect(decrypt("plain text")).toBe("plain text");
    });

    it("should throw on malformed ENC: value", () => {
      expect(() => decrypt("ENC:invalido")).toThrow();
    });
  });

  describe("isEncrypted", () => {
    it("should return true for encrypted values", () => {
      expect(isEncrypted(encrypt("x"))).toBe(true);
    });

    it("should return false for plain values", () => {
      expect(isEncrypted("plain")).toBe(false);
    });
  });

  describe("round-trip with special characters", () => {
    it.each(["João & Maria", "123.456.789-00", "🔒 secret"])(
      "should round-trip: %s",
      (value) => {
        expect(decrypt(encrypt(value))).toBe(value);
      }
    );
  });
});
