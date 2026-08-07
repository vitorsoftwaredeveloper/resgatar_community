import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";
import { listCommitmentsService } from "../../services/commitments/listCommitments";
import { STATUS_CODE } from "../../constants";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("IN - listCommitments");

  try {
    const credentials = decodeToken(event.headers.authorization as string);

    const commitments = await listCommitmentsService(credentials.sub);

    return sendSuccessResponse(
      "Commitments retrieved successfully.",
      STATUS_CODE.SUCCESS,
      commitments,
    );
  } catch (error) {
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - listCommitments");
  }
};
