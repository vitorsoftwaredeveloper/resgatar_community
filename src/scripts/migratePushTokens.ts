import mongoose from "mongoose";
import { db } from "../db";
import "../models/Member";

const MEMBERS_MODEL_NAME = "members";

const isDryRun = process.argv.includes("--dry-run");
const shouldDropLegacy = process.argv.includes("--drop-legacy");

const LEGACY_TOKEN_FILTER = { pushToken: { $type: "string", $ne: "" } };
const MISSING_ARRAY_FILTER = { pushTokens: { $exists: false } };
const LEGACY_FIELD_FILTER = { pushToken: { $exists: true } };

const getMembersCollection = () =>
  mongoose.model(MEMBERS_MODEL_NAME).collection;

const mergeLegacyTokenIntoArray = async (): Promise<number> => {
  const result = await getMembersCollection().updateMany(LEGACY_TOKEN_FILTER, [
    {
      $set: {
        pushTokens: {
          $setUnion: [{ $ifNull: ["$pushTokens", []] }, ["$pushToken"]],
        },
      },
    },
  ]);

  return result.modifiedCount;
};

const backfillEmptyArray = async (): Promise<number> => {
  const result = await getMembersCollection().updateMany(MISSING_ARRAY_FILTER, {
    $set: { pushTokens: [] },
  });

  return result.modifiedCount;
};

const dropLegacyField = async (): Promise<number> => {
  const result = await getMembersCollection().updateMany(LEGACY_FIELD_FILTER, {
    $unset: { pushToken: "" },
  });

  return result.modifiedCount;
};

const reportPlan = async () => {
  const collection = getMembersCollection();

  const total = await collection.countDocuments({});
  const withLegacyToken = await collection.countDocuments(LEGACY_TOKEN_FILTER);
  const missingArray = await collection.countDocuments(MISSING_ARRAY_FILTER);
  const withLegacyField = await collection.countDocuments(LEGACY_FIELD_FILTER);

  console.log("Total members:", total);
  console.log("Members with a legacy pushToken to merge:", withLegacyToken);
  console.log("Members missing the pushTokens array:", missingArray);
  console.log("Members still carrying the legacy field:", withLegacyField);
};

const execute = async () => {
  console.log("IN - migratePushTokens", { isDryRun, shouldDropLegacy });

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
    console.log("OUT - migratePushTokens");
    return;
  }

  const merged = await mergeLegacyTokenIntoArray();
  console.log("Members with legacy token merged into pushTokens:", merged);

  const backfilled = await backfillEmptyArray();
  console.log("Members backfilled with empty pushTokens:", backfilled);

  if (shouldDropLegacy) {
    const dropped = await dropLegacyField();
    console.log("Members with legacy pushToken field removed:", dropped);
  } else {
    console.log(
      "Legacy pushToken field kept, rerun with --drop-legacy after deploying",
    );
  }

  await mongoose.disconnect();

  console.log("OUT - migratePushTokens");
};

execute().catch(async (error) => {
  console.error("migratePushTokens failed:", error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
