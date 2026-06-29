import { MemberModel } from "../../models/Member";

export const updatePushTokenService = async (
  memberId: string,
  pushToken: string
): Promise<void> => {
  console.log("IN - updatePushTokenService");

  try {
    // Registrar o push token (app aberto) é também um sinal de atividade,
    // então carimbamos lastActiveAt no mesmo write — sem custo extra.
    const result = await MemberModel.updateOne(
      { _id: memberId },
      { $set: { pushToken, lastActiveAt: new Date(), deletionWarnedAt: null } }
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
