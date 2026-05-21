// apps/backend/src/types/gql-context.ts
export type GqlContext = {
  req: {
    cookies: Record<string, string>;
    headers: Record<string, string | string[] | undefined>;
    user?: Record<string, unknown>;
  };
  res: {
    setHeader: (name: string, value: string | string[]) => void;
    cookie: (
      name: string,
      value: string,
      options?: Record<string, unknown>,
    ) => void;
    clearCookie: (name: string, options?: Record<string, unknown>) => void;
  };
};
