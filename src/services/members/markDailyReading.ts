import { MemberModel } from "../../models/Member";

function todayDateKey(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function yesterdayDateKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export interface IReadingStreak {
  currentStreak: number;
  longestStreak: number;
  lastReadAt: string | null;
  alreadyDoneToday: boolean;
}

export const markDailyReadingService = async (
  memberId: string,
): Promise<IReadingStreak> => {
  console.log("IN - markDailyReadingService");

  try {
    const member = await MemberModel.findById(memberId, {}, { lean: true });
    if (!member) throw { statusCode: 404, message: "Member not found" };

    const streak = (member as any).readingStreak ?? {
      currentStreak: 0,
      longestStreak: 0,
      lastReadAt: null,
    };

    const today = todayDateKey();
    const yesterday = yesterdayDateKey();

    if (streak.lastReadAt === today) {
      return { ...streak, alreadyDoneToday: true };
    }

    const newCurrent =
      streak.lastReadAt === yesterday ? streak.currentStreak + 1 : 1;

    const newLongest = Math.max(streak.longestStreak ?? 0, newCurrent);

    const updated = {
      currentStreak: newCurrent,
      longestStreak: newLongest,
      lastReadAt: today,
    };

    await MemberModel.updateOne(
      { _id: memberId },
      { $set: { readingStreak: updated } },
    );

    return { ...updated, alreadyDoneToday: false };
  } finally {
    console.log("OUT - markDailyReadingService");
  }
};
