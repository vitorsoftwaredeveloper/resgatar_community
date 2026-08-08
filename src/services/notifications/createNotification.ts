import { verifyAdmin } from "../helper";
import { INotification } from "../../types/notification";
import { sendNotificationToAllMembers } from "./sendNotification";

export const createNotificationService = async (
  adminId: string,
  notification: INotification,
): Promise<void> => {
  console.log("IN - createNotificationService");

  try {
    await verifyAdmin(adminId);

    await sendNotificationToAllMembers({
      title: notification.title,
      body: notification.description,
    });
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - createNotificationService");
  }
};
