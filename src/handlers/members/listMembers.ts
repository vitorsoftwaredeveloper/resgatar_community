import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { listMembersService } from "../../services/members/listMembers";
import jwt from "jsonwebtoken";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";

export const execute = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  console.log("IN - listMembers");

  const memberCredentials = decodeToken(event.headers.authorization as string);

  try {
    const members = await listMembersService(memberCredentials.sub);

    return sendSuccessResponse("Members listed successfully", 200, members);
  } catch (error) {
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - listMembers");
  }
};
