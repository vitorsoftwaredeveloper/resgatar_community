import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { removeExpenseService } from "../../services/expenses/removeExpense";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { STATUS_CODE } from "../../constants";
import { decodeToken } from "../../utils/helper";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("IN - removeExpense");

    const admin = decodeToken(event.headers.authorization as string);

    const expenseId = event.pathParameters?.expenseId;
    if (!expenseId) {
      return sendErrorResponse({
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "expenseId is required",
      });
    }

    await removeExpenseService(admin.sub, expenseId);

    return sendSuccessResponse("", STATUS_CODE.NO_CONTENT);
  } catch (error) {
    console.log(JSON.stringify(error));
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - removeExpense");
  }
};
