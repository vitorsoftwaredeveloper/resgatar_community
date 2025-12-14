import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { removeMemberService } from "../../services/members/removeMember";
import jwt from "jsonwebtoken";
import { STATUS_CODE } from "../../constants";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";

export const execute = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  console.log("IN - removeMember");

  const admin = jwt.decode(
    (event.headers.authorization as string).replace("Bearer ", "")
  );

  const memberToRemoveId = event.pathParameters?.memberId as string;
  if (!memberToRemoveId) {
    throw {
      statusCode: STATUS_CODE.BAD_REQUEST,
      message: "Member Id is required",
    };
  }

  try {
    await removeMemberService(admin?.sub as string, memberToRemoveId);

    return sendSuccessResponse(
      "Member removed successfully",
      STATUS_CODE.NO_CONTENT
    );
  } catch (error) {
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - removeMember");
  }
};
