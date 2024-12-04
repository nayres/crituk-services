import Joi from "joi";

export const userSchema = Joi.object({
  id: Joi.string(),
  first_name: Joi.string().min(2),
  last_name: Joi.string().min(2),
  email: Joi.string().email({
    minDomainSegments: 2,
    tlds: { allow: ["com", "net"] },
  }),
  username: Joi.string().min(3).max(20),
  profile_image: Joi.string(),
  bio: Joi.string().max(150),
  following_count: Joi.number(),
  follower_count: Joi.number(),
  reviews: Joi.array(),
  currently_watching: Joi.string(),
});
