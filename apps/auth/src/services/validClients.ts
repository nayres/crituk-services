export const validClients: Record<string, string> = {
  "user-service": process.env.USER_SERVICE_SECRET || "",
  "follow-service": process.env.FOLLOW_SERVICE_SECRET || "",
};
