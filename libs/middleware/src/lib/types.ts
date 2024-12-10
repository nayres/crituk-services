export interface HttpRequest {
  body: any;
  query: any;
  params: any;
  user?: { id: string };
  client_id?: string;
  file?: any;
  headers: any;
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

export interface Relationship {
  userFollowing: string;
  userFollowed: string;
  followed_at: string;
}
