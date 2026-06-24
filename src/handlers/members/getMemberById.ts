import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { getMemberByIdService } from "../../services/members/getMemberById";
import { STATUS_CODE } from "../../constants";
import { decodeToken } from "../../utils/helper";

export const execute = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  console.log("IN - getMemberById");

  try {
    const memberCredentials = decodeToken(
      event.headers.authorization as string
    );

    const memberId = event.pathParameters?.memberId;

    if (!memberId) {
      return sendErrorResponse({
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "memberId is required",
      });
    }

    const member = await getMemberByIdService(memberCredentials.sub, memberId);

    return sendSuccessResponse("Member retrieved successfully", 200, member);
  } catch (error) {
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - getMemberById");
  }
};
