import Ajv, { JSONSchemaType } from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

export function validate<T>(schema: JSONSchemaType<T>, data: unknown) {
  console.log("IN - validate");
  const validateFn = ajv.compile<T>(schema);
  validateFn(data);

  console.log("OUT - validate");
  return validateFn.errors ?? [];
}
