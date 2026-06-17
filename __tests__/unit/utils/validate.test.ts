import { validate, parseRequestBody } from "../../../src/utils/validate";
import { JSONSchemaType } from "ajv";

interface TestData {
  name: string;
  age: number;
}

const schema: JSONSchemaType<TestData> = {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" },
  },
  required: ["name", "age"],
  additionalProperties: false,
};

describe("validate", () => {
  it("should return empty array for valid data", () => {
    const errors = validate(schema, { name: "João", age: 30 });
    expect(errors).toHaveLength(0);
  });

  it("should return errors for missing required field", () => {
    const errors = validate(schema, { name: "João" });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should return errors for wrong type", () => {
    const errors = validate(schema, { name: "João", age: "trinta" });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should return errors for additional properties", () => {
    const errors = validate(schema, { name: "João", age: 30, extra: true });
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe("parseRequestBody", () => {
  it("should parse valid JSON string", () => {
    const result = parseRequestBody('{"name":"João","age":30}');
    expect(result).toEqual({ name: "João", age: 30 });
  });

  it("should return null when body is null", () => {
    expect(parseRequestBody(null)).toBeNull();
  });

  it("should throw on invalid JSON", () => {
    expect(() => parseRequestBody("not json")).toThrow();
  });
});
