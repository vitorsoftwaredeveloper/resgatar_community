import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { db } from "../../db";
import { MemberModel } from "../../models/Member";
import { encrypt, isEncrypted } from "../../utils/crypto";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";
import { STATUS_CODE } from "../../constants";
import { findMemberById } from "../../services/helper";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("IN - migrateCpfEncryption");

    const requester = decodeToken(event.headers.authorization as string);
    const dryRun = event.queryStringParameters?.dryRun === "true";
    const member = await findMemberById(requester.sub);

    if (member.role !== "admin") {
      throw {
        statusCode: STATUS_CODE.FORBIDDEN,
        message: "Only admins can run migrations.",
      };
    }

    await db();

    const members = await MemberModel.find(
      {},
      { _id: 1, "identification.numberType": 1 },
    );

    let migrated = 0;
    let skipped = 0;
    const errors: Array<{ memberId: string; reason: string }> = [];

    for (const member of members) {
      const identification = member.identification?.numberType;

      if (!identification) {
        errors.push({
          memberId: member._id,
          reason: "identification.numberType is missing",
        });
        continue;
      }

      if (isEncrypted(identification)) {
        skipped++;
        continue;
      }

      try {
        if (!dryRun) {
          await MemberModel.updateOne(
            { _id: member._id },
            { "identification.numberType": encrypt(identification) },
          );
        }
        migrated++;
      } catch (err: any) {
        errors.push({
          memberId: member._id,
          reason: err.message ?? "unknown error",
        });
      }
    }

    console.log("OUT - migrateCpfEncryption");

    return sendSuccessResponse("Migration completed.", STATUS_CODE.SUCCESS, {
      total: members.length,
      migrated,
      skipped,
      errors,
    });
  } catch (error) {
    console.log({ error });
    return sendErrorResponse(error);
  }
};
