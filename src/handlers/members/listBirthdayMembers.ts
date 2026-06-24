import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { listBirthdayMembersService } from "../../services/members/listBirthdayMembers";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";

export const execute = async (
  _event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("IN - listBirthdayMembers");

  try {
    const members = await listBirthdayMembersService();

    return sendSuccessResponse("Birthday members listed successfully", 200, members);
  } catch (error) {
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - listBirthdayMembers");
  }
};
