import { MemberModel } from "../../models/Member";
import { unsubscribeTokensFromTopic } from "../../integrations/firebase";

export const removePushTokenService = async (
  memberId: string,
  pushToken: string
): Promise<void> => {
  console.log("IN - removePushTokenService");

  try {
    const result = await MemberModel.updateOne(
      { _id: memberId },
      { $pull: { pushTokens: pushToken } }
    );

    if (result.matchedCount === 0) {
      throw { statusCode: 404, message: "Member not found" };
    }

    await unsubscribeTokensFromTopic([pushToken]).catch((error) =>
      console.error("Failed to unsubscribe push token from topic:", error)
    );
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - removePushTokenService");
  }
};
