import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export const createDocumentClient = (dynamoClient: any) => {
  return DynamoDBDocumentClient.from(dynamoClient);
};
