import { Schema } from "mongoose";
import { createInstanceMongoose } from "../repositories/mongoose";

// Compromisso do Quadro de Avisos. `order` é a posição curada pelo admin
// (0-indexado, menor = topo do mural) e define a sequência de exibição.
//
// `repeat` é a flag que o admin escolhe e o agent mensal interpreta:
//   weekly  -> recorrente toda semana; `date` é null (exibido como "Toda Quarta").
//   monthly -> N-ésima ocorrência do mês; `date` é a data concreta, re-datada
//              pelo agent a cada mês a partir de `weekday` + `ordinal`.
//   once    -> data única; o agent apaga depois que `date` passa.
const CommitmentSchema = new Schema(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    day: { type: String, required: true, trim: true },
    time: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    order: { type: Number, required: true },
    repeat: {
      type: String,
      required: true,
      enum: ["weekly", "monthly", "once"],
      default: "once",
    },
    weekday: { type: Number, min: 0, max: 6, default: null },
    ordinal: { type: Schema.Types.Mixed, default: null },
    date: { type: Date, default: null },
  },
  { timestamps: true },
);

// Listagem do mural sempre na ordem curada.
CommitmentSchema.index({ order: 1 });
// A virada de mês do agent filtra por modo de repetição.
CommitmentSchema.index({ repeat: 1 });

export const CommitmentModel = createInstanceMongoose(
  "commitments",
  CommitmentSchema,
);
