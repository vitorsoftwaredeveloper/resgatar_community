import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { validate, parseRequestBody } from "../../utils/validate";
import { RegisterCashDonationValidatorSchema } from "./validation/registerCashDonationSchema";
import { registerCashDonationService } from "../../services/donations/registerCashDonation";
import { STATUS_CODE } from "../../constants";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("IN - registerCashDonation");

  try {
    const credentials = decodeToken(event.headers.authorization as string);
    const payload = parseRequestBody(event.body) as any;

    const errors = validate(RegisterCashDonationValidatorSchema, payload);
    if (errors.length > 0) {
      return sendErrorResponse({
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "Validation Error",
        errors,
      });
    }

    const response = await registerCashDonationService(
      credentials.sub,
      payload,
    );

    return sendSuccessResponse(
      "Cash donation registered successfully!",
      STATUS_CODE.CREATED,
      response,
    );
  } catch (error) {
    console.log({ error });
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - registerCashDonation");
  }
};
