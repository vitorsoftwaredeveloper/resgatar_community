import Ajv, { JSONSchemaType } from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

function validate<T>(schema: JSONSchemaType<T>, data: unknown) {
  console.log("IN - validate");
  const validateFn = ajv.compile<T>(schema);
  validateFn(data);

  console.log("OUT - validate");
  return validateFn.errors ?? [];
}

const parseRequestBody = (body: string | null): any | null => {
  console.log("IN - parseRequestBody");

  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - parseRequestBody");
  }
};

export { validate, parseRequestBody };
