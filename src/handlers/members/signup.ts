import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { parseRequestBody, validate } from "../../utils/validate";
import { SignUpValidatorSchema } from "./validation/signupSchema";
import { signUpService } from "../../services/members/signup";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { STATUS_CODE } from "../../constants";

export const execute = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const payload = parseRequestBody(event.body) as any;

    const errors = validate(SignUpValidatorSchema, payload);
    if (errors.length > 0) {
      return sendErrorResponse({
        statusCode: 400,
        message: "Validation Error",
        errors,
      });
    }

    const memberId = await signUpService(payload);

    return sendSuccessResponse(
      "Member created successfully!",
      STATUS_CODE.CREATED,
      { _id: memberId }
    );
  } catch (error) {
    return sendErrorResponse(error);
  }
};
