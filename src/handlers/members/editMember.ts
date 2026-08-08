import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";
import { parseRequestBody, validate } from "../../utils/validate";
import { editMemberService } from "../../services/members/editMember";
import { editMemberSchema } from "./validation/editMemberSchema";
import { STATUS_CODE } from "../../constants";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("IN - editMember");

  try {
    const memberCredentials = decodeToken(
      event.headers.authorization as string,
    );
    const payload = parseRequestBody(event.body) as any;

    const { identification, ...rest } = payload;
    console.log("Payload:", JSON.stringify(rest));

    const errors = validate(editMemberSchema, payload);
    if (errors.length > 0) {
      return sendErrorResponse({
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "Validation Error",
        errors,
      });
    }

    const memberId = event.pathParameters?.memberId as string;
    const member = await editMemberService(
      memberCredentials.sub,
      memberId || memberCredentials.sub,
      payload,
    );

    return sendSuccessResponse("Member updated successfully", 204, member);
  } catch (error) {
    console.log("Errors:", JSON.stringify(error));
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - editMember");
  }
};
