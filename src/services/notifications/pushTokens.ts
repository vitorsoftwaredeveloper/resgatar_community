import { MemberModel } from "../../models/Member";
import { unsubscribeTokensFromTopic } from "../../integrations/firebase";

export const clearInvalidPushTokens = async (
  invalidTokens: string[],
): Promise<void> => {
  if (invalidTokens.length === 0) return;

  console.log("IN - clearInvalidPushTokens", { count: invalidTokens.length });

  await MemberModel.updateMany(
    { pushTokens: { $in: invalidTokens } },
    { $pull: { pushTokens: { $in: invalidTokens } } },
  );

  await unsubscribeTokensFromTopic(invalidTokens).catch((error) =>
    console.error("Failed to unsubscribe invalid tokens from topic:", error),
  );

  console.log("OUT - clearInvalidPushTokens");
};
