import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { validate, parseRequestBody } from "../../utils/validate";
import { CreateDonationPixValidatorSchema } from "./validation/createDonationPixSchema";
import { createDonationPixService } from "../../services/donations/createDonationPix";
import { STATUS_CODE } from "../../constants";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("IN - createDonationPix");

  try {
    const credentials = decodeToken(event.headers.authorization as string);
    const payload = parseRequestBody(event.body) as any;

    const errors = validate(CreateDonationPixValidatorSchema, payload);
    if (errors.length > 0) {
      return sendErrorResponse({
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "Validation Error",
        errors,
      });
    }

    const response = await createDonationPixService(credentials.sub, payload);

    return sendSuccessResponse(
      "Donation created successfully!",
      STATUS_CODE.CREATED,
      response,
    );
  } catch (error) {
    console.log({ error });
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - createDonationPix");
  }
};
