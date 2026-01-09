import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { parseRequestBody, validate } from "../../utils/validate";
import { createMemberSchema } from "./validation/createMemberSchema";
import { createMemberService } from "../../services/members/createMember";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { STATUS_CODE } from "../../constants";
import { decodeToken } from "../../utils/helper";

export const execute = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("IN - createMember");
    console.log("Body:", event.body);

    const admin = decodeToken(event.headers.authorization as string);
    const payload = parseRequestBody(event.body) as any;

    const errors = validate(createMemberSchema, payload);
    if (errors.length > 0) {
      throw {
        statusCode: 400,
        message: "Validation Error",
        errors,
      };
    }

    const memberId = await createMemberService(admin.sub, payload);

    return sendSuccessResponse(
      "Member created successfully!",
      STATUS_CODE.CREATED,
      { _id: memberId }
    );
  } catch (error) {
    console.log({ error });
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - createMember");
  }
};
