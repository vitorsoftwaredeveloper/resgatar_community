import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { parseRequestBody, validate } from "../../utils/validate";
import { setDashboardVisibilitySchema } from "./validation/setDashboardVisibilitySchema";
import { updateDashboardVisibilityService } from "../../services/dashboardVisibility/updateDashboardVisibility";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { STATUS_CODE } from "../../constants";
import { decodeToken } from "../../utils/helper";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("IN - setDashboardVisibility");

    const admin = decodeToken(event.headers.authorization as string);

    const payload = parseRequestBody(event.body) as any;

    const errors = validate(setDashboardVisibilitySchema, payload);
    if (errors.length > 0) {
      return sendErrorResponse({
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "Validation Error",
        errors,
      });
    }

    await updateDashboardVisibilityService(admin.sub, payload);

    return sendSuccessResponse(
      "Dashboard visibility saved successfully!",
      STATUS_CODE.SUCCESS,
    );
  } catch (error) {
    console.log(JSON.stringify(error));
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - setDashboardVisibility");
  }
};
