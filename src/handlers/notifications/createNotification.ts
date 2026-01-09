import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { parseRequestBody, validate } from "../../utils/validate";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { STATUS_CODE } from "../../constants";
import { decodeToken } from "../../utils/helper";
import { createNotificationService } from "../../services/notifications/createNotification";
import { CreateNotificationSchema } from "./validation/createNotificationSchema";

export const execute = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const admin = decodeToken(event.headers.authorization as string);
    const payload = parseRequestBody(event.body) as any;

    const errors = validate(CreateNotificationSchema, payload);
    if (errors.length > 0) {
      return sendErrorResponse({
        statusCode: 400,
        message: "Validation Error",
        errors,
      });
    }

    await createNotificationService(admin.sub, payload);

    return sendSuccessResponse(
      "Notification created successfully!",
      STATUS_CODE.CREATED
    );
  } catch (error) {
    return sendErrorResponse(error);
  }
};
