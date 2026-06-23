import {
  validateEmailDomain,
  validateCPF,
  validateCNPJ,
  validateDocument,
} from "../../../src/utils/validators";

describe("validateEmailDomain", () => {
  it("should return true for common valid domains", () => {
    expect(validateEmailDomain("user@gmail.com")).toBe(true);
    expect(validateEmailDomain("user@hotmail.com")).toBe(true);
    expect(validateEmailDomain("user@company.com.br")).toBe(true);
    expect(validateEmailDomain("user@outlook.com")).toBe(true);
  });

  it("should return false for disposable email domains", () => {
    expect(validateEmailDomain("user@mailinator.com")).toBe(false);
    expect(validateEmailDomain("user@tempmail.com")).toBe(false);
    expect(validateEmailDomain("user@yopmail.com")).toBe(false);
    expect(validateEmailDomain("user@10minutemail.com")).toBe(false);
    expect(validateEmailDomain("user@guerrillamail.com")).toBe(false);
    expect(validateEmailDomain("user@trashmail.com")).toBe(false);
  });

  it("should return false for reserved/test domains", () => {
    expect(validateEmailDomain("user@example.com")).toBe(false);
    expect(validateEmailDomain("user@test.com")).toBe(false);
    expect(validateEmailDomain("user@localhost.com")).toBe(false);
    expect(validateEmailDomain("user@teste.com")).toBe(false);
  });

  it("should return false when email has no @", () => {
    expect(validateEmailDomain("notanemail")).toBe(false);
  });

  it("should return false when email has multiple @", () => {
    expect(validateEmailDomain("user@@gmail.com")).toBe(false);
  });

  it("should return false when domain is empty", () => {
    expect(validateEmailDomain("user@")).toBe(false);
  });

  it("should be case-insensitive", () => {
    expect(validateEmailDomain("USER@GMAIL.COM")).toBe(true);
    expect(validateEmailDomain("User@Mailinator.COM")).toBe(false);
  });

  it("should return false for domain without TLD", () => {
    expect(validateEmailDomain("user@domain")).toBe(false);
  });
});

describe("validateCPF", () => {
  it("should return true for valid CPFs", () => {
    expect(validateCPF("52998224725")).toBe(true);
    expect(validateCPF("11144477735")).toBe(true);
  });

  it("should return false when all digits are the same", () => {
    expect(validateCPF("00000000000")).toBe(false);
    expect(validateCPF("11111111111")).toBe(false);
    expect(validateCPF("99999999999")).toBe(false);
  });

  it("should return false for wrong length", () => {
    expect(validateCPF("1234567890")).toBe(false);
    expect(validateCPF("123456789012")).toBe(false);
  });

  it("should return false for invalid first check digit", () => {
    expect(validateCPF("52998224715")).toBe(false);
  });

  it("should return false for invalid second check digit", () => {
    expect(validateCPF("52998224724")).toBe(false);
  });
});

describe("validateCNPJ", () => {
  it("should return true for valid CNPJs", () => {
    expect(validateCNPJ("11222333000181")).toBe(true);
    expect(validateCNPJ("33000167000101")).toBe(true);
  });

  it("should return false when all digits are the same", () => {
    expect(validateCNPJ("00000000000000")).toBe(false);
    expect(validateCNPJ("11111111111111")).toBe(false);
  });

  it("should return false for wrong length", () => {
    expect(validateCNPJ("1122233300018")).toBe(false);
    expect(validateCNPJ("112223330001811")).toBe(false);
  });

  it("should return false for invalid first check digit", () => {
    expect(validateCNPJ("11222333000191")).toBe(false);
  });

  it("should return false for invalid second check digit", () => {
    expect(validateCNPJ("11222333000182")).toBe(false);
  });
});

describe("validateDocument", () => {
  it("should delegate to validateCPF when type is CPF", () => {
    expect(validateDocument("CPF", "52998224725")).toBe(true);
    expect(validateDocument("CPF", "52998224726")).toBe(false);
  });

  it("should delegate to validateCNPJ when type is CNPJ", () => {
    expect(validateDocument("CNPJ", "11222333000181")).toBe(true);
    expect(validateDocument("CNPJ", "11222333000182")).toBe(false);
  });
});
