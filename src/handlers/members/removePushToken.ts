import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";
import { parseRequestBody } from "../../utils/validate";
import { removePushTokenService } from "../../services/members/removePushToken";
import { STATUS_CODE } from "../../constants";

export const execute = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  console.log("IN - removePushToken");

  try {
    const memberCredentials = decodeToken(event.headers.authorization as string);
    const payload = parseRequestBody(event.body) as any;

    if (!payload?.pushToken || typeof payload.pushToken !== "string") {
      return sendErrorResponse({
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "pushToken is required and must be a string",
      });
    }

    await removePushTokenService(memberCredentials.sub, payload.pushToken);

    return sendSuccessResponse("Push token removed successfully", STATUS_CODE.NO_CONTENT);
  } catch (error) {
    console.log("Errors:", JSON.stringify(error));
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - removePushToken");
  }
};
