import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";
import { removeDeviceService } from "../../services/devices/removeDevice";
import { STATUS_CODE } from "../../constants";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("IN - removeDevice");

  try {
    const memberCredentials = decodeToken(
      event.headers.authorization as string,
    );
    const token = decodeURIComponent(event.pathParameters?.token ?? "");

    if (!token) {
      return sendErrorResponse({
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "token is required",
      });
    }

    await removeDeviceService(memberCredentials.sub, token);

    return sendSuccessResponse(
      "Device removed successfully",
      STATUS_CODE.NO_CONTENT,
    );
  } catch (error) {
    console.log("Errors:", JSON.stringify(error));
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - removeDevice");
  }
};
