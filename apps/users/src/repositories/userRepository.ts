import { ScanCommand } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import {
  PutObjectCommand as PutS3ObjectCommand,
  DeleteObjectCommand as DeleteS3ObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { dynamoClient, s3Client } from "../utils/clients";
import { IUser } from "../types";

export class UserRepository {
  private tableName = "Users";
  docClient: DynamoDBDocumentClient;
  s3Client: S3Client;

  constructor(docClient?: DynamoDBDocumentClient, S3Client?: S3Client) {
    this.docClient = docClient || DynamoDBDocumentClient.from(dynamoClient);
    this.s3Client = S3Client || s3Client;
  }

  listAll = async () => {
    const command = new ScanCommand({ TableName: this.tableName });
    const result = await this.docClient.send(command);

    return result?.Items?.map((user) => unmarshall(user));
  };

  findOneBy = async (options: {
    keyConditionExpression: string;
    expressionAttributeValues: Record<string, any>;
    indexName?: string;
  }) => {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: options.keyConditionExpression,
      ExpressionAttributeValues: options.expressionAttributeValues,
      ...(options.indexName && { IndexName: options.indexName }), // Add IndexName if provided
    });
    return await this.docClient.send(command);
  };

  create = async (user: IUser) => {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: user,
    });
    return await this.docClient.send(command);
  };

  deleteOne = async (userId: string) => {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { id: userId },
    });
    return await this.docClient.send(command);
  };

  updateOne = async (userId: string, updatedUserData: Partial<IUser>) => {
    const updateExpression = Object.keys(updatedUserData)
      .map((key) => `${key} = :${key}`)
      .join(", ");
    const expressionAttributeValues = Object.fromEntries(
      Object.entries(updatedUserData).map(([key, value]) => [`:${key}`, value])
    );

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { id: userId },
      UpdateExpression: `SET ${updateExpression}`,
      ExpressionAttributeValues: expressionAttributeValues,
    });
    const result = await this.docClient.send(command);
    return result.Attributes;
  };

  uploadProfileImage = async (
    key: string,
    body: Buffer,
    contentType: string
  ) => {
    const command = new PutS3ObjectCommand({
      Bucket: process.env.AWS_PROFILE_IMAGE_S3_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: "public-read",
    });

    await this.s3Client.send(command);
    return key;
  };

  deleteProfileImage = async (key: string) => {
    const command = new DeleteS3ObjectCommand({
      Bucket: process.env.AWS_PROFILE_IMAGE_S3_NAME,
      Key: key,
    });

    await this.s3Client.send(command);
  };
}
