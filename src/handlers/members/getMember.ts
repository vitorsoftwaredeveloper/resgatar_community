import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { getMemberService } from "../../services/members/getMember";
import { decodeToken } from "../../utils/helper";

export const execute = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  console.log("IN - getMember");

  const memberCredentials = decodeToken(event.headers.authorization as string);

  try {
    const member = await getMemberService(memberCredentials.sub);

    return sendSuccessResponse("Member retrieved successfully", 200, member);
  } catch (error) {
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - getMember");
  }
};
