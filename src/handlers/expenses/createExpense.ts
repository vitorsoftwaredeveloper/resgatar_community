import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { parseRequestBody, validate } from "../../utils/validate";
import { createExpenseSchema } from "./validation/createExpenseSchema";
import { createExpenseService } from "../../services/expenses/createExpense";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { STATUS_CODE } from "../../constants";
import { decodeToken } from "../../utils/helper";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("IN - createExpense");

    const admin = decodeToken(event.headers.authorization as string);

    const payload = parseRequestBody(event.body) as any;

    const errors = validate(createExpenseSchema, payload);
    if (errors.length > 0) {
      return sendErrorResponse({
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "Validation Error",
        errors,
      });
    }

    const expenseId = await createExpenseService(admin.sub, payload);

    return sendSuccessResponse(
      "Expense created successfully!",
      STATUS_CODE.CREATED,
      { _id: expenseId },
    );
  } catch (error) {
    console.log(JSON.stringify(error));
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - createExpense");
  }
};
