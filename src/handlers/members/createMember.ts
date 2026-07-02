import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { parseRequestBody, validate } from "../../utils/validate";
import { createMemberSchema } from "./validation/createMemberSchema";
import { createMemberService } from "../../services/members/createMember";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { STATUS_CODE } from "../../constants";
import { validateDocument, validateEmailDomain } from "../../utils/validators";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("IN - createMember");

    const bodySize = Buffer.byteLength(event.body ?? "", "utf8");
    if (bodySize > 1_048_576) {
      throw { statusCode: 413, message: "Payload too large" };
    }

    const payload = parseRequestBody(event.body) as any;

    const { identification, ...rest } = payload;
    console.log("Payload:", JSON.stringify(rest));

    const errors = validate(createMemberSchema, payload);
    if (errors.length > 0) {
      throw {
        statusCode: 400,
        message: "Validation Error",
        errors,
      };
    }

    if (!validateEmailDomain(payload.email)) {
      throw {
        statusCode: 400,
        message: "Validation Error",
        errors: [{ field: "email", message: "Domínio de email não permitido" }],
      };
    }

    if (!validateDocument(identification.type, identification.numberType)) {
      throw {
        statusCode: 400,
        message: "Validation Error",
        errors: [{ field: "identification.numberType", message: "Documento inválido" }],
      };
    }

    const memberId = await createMemberService(payload);

    return sendSuccessResponse(
      "Member created successfully!",
      STATUS_CODE.CREATED,
      { _id: memberId },
    );
  } catch (error) {
    console.log(JSON.stringify(error));
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - createMember");
  }
};
