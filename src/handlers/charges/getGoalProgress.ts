import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { STATUS_CODE } from "../../constants";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { getGoalProgressService } from "../../services/charges/getGoalProgress";
import { decodeToken } from "../../utils/helper";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("IN - getGoalProgress");

    const memberCredentials = decodeToken(
      event.headers.authorization as string,
    );

    const now = new Date();
    const query = event.queryStringParameters || {};
    const year = query.year ? Number(query.year) : now.getFullYear();
    const month = query.month ? Number(query.month) : now.getMonth() + 1;

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return sendErrorResponse({
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "Invalid year or month",
      });
    }

    const response = await getGoalProgressService(
      memberCredentials.sub,
      year,
      month,
    );

    return sendSuccessResponse(
      "Goal progress retrieved successfully!",
      STATUS_CODE.SUCCESS,
      response,
    );
  } catch (error) {
    console.log({ error });
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - getGoalProgress");
  }
};
