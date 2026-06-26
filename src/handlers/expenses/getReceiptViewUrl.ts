import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { getReceiptViewUrlService } from "../../services/expenses/getReceiptViewUrl";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { STATUS_CODE } from "../../constants";
import { decodeToken } from "../../utils/helper";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("IN - getReceiptViewUrl");

    const admin = decodeToken(event.headers.authorization as string);

    const expenseId = event.pathParameters?.expenseId;
    if (!expenseId) {
      return sendErrorResponse({
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "expenseId is required",
      });
    }

    const viewUrl = await getReceiptViewUrlService(admin.sub, expenseId);

    return sendSuccessResponse(
      "Receipt view URL generated successfully",
      STATUS_CODE.SUCCESS,
      { viewUrl },
    );
  } catch (error) {
    console.log(JSON.stringify(error));
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - getReceiptViewUrl");
  }
};
