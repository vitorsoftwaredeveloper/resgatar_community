import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { parseRequestBody, validate } from "../../utils/validate";
import { setMonthlyGoalSchema } from "./validation/setMonthlyGoalSchema";
import { setMonthlyGoalService } from "../../services/charges/setMonthlyGoal";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { STATUS_CODE } from "../../constants";
import { decodeToken } from "../../utils/helper";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("IN - setMonthlyGoal");

    const admin = decodeToken(event.headers.authorization as string);

    const payload = parseRequestBody(event.body) as any;

    const errors = validate(setMonthlyGoalSchema, payload);
    if (errors.length > 0) {
      return sendErrorResponse({
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "Validation Error",
        errors,
      });
    }

    await setMonthlyGoalService(admin.sub, payload);

    return sendSuccessResponse(
      "Monthly goal saved successfully!",
      STATUS_CODE.SUCCESS,
    );
  } catch (error) {
    console.log(JSON.stringify(error));
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - setMonthlyGoal");
  }
};
