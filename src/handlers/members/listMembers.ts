import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { listMembersService } from "../../services/members/listMembers";
import jwt from "jsonwebtoken";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";

export const execute = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  console.log("IN - listMembers");

  const memberCredentials = jwt.decode(
    (event.headers.authorization as string).replace("Bearer ", "")
  );

  try {
    const members = await listMembersService(memberCredentials?.sub as string);

    return sendSuccessResponse("Members listed successfully", 200, members);
  } catch (error) {
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - listMembers");
  }
};
