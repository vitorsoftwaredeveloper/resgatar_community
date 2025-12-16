import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";
import { parseRequestBody } from "../../utils/validate";
import { editMemberService } from "../../services/members/editMember";

export const execute = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Event:", event);
  console.log("IN - editMember");

  const memberCredentials = decodeToken(event.headers.authorization as string);
  const payload = parseRequestBody(event.body) as any;

  try {
    const member = await editMemberService(memberCredentials.sub, payload);

    return sendSuccessResponse("Member updated successfully", 204, member);
  } catch (error) {
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - editMember");
  }
};
