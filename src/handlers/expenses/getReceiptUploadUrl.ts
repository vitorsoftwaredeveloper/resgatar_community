import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { STATUS_CODE } from "../../constants";
import { decodeToken } from "../../utils/helper";
import {
  generateReceiptUploadUrl,
  isAllowedReceiptContentType,
} from "../../utils/s3";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("IN - getReceiptUploadUrl");

    const admin = decodeToken(event.headers.authorization as string);

    const contentType = event.queryStringParameters?.contentType;
    if (!contentType || !isAllowedReceiptContentType(contentType)) {
      return sendErrorResponse({
        statusCode: STATUS_CODE.BAD_REQUEST,
        message:
          "Query param 'contentType' inválido. Use image/jpeg, image/png, image/webp ou application/pdf.",
      });
    }

    const { uploadUrl, key } = await generateReceiptUploadUrl(
      admin.sub,
      contentType,
    );

    return sendSuccessResponse(
      "Receipt upload URL generated successfully",
      STATUS_CODE.SUCCESS,
      { uploadUrl, key },
    );
  } catch (error) {
    console.log(JSON.stringify(error));
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - getReceiptUploadUrl");
  }
};
