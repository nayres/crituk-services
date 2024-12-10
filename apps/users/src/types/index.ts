export interface IUser {
  id: string;
  password: string;
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

export type CreateUserInput = Pick<
  IUser,
  "email" | "username" | "password" | "first_name" | "last_name"
>;

export interface HttpRequest {
  body: any;
  query: any;
  params: any;
  user?: { id: string };
  file?: any;
}

export interface HttpResponse {
  status: (code: number) => this;
  json: (data: any) => void;
}

export interface NextFunction {
  (err?: any): void;
  (deferToNext: "router"): void;
  (deferToNext: "route"): void;
}
