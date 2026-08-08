import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";
import { parseRequestBody, validate } from "../../utils/validate";
import { registerDeviceService } from "../../services/devices/registerDevice";
import { RegisterDeviceSchema } from "./validation/registerDeviceSchema";
import { STATUS_CODE } from "../../constants";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("IN - registerDevice");

  try {
    const memberCredentials = decodeToken(
      event.headers.authorization as string,
    );
    const payload = parseRequestBody(event.body) as any;

    const errors = validate(RegisterDeviceSchema, payload);
    if (errors.length > 0) {
      return sendErrorResponse({
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "Validation Error",
        errors,
      });
    }

    await registerDeviceService(memberCredentials.sub, {
      token: payload.token,
      platform: payload.platform,
      installed: payload.installed,
      client: "web",
    });

    return sendSuccessResponse(
      "Device registered successfully",
      STATUS_CODE.NO_CONTENT,
    );
  } catch (error) {
    console.log("Errors:", JSON.stringify(error));
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - registerDevice");
  }
};
