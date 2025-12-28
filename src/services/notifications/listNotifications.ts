import { INotification } from "../../types/notification";
import { NotificationModel } from "../../models/Notification";

export const listNotificationService = async (): Promise<
  Array<INotification>
> => {
  console.log("IN - listNotificationService");

  try {
    const notifications: Array<INotification> = await NotificationModel.find(
      {},
      {},
      { sort: { createdAt: -1 }, lean: true }
    );

    const TEN_DAYS_IN_MS = 10 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    return notifications.map((notification) => {
      const createdAt = new Date(notification.createdAt).getTime();

      return {
        ...notification,
        isNew: now - createdAt <= TEN_DAYS_IN_MS,
      };
    });
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - listNotificationService");
  }
};
