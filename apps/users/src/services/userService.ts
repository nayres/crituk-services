import path from "path";
import { v4 as uuidv4 } from "uuid";
import { CritukError, ErrorCodes, handleError } from "@org/errors";
import { omitKeys, getCurrentISODate } from "@org/utils";
import { UserRepository } from "../repositories";
import { CreateUserInput, IUser } from "../types";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * @description Fetches a list of all users from the user repository.
   *
   * @returns {Promise<IUser[] | undefined>} - Resolves to an array of user records, if successful.
   *
   * @throws {CritukError} - Throws a standardized error response if an unexpected error occurs during the fetch operation.
   */
  listUsers = async () => {
    try {
      return await this.userRepository.listAll();
    } catch (error) {
      throw handleError(
        "An unexpected error occurred while fetching account.",
        ErrorCodes.SERVICE.UNEXPECTED_ERROR,
        500
      );
    }
  };

  /**
   * @description Retrieves a user by their unique Id.
   *
   * @param {string} userId - The unique identifier of the user to retrieve.
   *
   * @returns {Promise<IUser | null>} - Resolves to the user object if found, otherwise returns null.
   *
   * @throws {CritukError} - Throws a `NOT_FOUND` error if the user does not exist or a generic `UNEXPECTED_ERROR` if any
   * unexpected error occurs during execution.
   */
  getUserById = async (userId: string) => {
    try {
      const user = await this.userRepository.findOneBy({
        keyConditionExpression: "id = :id",
        expressionAttributeValues: { ":id": userId },
      });

      if (!user.Items?.length) {
        throw handleError(
          `User does not exist. Id: ${userId}.`,
          ErrorCodes.SERVICE.NOT_FOUND,
          404
        );
      }

      return user?.Items ? user.Items[0] : null;
    } catch (error: any) {
      if (!(error instanceof CritukError)) {
        throw handleError(
          "An unexpected error occurred while fetching account.",
          ErrorCodes.SERVICE.UNEXPECTED_ERROR,
          500
        );
      }

      throw error;
    }
  };

  /**
   * @description Retrieves a user by their email address.
   *
   * @param {string} email - The email address to search for the user.
   *
   * @returns {Promise<IUser | null>} - Resolves to the user object if found, otherwise returns null.
   *
   * @throws {CritukError} - Throws a `NOT_FOUND` error if the user does not exist or a generic `UNEXPECTED_ERROR`
   * if any unexpected error occurs during execution.
   */
  getUserByEmail = async (email: string) => {
    try {
      const user = await this.userRepository.findOneBy({
        keyConditionExpression: "email = :email",
        expressionAttributeValues: { ":email": email },
        indexName: "email-index",
      });

      if (!user.Items?.length) {
        throw handleError(
          `User does not exist. Email: ${email}.`,
          ErrorCodes.SERVICE.NOT_FOUND,
          404
        );
      }

      return user?.Items ? user.Items[0] : null;
    } catch (error) {
      if (!(error instanceof CritukError)) {
        throw handleError(
          "An unexpected error occurred while fetching account.",
          ErrorCodes.SERVICE.UNEXPECTED_ERROR,
          500
        );
      }

      throw error;
    }
  };

  /**
   * @description Retrieves a user by their username.
   *
   * @param {string} username - The username to search for in the user database.
   *
   * @returns {Promise<IUser | null>} - Resolves to the user object if found, otherwise returns null.
   *
   * @throws {CritukError} - Throws a `NOT_FOUND` error if no user with the provided username exists, or a generic
   * `UNEXPECTED_ERROR` if any other unexpected issue occurs during execution.
   */
  getUserByUsername = async (username: string) => {
    try {
      const user = await this.userRepository.findOneBy({
        keyConditionExpression: "username = :username",
        expressionAttributeValues: { ":username": username },
        indexName: "username-index",
      });

      if (!user.Items?.length) {
        throw handleError(
          `User does not exist. Username: ${username}.`,
          ErrorCodes.SERVICE.NOT_FOUND,
          404
        );
      }

      return user?.Items ? user.Items[0] : null;
    } catch (error) {
      if (!(error instanceof CritukError)) {
        throw handleError(
          "An unexpected error occurred while fetching account.",
          ErrorCodes.SERVICE.UNEXPECTED_ERROR,
          500
        );
      }

      throw error;
    }
  };

  /**
   * @description Deletes a user account from the database and removes their associated profile image if present.
   *
   * @param {string} userId - The unique identifier of the user to delete.
   *
   * @returns {Promise<any>} - Resolves with the result of the database delete operation if successful.
   *
   * @throws {CritukError} - Throws a `NOT_FOUND` error if the user doesn't exist, or a generic `UNEXPECTED_ERROR` if
   * any unexpected issue occurs during execution.
   */
  deleteUser = async (userId: string) => {
    try {
      const user = await this.getUserById(userId);

      if (!user) {
        throw handleError(
          "User does not exist and cannot be deleted.",
          ErrorCodes.SERVICE.NOT_FOUND,
          404
        );
      }

      const { id, profile_image } = user;

      if (profile_image) {
        await this.deleteProfileImage(profile_image);
      }

      return await this.userRepository.deleteOne(id);
    } catch (error) {
      if (!(error instanceof CritukError)) {
        throw handleError(
          "An unexpected error occurred while deleting account.",
          ErrorCodes.SERVICE.UNEXPECTED_ERROR,
          500
        );
      }

      throw error;
    }
  };

  /**
   * @description Handles the creation of a new user account while ensuring uniqueness of email and username.
   *
   * @param {CreateUserInput} user - The input data for creating a new user account.
   *
   * @returns {Promise<IUser>} - Resolves with the newly created user information without exposing sensitive data like passwords.
   *
   * @throws {CritukError} - Throws a `EMAIL_EXISTS` or `USERNAME_EXISTS` error if conflicts are found.
   * @throws {UNEXPECTED_ERROR} - Throws a generic unexpected server error for other failure scenarios.
   */
  createUser = async (user: CreateUserInput) => {
    try {
      const userWithExistingEmail = await this.userRepository.findOneBy({
        keyConditionExpression: "email = :email",
        expressionAttributeValues: { ":email": user.email },
        indexName: "email-index",
      });

      if (userWithExistingEmail.Items?.length) {
        throw handleError(
          `User already exists. Email: ${user.email}`,
          ErrorCodes.SERVICE.EMAIL_EXISTS,
          409
        );
      }

      const userWithExistingUsername = await this.userRepository.findOneBy({
        keyConditionExpression: "username = :username",
        expressionAttributeValues: { ":username": user.username },
        indexName: "username-index",
      });

      if (userWithExistingUsername.Items?.length) {
        throw handleError(
          `User already exists. Username: ${user.username}`,
          ErrorCodes.SERVICE.USERNAME_EXISTS,
          409
        );
      }

      const newUser: IUser = {
        ...user,
        id: uuidv4(),
        created_at: getCurrentISODate(),
        profile_image: null,
        bio: "",
        currently_watching: null,
        follower_count: 0,
        following_count: 0,
        reviews: [],
      };

      await this.userRepository.create(newUser);

      return omitKeys(newUser, "password");
    } catch (error: any) {
      if (!(error instanceof CritukError)) {
        throw handleError(
          "An unexpected error occurred while creating account.",
          ErrorCodes.SERVICE.UNEXPECTED_ERROR,
          500
        );
      }

      throw error;
    }
  };

  /**
   * @description Handles updating user account information.
   *
   * @param {string} userId - The unique identifier of the user to be updated.
   * @param {Partial<IUser>} userData - The partial data for updating the user. Only provided fields will be updated.
   *
   * @returns {Promise<any>} - Resolves with the result of the update operation.
   *
   * @throws {CritukError} - Throws a system specific unexpected server error in case of failure.
   */
  updateUser = async (userId: string, userData: Partial<IUser>) => {
    try {
      return await this.userRepository.updateOne(userId, {
        ...userData,
        updated_at: getCurrentISODate(),
      });
    } catch (error) {
      throw handleError(
        "An unexpected error occurred while updating account.",
        ErrorCodes.SERVICE.UNEXPECTED_ERROR,
        500
      );
    }
  };

  /**
   * @description Handles uploading a user's profile image.
   *
   * @param {string} userId - The unique identifier of the user whose profile image is being uploaded.
   * @param {Express.Multer.File} file - The uploaded file object received from the request.
   *
   * @returns {Promise<string>} - Resolves with the uploaded image's path or URL.
   *
   * @throws {CritukError} - Throws a system specific error if any unexpected error occurs during the upload process.
   */
  uploadProfileImage = async (userId: string, file: Express.Multer.File) => {
    try {
      const fileExt = path.extname(file.originalname);
      const uniqueFileName = `profile-image/${userId}${fileExt}`;
      const imagePath = await this.userRepository.uploadProfileImage(
        uniqueFileName,
        file.buffer,
        file.mimetype
      );
      await this.updateUser(userId, { profile_image: imagePath });
      return imagePath;
    } catch (error) {
      throw handleError(
        "An unexpected error occurred while uploading profile image.",
        ErrorCodes.AWS.UNEXPECTED_ERROR,
        500
      );
    }
  };

  /**
   * @description Handles deletion of a user's profile image from the storage service.
   *
   * @param {string} profileImageKey - The unique key identifying the profile image to delete from the storage service.
   *
   * @throws {CritukError} - Throws a system specific error if any unexpected error occurs during the deletion process.
   */
  deleteProfileImage = async (profileImageKey: string) => {
    try {
      await this.userRepository.deleteProfileImage(profileImageKey);
    } catch (error) {
      if (!(error instanceof CritukError)) {
        throw handleError(
          "An unexpected error occurred while creating account.",
          ErrorCodes.SERVICE.UNEXPECTED_ERROR,
          500
        );
      }

      throw error;
    }
  };
}
