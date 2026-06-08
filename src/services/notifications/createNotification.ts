import { verifyAdmin } from "../helper";
import { INotification } from "../../types/notification";
import { NotificationModel } from "../../models/Notification";
import { sendPushNotificationToAll } from "../../integrations/firebase";

export const createNotificationService = async (
  adminId: string,
  notification: INotification,
): Promise<void> => {
  console.log("IN - createNotificationService");

  try {
    await verifyAdmin(adminId);

    await sendPushNotificationToAll(
      notification.title,
      notification.description,
    );
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - createNotificationService");
  }
};
