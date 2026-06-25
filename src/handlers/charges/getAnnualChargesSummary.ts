import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { STATUS_CODE } from "../../constants";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";
import { getAnnualChargesSummaryService } from "../../services/charges/getAnnualChargesSummary";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("IN - getAnnualChargesSummary");

    const memberCredentials = decodeToken(
      event.headers.authorization as string,
    );

    const now = new Date();
    const query = event.queryStringParameters || {};
    const year = query.year ? Number(query.year) : now.getFullYear();

    if (!Number.isInteger(year)) {
      return sendErrorResponse({
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "Invalid year",
      });
    }

    const response = await getAnnualChargesSummaryService(
      memberCredentials.sub,
      year,
    );

    return sendSuccessResponse(
      "Annual charges summary retrieved successfully!",
      STATUS_CODE.SUCCESS,
      response,
    );
  } catch (error) {
    console.log({ error });
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - getAnnualChargesSummary");
  }
};
