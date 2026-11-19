export type AuthUser = {
  id: string;
  email: string;
  name: string;
  photo: string | null;
  roles: Array<{ id: string; name: string }>;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
