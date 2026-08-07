import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";
import { listMyDonationsService } from "../../services/donations/listMyDonations";
import { STATUS_CODE } from "../../constants";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("IN - listMyDonations");

  try {
    const credentials = decodeToken(event.headers.authorization as string);

    const donations = await listMyDonationsService(credentials.sub);

    return sendSuccessResponse("Donations listed", STATUS_CODE.SUCCESS, donations);
  } catch (error) {
    console.log({ error });
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - listMyDonations");
  }
};
