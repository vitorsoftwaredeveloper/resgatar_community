import { MemberModel } from "../../models/Member";

export const updatePushTokenService = async (
  memberId: string,
  pushToken: string
): Promise<void> => {
  console.log("IN - updatePushTokenService");

  try {
    const result = await MemberModel.updateOne(
      { _id: memberId },
      { $set: { pushToken } }
    );

    if (result.matchedCount === 0) {
      throw { statusCode: 404, message: "Member not found" };
    }
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - updatePushTokenService");
  }
};
