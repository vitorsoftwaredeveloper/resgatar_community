import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { listCommitmentsService } from "../../services/commitments/listCommitments";
import { STATUS_CODE } from "../../constants";

export const execute = async (
  _event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("IN - listCommitments");

  try {
    const commitments = await listCommitmentsService();

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
