import { APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { STATUS_CODE } from "../../constants";
import { listNotificationService } from "../../services/notifications/listNotifications";

export const execute = async (): Promise<APIGatewayProxyResult> => {
  try {
    const notifications = await listNotificationService();

    return sendSuccessResponse(
      "Notification created successfully!",
      STATUS_CODE.CREATED,
      notifications
    );
  } catch (error) {
    return sendErrorResponse(error);
  }
};
