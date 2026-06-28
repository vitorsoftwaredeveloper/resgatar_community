import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";
import { markDailyReadingService } from "../../services/members/markDailyReading";
import { STATUS_CODE } from "../../constants";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("IN - markDailyReading");

  try {
    const memberCredentials = decodeToken(
      event.headers.authorization as string,
    );
    const streak = await markDailyReadingService(memberCredentials.sub);
    return sendSuccessResponse(
      "Reading marked successfully",
      STATUS_CODE.SUCCESS,
      streak,
    );
  } catch (error) {
    console.log("Errors:", JSON.stringify(error));
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - markDailyReading");
  }
};
