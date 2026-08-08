export interface INotification {
  title: string;
  description: string;
}

export interface INotificationPayload {
  title: string;
  body: string;
  link?: string;
  data?: Record<string, string>;
}

export interface ITokenSendResult {
  token: string;
  success: boolean;
  invalidToken: boolean;
  error?: string;
}
