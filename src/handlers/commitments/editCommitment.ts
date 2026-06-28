import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";
import { parseRequestBody, validate } from "../../utils/validate";
import { createCommitmentSchema } from "./validation/createCommitmentSchema";
import { editCommitmentService } from "../../services/commitments/editCommitment";
import { STATUS_CODE } from "../../constants";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("IN - editCommitment");

  try {
    const memberCredentials = decodeToken(event.headers.authorization as string);
    const commitmentId = event.pathParameters?.commitmentId as string;

    if (!commitmentId) {
      throw { statusCode: STATUS_CODE.BAD_REQUEST, message: "Commitment ID is required." };
    }

    const payload = parseRequestBody(event.body) as any;

    const errors = validate(createCommitmentSchema, payload);
    if (errors.length > 0) {
      throw { statusCode: STATUS_CODE.BAD_REQUEST, message: "Validation Error", errors };
    }

    const commitment = await editCommitmentService(
      memberCredentials.sub,
      commitmentId,
      payload,
    );

    return sendSuccessResponse(
      "Commitment updated successfully!",
      STATUS_CODE.SUCCESS,
      commitment,
    );
  } catch (error) {
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - editCommitment");
  }
};
