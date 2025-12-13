import { APIGatewayProxyResult } from "aws-lambda";

const sendErrorResponse = (error: any): APIGatewayProxyResult => ({
  statusCode: error.statusCode || 500,
  body: JSON.stringify({
    message: error.message || "Internal Server Error",
    errors: error.errors || null,
  }),
});

const sendSuccessResponse = (
  message: string,
  statusCode: number,
  data?: any
): APIGatewayProxyResult => ({
  statusCode: statusCode,
  body: JSON.stringify({ message, ...(data && { data }) }),
});

export { sendErrorResponse, sendSuccessResponse };
