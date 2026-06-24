import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { validate } from "../../utils/validate";
import { IRegisterCashPaymentPayload } from "../../types/charges";
import { RegisterCashPaymentValidatorSchema } from "./validation/registerCashPaymentSchema";
import { registerCashPaymentService } from "../../services/charges/registerCashPayment";
import { STATUS_CODE } from "../../constants";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";

export const execute = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("IN - registerCashPaymentHandler");

    const memberCredentials = decodeToken(
      event.headers.authorization as string
    );

    const payload = parseRequestBody(event.body) as any;

    const errors = validate(RegisterCashPaymentValidatorSchema, payload);
    if (errors.length > 0) {
      return sendErrorResponse({
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "Validation Error",
        errors,
      });
    }

    const response = await registerCashPaymentService(
      memberCredentials.sub,
      payload
    );

    return sendSuccessResponse(
      "Cash payment registered successfully!",
      STATUS_CODE.CREATED,
      response
    );
  } catch (error) {
    console.log({ error });
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - registerCashPaymentHandler");
  }
};

const parseRequestBody = (
  body: string | null
): IRegisterCashPaymentPayload | null => {
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
