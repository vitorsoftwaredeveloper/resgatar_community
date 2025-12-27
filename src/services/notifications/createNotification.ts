import { verifyAdmin } from "../helper";
import { INotification } from "../../types/notification";
import { NotificationModel } from "../../models/Notification";

export const createNotificationService = async (
  adminId: string,
  notification: INotification
): Promise<void> => {
  console.log("IN - createNotificationService");

  try {
    await verifyAdmin(adminId);

    await NotificationModel.insertOne({
      ...notification,
      type: notification.type ? notification.type : "info",
    });
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - createNotificationService");
  }
};
