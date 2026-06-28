import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";
import { parseRequestBody, validate } from "../../utils/validate";
import { reorderCommitmentsSchema } from "./validation/reorderCommitmentsSchema";
import { reorderCommitmentsService } from "../../services/commitments/reorderCommitments";
import { STATUS_CODE } from "../../constants";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("IN - reorderCommitments");

  try {
    const memberCredentials = decodeToken(event.headers.authorization as string);
    const payload = parseRequestBody(event.body) as any;

    const errors = validate(reorderCommitmentsSchema, payload);
    if (errors.length > 0) {
      throw { statusCode: STATUS_CODE.BAD_REQUEST, message: "Validation Error", errors };
    }

    await reorderCommitmentsService(memberCredentials.sub, payload.ids);

    return sendSuccessResponse("", STATUS_CODE.NO_CONTENT);
  } catch (error) {
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - reorderCommitments");
  }
};
