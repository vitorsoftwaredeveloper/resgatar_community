import { APIGatewayProxyResult } from "aws-lambda";

const sendErrorResponse = (error: any): APIGatewayProxyResult => ({
  statusCode: error.statusCode || error.status || 500,
  body: JSON.stringify({
    message: error.message || "Internal Server Error",
    ...(error.errors && { errors: error.errors }),
    ...(error.code && { code: error.code }),
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
