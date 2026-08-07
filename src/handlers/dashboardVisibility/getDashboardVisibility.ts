import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { getDashboardVisibilitySettings } from "../../services/dashboardVisibility/getDashboardVisibility";
import { STATUS_CODE } from "../../constants";
import { decodeToken } from "../../utils/helper";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("IN - getDashboardVisibility");

    decodeToken(event.headers.authorization as string);

    const response = await getDashboardVisibilitySettings();

    return sendSuccessResponse(
      "Dashboard visibility retrieved successfully!",
      STATUS_CODE.SUCCESS,
      response,
    );
  } catch (error) {
    console.log(JSON.stringify(error));
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - getDashboardVisibility");
  }
};
