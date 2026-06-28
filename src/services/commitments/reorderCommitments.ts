import { CommitmentModel } from "../../models/Commitment";
import { STATUS_CODE } from "../../constants";
import { verifyAdmin } from "../helper";

// Persiste a sequência inteira do mural: a posição de cada id no array recebido
// vira o novo `order`. A lista enviada precisa cobrir exatamente os compromissos
// existentes — assim a verdade do front e do backend não divergem.
export const reorderCommitmentsService = async (
  adminId: string,
  ids: string[],
): Promise<void> => {
  console.log("IN - reorderCommitmentsService");

  try {
    await verifyAdmin(adminId);

    const existing = await CommitmentModel.find(
      {},
      { _id: 1 },
      { lean: true },
    );

    const existingIds = new Set(existing.map((c: any) => c._id));
    const hasDuplicates = new Set(ids).size !== ids.length;

    if (
      hasDuplicates ||
      ids.length !== existingIds.size ||
      ids.some((id) => !existingIds.has(id))
    ) {
      throw {
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "A ordem enviada não corresponde aos compromissos existentes.",
      };
    }

    await Promise.all(
      ids.map((id, index) =>
        CommitmentModel.updateOne({ _id: id }, { order: index }),
      ),
    );

    console.log("OUT - reorderCommitmentsService");
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - reorderCommitmentsService");
  }
};
