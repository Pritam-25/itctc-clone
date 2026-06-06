export type ErrorContract = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
