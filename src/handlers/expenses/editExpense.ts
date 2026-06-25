import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { parseRequestBody, validate } from "../../utils/validate";
import { editExpenseSchema } from "./validation/editExpenseSchema";
import { editExpenseService } from "../../services/expenses/editExpense";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { STATUS_CODE } from "../../constants";
import { decodeToken } from "../../utils/helper";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("IN - editExpense");

    const admin = decodeToken(event.headers.authorization as string);

    const expenseId = event.pathParameters?.expenseId;
    if (!expenseId) {
      return sendErrorResponse({
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "expenseId is required",
      });
    }

    const payload = parseRequestBody(event.body) as any;

    const errors = validate(editExpenseSchema, payload);
    if (errors.length > 0) {
      return sendErrorResponse({
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "Validation Error",
        errors,
      });
    }

    await editExpenseService(admin.sub, expenseId, payload);

    return sendSuccessResponse("Expense updated successfully", STATUS_CODE.NO_CONTENT);
  } catch (error) {
    console.log(JSON.stringify(error));
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - editExpense");
  }
};
