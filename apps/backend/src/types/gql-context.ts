// apps/backend/src/types/gql-context.ts

type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
  domain?: string;
};

export type GqlContext = {
  req: {
    cookies: Record<string, string>;
    headers: Record<string, string | string[] | undefined>;
    user?: Record<string, unknown>;
    tenantId: number;
  };
  res: {
    setHeader: (name: string, value: string | string[]) => void;
    cookie: (name: string, value: string, options?: CookieOptions) => void;
    clearCookie: (name: string, options?: CookieOptions) => void;
  };
};
