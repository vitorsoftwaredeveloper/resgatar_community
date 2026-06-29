import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";
import { listCampaignsService } from "../../services/campaigns/listCampaigns";
import { STATUS_CODE } from "../../constants";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("IN - listCampaigns");

  try {
    const memberCredentials = decodeToken(event.headers.authorization as string);
    const includeInactive =
      event.queryStringParameters?.includeInactive === "true";

    const campaigns = await listCampaignsService(
      memberCredentials.sub,
      includeInactive,
    );

    return sendSuccessResponse(
      "Campaigns retrieved successfully.",
      STATUS_CODE.SUCCESS,
      campaigns,
    );
  } catch (error) {
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - listCampaigns");
  }
};
