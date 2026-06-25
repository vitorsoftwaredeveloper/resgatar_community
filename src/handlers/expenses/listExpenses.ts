import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { listExpensesService } from "../../services/expenses/listExpenses";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { STATUS_CODE } from "../../constants";
import { decodeToken } from "../../utils/helper";
import { parseYearMonth } from "./helper";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("IN - listExpenses");

    const admin = decodeToken(event.headers.authorization as string);

    const { year, month } = parseYearMonth(event.queryStringParameters);

    const expenses = await listExpensesService(admin.sub, year, month);

    return sendSuccessResponse(
      "Expenses retrieved successfully",
      STATUS_CODE.SUCCESS,
      expenses,
    );
  } catch (error) {
    console.log(JSON.stringify(error));
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - listExpenses");
  }
};
