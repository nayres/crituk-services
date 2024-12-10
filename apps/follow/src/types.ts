export interface HttpRequest {
  body: any;
  query: any;
  params: any;
  user?: { id: string };
  client_id?: string;
  file?: any;
}

export interface HttpResponse {
  status: (code: number) => this;
  json: (data: any) => void;
}

export interface Relationship {
  userFollowing: string;
  userFollowed: string;
  followed_at: string;
}

export interface NextFunction {
  (err?: any): void;
  (deferToNext: "router"): void;
  (deferToNext: "route"): void;
}
