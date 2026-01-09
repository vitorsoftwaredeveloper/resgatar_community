type INotificationType = "info" | "success" | "warning";

export interface INotification {
  title: string;
  description: string;
  type: INotificationType;
  isNew: boolean;
  createdAt: Date;
}
