import { CritukError, ErrorCodes, handleError } from "@org/errors";
import { followRepository } from "../repositories";

export const followService = {
  getFollowed: async (id: string) => {
    try {
      return await followRepository.getAllFollowed(id);
    } catch (error: any) {
      console.error(error.stack);
      if (!(error instanceof CritukError)) {
        throw handleError(
          "An unexpected error occurred while fetching followers.",
          ErrorCodes.SERVICE.UNEXPECTED_ERROR,
          500
        );
      }

      throw error;
    }
  },
  getFollowing: async (id: string) => {
    try {
      return await followRepository.getAllFollowing(id);
    } catch (error) {
      if (!(error instanceof CritukError)) {
        throw handleError(
          "An unexpected error occurred while fetching following.",
          ErrorCodes.SERVICE.UNEXPECTED_ERROR,
          500
        );
      }

      throw error;
    }
  },
  follow: async (userFollowing: string, userFollowed: string) => {
    try {
      const newRelationship = {
        userFollowing,
        userFollowed,
        followed_at: new Date().toISOString(),
      };
      return await followRepository.createFollow(newRelationship);
    } catch (error: any) {
      if (!(error instanceof CritukError)) {
        throw handleError(
          "An unexpected error occurred while following.",
          ErrorCodes.SERVICE.UNEXPECTED_ERROR,
          500
        );
      }

      throw error;
    }
  },
  unfollow: async (userFollowing: string, userFollowed: string) => {
    try {
      return await followRepository.deleteFollow(userFollowing, userFollowed);
    } catch (error: any) {
      console.error(error.stack);
      if (!(error instanceof CritukError)) {
        throw handleError(
          "An unexpected error occurred while unfollowing.",
          ErrorCodes.SERVICE.UNEXPECTED_ERROR,
          500
        );
      }

      throw error;
    }
  },
};
