export interface IUser {
  id: string;
  password: string | Buffer;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_image: string | null;
  bio: string;
  following_count: number;
  follower_count: number;
  reviews: string[];
  currently_watching: string | null;
  created_at: string;
  updated_at?: string;
}
