import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { validate } from "../../utils/validate";
import { ISignUpPayload } from "../../types/members";
import { CreateChargeValidatorSchema } from "./validation/createChargeSchema";
import { createChargeService } from "../../services/charges/createCharge";
import jwt from "jsonwebtoken";
import { STATUS_CODE } from "../../constants";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { consultChargeService } from "../../services/charges/consultCharge";
import { decodeToken } from "../../utils/helper";

export const execute = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("IN - consultChargeHandler");

    const memberCredentials = decodeToken(
      event.headers.authorization as string
    );

    const transactionId = event.pathParameters?.transactionId;

    const response = await consultChargeService(
      memberCredentials.sub,
      transactionId as string
    );

    return sendSuccessResponse(
      "Charge consulted successfully!",
      STATUS_CODE.CREATED,
      response
    );
  } catch (error) {
    console.log({ error });
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - consultChargeHandler");
  }
};
