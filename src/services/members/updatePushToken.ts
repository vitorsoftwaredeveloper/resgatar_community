import { MemberModel } from "../../models/Member";
import { subscribeTokensToTopic } from "../../integrations/firebase";

const MAX_TOKENS_PER_MEMBER = 10;

const buildDedupedCappedTokens = (pushToken: string) => ({
  $slice: [
    {
      $concatArrays: [
        {
          $filter: {
            input: { $ifNull: ["$pushTokens", []] },
            cond: { $ne: ["$$this", pushToken] },
          },
        },
        [pushToken],
      ],
    },
    -MAX_TOKENS_PER_MEMBER,
  ],
});

export const updatePushTokenService = async (
  memberId: string,
  pushToken: string
): Promise<void> => {
  console.log("IN - updatePushTokenService");

  try {
    const result = await MemberModel.updateOne(
      { _id: memberId },
      [
        {
          $set: {
            pushTokens: buildDedupedCappedTokens(pushToken),
            lastActiveAt: "$$NOW",
            deletionWarnedAt: null,
          },
        },
      ],
      { updatePipeline: true },
    );

    if (result.matchedCount === 0) {
      throw { statusCode: 404, message: "Member not found" };
    }

    await subscribeTokensToTopic([pushToken]).catch((error) =>
      console.error("Failed to subscribe push token to topic:", error)
    );
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - updatePushTokenService");
  }
};
