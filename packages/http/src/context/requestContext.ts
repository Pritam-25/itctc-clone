import { AsyncLocalStorage } from "async_hooks";

type RequestContext = {
  requestId?: string;
};

const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export const runWithRequestContext = <T>(
  context: RequestContext,
  fn: () => T,
): T => requestContextStorage.run(context, fn);

export const setRequestContext = (context: RequestContext): void => {
  requestContextStorage.enterWith(context);
};

export const getRequestContext = (): RequestContext | undefined =>
  requestContextStorage.getStore();
