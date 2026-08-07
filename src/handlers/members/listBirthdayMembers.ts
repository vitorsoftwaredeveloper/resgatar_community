import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { listBirthdayMembersService } from "../../services/members/listBirthdayMembers";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("IN - listBirthdayMembers");

  try {
    const memberCredentials = decodeToken(
      event.headers.authorization as string,
    );

    const members = await listBirthdayMembersService(memberCredentials.sub);

    return sendSuccessResponse("Birthday members listed successfully", 200, members);
  } catch (error) {
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - listBirthdayMembers");
  }
};
