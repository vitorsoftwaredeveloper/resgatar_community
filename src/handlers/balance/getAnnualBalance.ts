import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { STATUS_CODE } from "../../constants";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";
import { getAnnualBalanceService } from "../../services/balance/getAnnualBalance";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("IN - getAnnualBalance");

    const admin = decodeToken(event.headers.authorization as string);

    const now = new Date();
    const query = event.queryStringParameters || {};
    const year = query.year ? Number(query.year) : now.getFullYear();

    if (!Number.isInteger(year)) {
      return sendErrorResponse({
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "Invalid year",
      });
    }

    const response = await getAnnualBalanceService(admin.sub, year);

    return sendSuccessResponse(
      "Annual balance retrieved successfully!",
      STATUS_CODE.SUCCESS,
      response,
    );
  } catch (error) {
    console.log({ error });
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - getAnnualBalance");
  }
};
