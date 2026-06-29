import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";
import { parseRequestBody, validate } from "../../utils/validate";
import { createCampaignSchema } from "./validation/createCampaignSchema";
import { createCampaignService } from "../../services/campaigns/createCampaign";
import { STATUS_CODE } from "../../constants";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("IN - createCampaign");

  try {
    const memberCredentials = decodeToken(event.headers.authorization as string);
    const payload = parseRequestBody(event.body) as any;

    const errors = validate(createCampaignSchema, payload);
    if (errors.length > 0) {
      throw { statusCode: STATUS_CODE.BAD_REQUEST, message: "Validation Error", errors };
    }

    const campaign = await createCampaignService(memberCredentials.sub, payload);

    return sendSuccessResponse(
      "Campaign created successfully!",
      STATUS_CODE.CREATED,
      campaign,
    );
  } catch (error) {
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - createCampaign");
  }
};
