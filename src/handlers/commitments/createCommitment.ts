import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";
import { parseRequestBody, validate } from "../../utils/validate";
import { createCommitmentSchema } from "./validation/createCommitmentSchema";
import { createCommitmentService } from "../../services/commitments/createCommitment";
import { STATUS_CODE } from "../../constants";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("IN - createCommitment");

  try {
    const memberCredentials = decodeToken(event.headers.authorization as string);
    const payload = parseRequestBody(event.body) as any;

    const errors = validate(createCommitmentSchema, payload);
    if (errors.length > 0) {
      throw { statusCode: STATUS_CODE.BAD_REQUEST, message: "Validation Error", errors };
    }

    const commitment = await createCommitmentService(memberCredentials.sub, payload);

    return sendSuccessResponse(
      "Commitment created successfully!",
      STATUS_CODE.CREATED,
      commitment,
    );
  } catch (error) {
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - createCommitment");
  }
};
