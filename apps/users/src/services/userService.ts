import path from "path";
import { v4 as uuidv4 } from "uuid";
import { CritukError, ErrorCodes } from "@org/errors";
import { UserRepository } from "../repositories";
import { omitKeys, getCurrentISODate } from "../utils";
import { CreateUserInput, IUser } from "../types";

export class UserService {
  userRepository: UserRepository;

  constructor(userRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  private async checkUserExists(email: string, username: string) {
    const existingEmail = await this.userRepository.findOneBy({
      keyConditionExpression: "email = :email",
      expressionAttributeValues: { ":email": email },
      indexName: "email-index",
    });

    if (existingEmail.Items?.length) {
      throw new CritukError(
        `User already exists. Email: ${email}`,
        ErrorCodes.SERVICE.EMAIL_EXISTS,
        409
      );
    }

    const existingUsername = await this.userRepository.findOneBy({
      keyConditionExpression: "username = :username",
      expressionAttributeValues: { ":username": username },
      indexName: "username-index",
    });

    if (existingUsername.Items?.length) {
      throw new CritukError(
        `User already exists. Username: ${username}`,
        ErrorCodes.SERVICE.USERNAME_EXISTS,
        409
      );
    }
  }

  listUsers = async () => {
    return await this.userRepository.listAll();
  };

  getUserById = async (userId: string) => {
    try {
      const user = await this.userRepository.findOneBy({
        keyConditionExpression: "id = :id",
        expressionAttributeValues: { ":id": userId },
      });

      if (!user.Items?.length) {
        throw new CritukError(
          `User does not exist. Id: ${userId}.`,
          ErrorCodes.SERVICE.NOT_FOUND,
          404
        );
      }

      return user?.Items ? user.Items[0] : null;
    } catch (error) {
      if (error instanceof CritukError) {
        throw error;
      }

      throw new CritukError(
        `An unexpected error occurred while fetching account.`,
        ErrorCodes.SERVICE.UNEXPECTED_ERROR,
        500
      );
    }
  };

  getUserByEmail = async (email: string) => {
    try {
      const user = await this.userRepository.findOneBy({
        keyConditionExpression: "email = :email",
        expressionAttributeValues: { ":email": email },
        indexName: "email-index",
      });

      if (!user.Items?.length) {
        throw new CritukError(
          `User does not exist. Email: ${email}.`,
          ErrorCodes.SERVICE.USERNAME_NOT_EXIST,
          404
        );
      }

      return user?.Items ? user.Items[0] : null;
    } catch (error) {
      if (error instanceof CritukError) {
        throw error;
      }

      throw new CritukError(
        `An unexpected error occurred while fetching the user.`,
        ErrorCodes.SERVICE.UNEXPECTED_ERROR,
        500
      );
    }
  };

  getUserByUsername = async (username: string) => {
    try {
      const user = await this.userRepository.findOneBy({
        keyConditionExpression: "username = :username",
        expressionAttributeValues: { ":username": username },
        indexName: "username-index",
      });

      if (!user.Items?.length) {
        throw new CritukError(
          `User does not exist. Username: ${username}.`,
          ErrorCodes.SERVICE.NOT_FOUND,
          404
        );
      }

      return user?.Items ? user.Items[0] : null;
    } catch (error) {
      if (error instanceof CritukError) {
        throw error;
      }

      throw new CritukError(
        `An unexpected error occurred while fetching the user.`,
        ErrorCodes.SERVICE.UNEXPECTED_ERROR,
        500
      );
    }
  };

  deleteUser = async (userId: string) => {
    try {
      const user = await this.getUserById(userId);

      if (!user) {
        throw new CritukError(
          `User does not exist and cannot be deleted.`,
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
      if (error instanceof CritukError) {
        throw error;
      }

      throw new CritukError(
        `An unexpected error occurred while deleting account.`,
        ErrorCodes.SERVICE.UNEXPECTED_ERROR,
        500
      );
    }
  };

  createUser = async (user: CreateUserInput) => {
    try {
      await this.checkUserExists(user.email, user.username);

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
    } catch (error) {
      if (error instanceof CritukError) {
        throw error;
      }

      throw new CritukError(
        `An unexpected error occurred while deleting account.`,
        ErrorCodes.SERVICE.UNEXPECTED_ERROR,
        500
      );
    }
  };

  updateUser = async (userId: string, userData: Partial<IUser>) => {
    try {
      return await this.userRepository.updateOne(userId, {
        ...userData,
        updated_at: getCurrentISODate(),
      });
    } catch (error) {
      throw new CritukError(
        `An unexpected error occurred while updating account.`,
        ErrorCodes.SERVICE.UNEXPECTED_ERROR,
        500
      );
    }
  };

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
      throw new CritukError(
        `An unexpected error occurred while uploading profile image.`,
        ErrorCodes.AWS.UNEXPECTED_ERROR,
        500
      );
    }
  };

  deleteProfileImage = async (profileImageKey: string) => {
    try {
      return await this.userRepository.deleteProfileImage(profileImageKey);
    } catch (error) {
      throw new CritukError(
        `An unexpected error occurred while deleting profile image.`,
        ErrorCodes.AWS.UNEXPECTED_ERROR,
        500
      );
    }
  };
}
