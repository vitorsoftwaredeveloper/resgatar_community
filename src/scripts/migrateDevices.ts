import mongoose from "mongoose";
import { db } from "../db";
import "../models/Member";
import "../models/Device";

const MEMBERS_MODEL_NAME = "members";
const DEVICES_MODEL_NAME = "devices";

const isDryRun = process.argv.includes("--dry-run");
const shouldDropLegacy = process.argv.includes("--drop-legacy");

const WITH_TOKENS_FILTER = { "pushTokens.0": { $exists: true } };
const LEGACY_FIELD_FILTER = { pushTokens: { $exists: true } };

const getCollection = (name: string) => mongoose.model(name).collection;

const copyTokensToDevices = async (): Promise<number> => {
  const members = await getCollection(MEMBERS_MODEL_NAME)
    .find(WITH_TOKENS_FILTER, { projection: { pushTokens: 1 } })
    .toArray();

  const devices = getCollection(DEVICES_MODEL_NAME);
  const now = new Date();
  let copied = 0;

  for (const member of members) {
    for (const token of (member.pushTokens ?? []) as string[]) {
      if (!token) continue;

      await devices.updateOne(
        { token },
        {
          $set: {
            memberId: member._id,
            token,
            client: "native",
            installed: true,
            lastUsedAt: now,
            updatedAt: now,
          },
          $setOnInsert: { platform: null, createdAt: now },
        },
        { upsert: true },
      );

      copied += 1;
    }
  }

  return copied;
};

const dropLegacyField = async (): Promise<number> => {
  const result = await getCollection(MEMBERS_MODEL_NAME).updateMany(
    LEGACY_FIELD_FILTER,
    { $unset: { pushTokens: "" } },
  );

  return result.modifiedCount;
};

const reportPlan = async () => {
  const members = getCollection(MEMBERS_MODEL_NAME);

  const total = await members.countDocuments({});
  const withTokens = await members.countDocuments(WITH_TOKENS_FILTER);
  const existingDevices = await getCollection(
    DEVICES_MODEL_NAME,
  ).countDocuments({});

  console.log("Total members:", total);
  console.log("Members carrying push tokens:", withTokens);
  console.log("Devices already stored:", existingDevices);
};

const execute = async () => {
  console.log("IN - migrateDevices", { isDryRun, shouldDropLegacy });

  const connection = await db();

  if (!connection) {
    throw new Error("Database connection failed, aborting migration");
  }

  console.log("Database:", mongoose.connection.name);
  console.log("Host:", mongoose.connection.host);

  await reportPlan();

  if (isDryRun) {
    console.log("Dry run, no documents were written");
    await mongoose.disconnect();
    console.log("OUT - migrateDevices");
    return;
  }

  const copied = await copyTokensToDevices();
  console.log("Tokens copied into the devices collection:", copied);

  if (shouldDropLegacy) {
    const dropped = await dropLegacyField();
    console.log("Members with the legacy pushTokens field removed:", dropped);
  } else {
    console.log(
      "Legacy pushTokens field kept, rerun with --drop-legacy after deploying",
    );
  }

  await mongoose.disconnect();

  console.log("OUT - migrateDevices");
};

execute().catch(async (error) => {
  console.error("migrateDevices failed:", error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
