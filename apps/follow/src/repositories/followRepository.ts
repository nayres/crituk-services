import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { createDynamoDBClient } from "@org/clients";
import { Relationship } from "../types";

const TABLE_NAME = "Follow";
const dynamoDBClient = createDynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoDBClient);

export const followRepository = {
  getAllFollowing: async (id: string) => {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "userFollowing = :user",
      ExpressionAttributeValues: {
        ":user": id,
      },
    });

    return await docClient.send(command);
  },
  getAllFollowed: async (id: string) => {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "followed-index",
      KeyConditionExpression: "userFollowed = :user",
      ExpressionAttributeValues: {
        ":user": id,
      },
    });

    return await docClient.send(command);
  },
  createFollow: async (relationship: Relationship) => {
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: relationship,
    });

    return await docClient.send(command);
  },
  deleteFollow: async (userFollowing: string, userFollowed: string) => {
    try {
      const command = new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          userFollowing,
          userFollowed,
        },
        ConditionExpression:
          "attribute_exists(userFollowing) AND attribute_exists(userFollowed)",
      });

      return await docClient.send(command);
    } catch (error: any) {
      if (error.name === "ConditionalCheckFailedException") {
        console.error("Follow relationship does not exist.");
      } else {
        console.error("Error deleting follow relationship:", error);
      }
      throw error;
    }
  },
};
