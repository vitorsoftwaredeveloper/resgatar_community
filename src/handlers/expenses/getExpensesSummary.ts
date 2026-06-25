import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { getExpensesSummaryService } from "../../services/expenses/getExpensesSummary";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { STATUS_CODE } from "../../constants";
import { decodeToken } from "../../utils/helper";
import { parseYearMonth } from "./helper";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("IN - getExpensesSummary");

    const admin = decodeToken(event.headers.authorization as string);

    const { year, month } = parseYearMonth(event.queryStringParameters);

    const summary = await getExpensesSummaryService(admin.sub, year, month);

    return sendSuccessResponse(
      "Expenses summary retrieved successfully",
      STATUS_CODE.SUCCESS,
      summary,
    );
  } catch (error) {
    console.log(JSON.stringify(error));
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - getExpensesSummary");
  }
};
