import { CommitmentModel } from "../../models/Commitment";
import { COMMITMENT_REPEAT } from "../../constants/commitments";
import { getNthWeekdayOfMonth, getWeekdayNamePtBr } from "../../utils/recurrence";

// Agent mensal do Quadro de Avisos. Roda no dia 1 e mantém o mural coerente com
// o mês corrente, interpretando a flag `repeat` que o admin definiu:
//
//   monthly -> recalcula `date` para a ocorrência do mês (mesmo weekday+ordinal).
//   once    -> remove os que já passaram (data anterior ao mês corrente).
//   weekly  -> nada a fazer: são recorrentes sem data e seguem aparecendo.
//
// Idempotente: rodar de novo no mesmo mês reescreve as mesmas datas.
export const execute = async () => {
  console.log("IN - monthlyCommitments");

  try {
    const now = new Date();
    const year = now.getUTCFullYear();
    const monthIndex = now.getUTCMonth();
    const startOfMonth = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));

    // Avulsos vencidos: a data caiu em mês anterior e não se repetem.
    const removed = await CommitmentModel.deleteMany({
      repeat: COMMITMENT_REPEAT.ONCE,
      date: { $lt: startOfMonth },
    });
    console.log("Avulsos vencidos removidos:", removed.deletedCount);

    // Mensais: re-data cada um para a ocorrência deste mês.
    const monthly = await CommitmentModel.find(
      { repeat: COMMITMENT_REPEAT.MONTHLY },
      { _id: 1, weekday: 1, ordinal: 1 },
      { lean: true },
    );

    let reDated = 0;
    for (const item of monthly as any[]) {
      if (item.weekday === null || item.weekday === undefined) continue;

      const date = getNthWeekdayOfMonth(
        year,
        monthIndex,
        item.weekday,
        item.ordinal,
      );

      await CommitmentModel.updateOne(
        { _id: item._id },
        { date, day: getWeekdayNamePtBr(item.weekday) },
      );
      reDated += 1;
    }

    console.log(`Mensais re-datados para ${monthIndex + 1}/${year}:`, reDated);
  } catch (error) {
    console.error("Error rolling monthly commitments:", error);
  } finally {
    console.log("OUT - monthlyCommitments");
  }
};
