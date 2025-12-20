import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { validate } from "../../utils/validate";
import { ISignUpPayload } from "../../types/members";
import { CreateChargeValidatorSchema } from "./validation/createChargeSchema";
import { createChargeService } from "../../services/charges/createCharge";
import jwt from "jsonwebtoken";
import { STATUS_CODE } from "../../constants";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";

export const execute = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("IN - createChargeHandler");
    console.log("Body:", event.body);

    const memberCredentials = decodeToken(
      event.headers.authorization as string
    );

    const payload = parseRequestBody(event.body) as any;

    const errors = validate(CreateChargeValidatorSchema, payload);
    if (errors.length > 0) {
      return sendErrorResponse({
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "Validation Error",
        errors,
      });
    }

    const response = await createChargeService(memberCredentials.sub, payload);

    return sendSuccessResponse(
      "Charge created successfully!",
      STATUS_CODE.CREATED,
      response
    );
  } catch (error) {
    console.log({ error });
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - createChargeHandler");
  }
};

const parseRequestBody = (body: string | null): ISignUpPayload | null => {
  console.log("IN - parseRequestBody");

  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - parseRequestBody");
  }
};
