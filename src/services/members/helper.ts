// Janela mínima entre gravações de atividade. Como o app bate em vários
// endpoints por sessão, gravar a cada request seria write demais (custo no

import { ChargeModel } from "../../models/Charge";
import { ContributionModel } from "../../models/Contribution";
import { MemberModel } from "../../models/Member";
import { VideoModel } from "../../models/Video";
import { removeMemberCognito } from "../../utils/cognito";

// free tier) sem ganho: para decidir inatividade basta granularidade de dias.
const TOUCH_THROTTLE_MS = 24 * 60 * 60 * 1000;

// Carimba o último acesso do membro de forma atômica e barata: o filtro só
// casa (e portanto só grava) se já passou a janela desde a última atividade.
// Pensado para ser chamado em fire-and-forget — nunca deve quebrar o request.
const touchLastActive = async (memberId: string): Promise<void> => {
  try {
    const cutoff = new Date(Date.now() - TOUCH_THROTTLE_MS);

    await MemberModel.updateOne(
      { _id: memberId, lastActiveAt: { $lt: cutoff } },
      { $set: { lastActiveAt: new Date(), deletionWarnedAt: null } },
    );
  } catch (error) {
    console.error("touchLastActive failed (ignored):", error);
  }
};

// Cascata de remoção definitiva de um membro: Cognito + Mongo. Donations são
// propositalmente preservadas para auditoria/agregações financeiras. Sem
// checagem de permissão — usado por fluxo autenticado (removeMemberService) e
// pelo agent de inativos.
const purgeMember = async (idMember: string): Promise<void> => {
  await removeMemberCognito(idMember);

  await Promise.all([
    MemberModel.deleteOne({ _id: idMember }),
    ContributionModel.deleteMany({ memberId: idMember }),
    ChargeModel.deleteMany({ memberId: idMember }),
    VideoModel.deleteMany({ memberId: idMember }),
  ]);
};

export { touchLastActive, purgeMember };
