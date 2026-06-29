import { MemberModel } from "../../models/Member";
import { sendPushNotificationToTokens } from "../../integrations/firebase";
import { purgeMember } from "../members/helper";

// Política de retenção de contas inativas. Muitos usuários desinstalam o app
// sem encerrar a conta, deixando peso morto no banco (free tier). Este agent
// roda em dois estágios: primeiro avisa quem ficou inativo, e só remove de vez
// 30 dias depois se a pessoa não voltar. Atividade é registrada em
// lastActiveAt (ver touchLastActive); voltar a usar o app zera deletionWarnedAt
// e tira o membro da fila de exclusão automaticamente.
const INACTIVE_DAYS = 180;
const GRACE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const warnInactiveMembers = async (inactiveCutoff: Date) => {
  const toWarn = await MemberModel.find(
    { lastActiveAt: { $lt: inactiveCutoff }, deletionWarnedAt: null },
    { _id: 1, pushToken: 1 },
    { lean: true },
  );

  console.log("Members to warn:", toWarn.length);

  if (toWarn.length === 0) return;

  const tokens = toWarn
    .map((m) => m.pushToken)
    .filter((t): t is string => Boolean(t));

  if (tokens.length > 0) {
    const invalidTokens = await sendPushNotificationToTokens(
      tokens,
      "Sentimos sua falta!",
      `Faz tempo que você não aparece. Entre no app nos próximos ${GRACE_DAYS} dias para manter sua conta ativa.`,
    );

    if (invalidTokens.length > 0) {
      await MemberModel.updateMany(
        { pushToken: { $in: invalidTokens } },
        { $set: { pushToken: null } },
      );
    }
  }

  await MemberModel.updateMany(
    { _id: { $in: toWarn.map((m) => m._id) } },
    { $set: { deletionWarnedAt: new Date() } },
  );
};

const purgeWarnedMembers = async (inactiveCutoff: Date, graceCutoff: Date) => {
  // Só remove quem foi avisado há mais de GRACE_DAYS e continua inativo.
  // Quem voltou teve deletionWarnedAt zerado e não casa este filtro.
  const toPurge = await MemberModel.find(
    {
      deletionWarnedAt: { $ne: null, $lt: graceCutoff },
      lastActiveAt: { $lt: inactiveCutoff },
    },
    { _id: 1 },
    { lean: true },
  );

  console.log("Members to purge:", toPurge.length);

  for (const member of toPurge) {
    try {
      await purgeMember(member._id);
    } catch (error) {
      console.error("Failed to purge member", member._id, error);
    }
  }
};

export const execute = async () => {
  console.log("IN - inactiveMembers");

  try {
    const now = Date.now();
    const inactiveCutoff = new Date(now - INACTIVE_DAYS * DAY_MS);
    const graceCutoff = new Date(now - GRACE_DAYS * DAY_MS);

    await purgeWarnedMembers(inactiveCutoff, graceCutoff);
    await warnInactiveMembers(inactiveCutoff);
  } catch (error) {
    console.error("Error processing inactive members:", error);
  } finally {
    console.log("OUT - inactiveMembers");
  }
};
