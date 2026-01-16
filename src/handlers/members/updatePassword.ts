import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";
import { parseRequestBody, validate } from "../../utils/validate";
import { updatePasswordSchema } from "./validation/updatePasswordSchema";
import { updatePasswordService } from "../../services/members/updatePassword";
import { STATUS_CODE } from "../../constants";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("Event:", event);
  console.log("IN - updatePassword");

  const memberCredentials = decodeToken(event.headers.authorization as string);
  const payload = parseRequestBody(event.body) as any;
  const memberId = event.pathParameters?.memberId;

  if (!memberId) {
    return sendErrorResponse({
      statusCode: STATUS_CODE.BAD_REQUEST,
      message: "Member ID is required in path parameters",
    });
  }

  const errors = validate(updatePasswordSchema, payload);
  console.log("Errors:", errors);
  if (errors.length > 0) {
    throw {
      statusCode: 400,
      message: "Validation Error",
      errors,
    };
  }
  try {
    await updatePasswordService(
      memberCredentials.sub,
      payload.password,
      memberId,
    );

    return sendSuccessResponse(
      "Password updated successfully",
      STATUS_CODE.NO_CONTENT,
    );
  } catch (error) {
    console.log("Errors:", error);
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - updatePassword");
  }
};
