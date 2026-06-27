import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";
import { consultDonationService } from "../../services/donations/consultDonation";
import { STATUS_CODE } from "../../constants";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("IN - consultDonation");

  try {
    const credentials = decodeToken(event.headers.authorization as string);

    const transactionId = event.pathParameters?.transactionId;

    const donation = await consultDonationService(
      credentials.sub,
      transactionId as string,
    );

    return sendSuccessResponse(
      "Donation consulted successfully!",
      STATUS_CODE.SUCCESS,
      donation,
    );
  } catch (error) {
    console.log({ error });
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - consultDonation");
  }
};
