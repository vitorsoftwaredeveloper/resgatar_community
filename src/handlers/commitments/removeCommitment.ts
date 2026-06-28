import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";
import { removeCommitmentService } from "../../services/commitments/removeCommitment";
import { STATUS_CODE } from "../../constants";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("IN - removeCommitment");

  try {
    const memberCredentials = decodeToken(event.headers.authorization as string);
    const commitmentId = event.pathParameters?.commitmentId as string;

    if (!commitmentId) {
      throw { statusCode: STATUS_CODE.BAD_REQUEST, message: "Commitment ID is required." };
    }

    await removeCommitmentService(memberCredentials.sub, commitmentId);

    return sendSuccessResponse("", STATUS_CODE.NO_CONTENT);
  } catch (error) {
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - removeCommitment");
  }
};
