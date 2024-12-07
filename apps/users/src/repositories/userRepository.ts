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
import { IUser } from "../types";

export class UserRepository {
  private tableName = "Users";
  constructor(
    private readonly docClient: DynamoDBDocumentClient,
    private readonly s3Client: S3Client
  ) {}

  /**
   * @description Retrieves all records from the DynamoDB table.
   *
   * This function performs a full table scan using the `ScanCommand`. It retrieves all items stored
   * in the table, unmarshalls them into their respective JavaScript objects, and returns them.
   *
   * @returns {Promise<IUser[] | undefined>} - Resolves to an array of user objects if records exist; otherwise, undefined.
   *
   * @throws {Error} - Throws an error if the scan operation fails due to misconfiguration, permissions issues, or network failure.
   */
  listAll = async () => {
    const command = new ScanCommand({ TableName: this.tableName });
    const result = await this.docClient.send(command);

    return result?.Items?.map((user) => unmarshall(user));
  };

  /**
   * @description Queries a single record in the DynamoDB table based on specified key conditions.
   *
   * This function uses `QueryCommand` to find a single record in the DynamoDB table that satisfies
   * the provided key condition expression. Optionally, a specific index can be used if specified.
   *
   * @param {Object} options - The query parameters.
   * @param {string} options.keyConditionExpression - The key condition expression to determine query constraints.
   * @param {Record<string, any>} options.expressionAttributeValues - The values associated with placeholders in the key condition expression.
   * @param {string} [options.indexName] - (Optional) The name of the index to query against if using a Global Secondary Index.
   *
   * @returns {Promise<any>} - Resolves to the results of the query, containing matching records if found.
   *
   * @throws {Error} - Throws an error if the query fails, such as due to permissions issues, misconfiguration, or network failure.
   */
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

  /**
   * @description Creates a new user record in the DynamoDB table.
   *
   * This function performs an insert operation into the DynamoDB table with the provided user data.
   * It uses the `PutCommand` to add the `user` object to the table. If the `user` already exists,
   * it will overwrite the existing record with the same primary key.
   *
   * @param {IUser} user - The user object to create in the DynamoDB table. Must adhere to the `IUser` schema.
   *
   * @returns {Promise<any>} - Resolves to the result of the create operation, which includes metadata about the operation.
   *
   * @throws {Error} - Throws an error if the operation fails, such as a permissions issue or database connectivity problem.
   */
  create = async (user: IUser) => {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: user,
    });
    return await this.docClient.send(command);
  };

  /**
   * @description Deletes a user from the DynamoDB table based on their unique identifier.
   *
   * Executes a delete operation for the provided `userId`. The deletion is performed by specifying
   * the table name and the primary key of the user to delete.
   *
   * @param {string} userId - The unique identifier of the user to delete.
   *
   * @returns {Promise<any>} - Resolves to the result of the delete operation. Typically includes metadata about the operation.
   *
   * @throws {Error} - Throws an error if the delete operation fails.
   */
  deleteOne = async (userId: string) => {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { id: userId },
    });
    return await this.docClient.send(command);
  };

  /**
   * @description Updates a user's data in the DynamoDB table.
   *
   * Dynamically constructs an update expression and performs an update operation
   * based on the provided fields to change. Only the fields specified in `updatedUserData`
   * will be updated in the table for the given userId.
   *
   * @param {string} userId - The unique identifier of the user to update.
   * @param {Partial<IUser>} updatedUserData - The user fields to update. Only the provided fields are updated.
   *
   * @returns {Promise<IUser | undefined>} - Resolves to the updated user data if the operation is successful; otherwise undefined.
   *
   * @throws {Error} - Throws an error if the update operation fails.
   */
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

  /**
   * @description Uploads a profile image to an S3 bucket.
   *
   * @param {string} key - The key (path/identifier) under which the image will be stored in the bucket.
   * @param {Buffer} body - The binary data of the image to be uploaded.
   * @param {string} contentType - The MIME type of the image (e.g., "image/jpeg" or "image/png").
   *
   * @returns {Promise<string>} - Resolves with the key of the uploaded image upon success.
   *
   * @throws {Error} - Throws an error if the upload fails.
   */
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

  /**
   * @description Deletes a profile image from the S3 bucket.
   *
   * @param {string} key - The key (path/identifier) of the image to delete from the bucket.
   *
   * @returns {Promise<void>} - Resolves when the deletion is successful.
   *
   * @throws {Error} - Throws an error if the deletion fails.
   */
  deleteProfileImage = async (key: string) => {
    const command = new DeleteS3ObjectCommand({
      Bucket: process.env.AWS_PROFILE_IMAGE_S3_NAME,
      Key: key,
    });

    await this.s3Client.send(command);
  };
}
