const registry: Record<string, string> = {};

/**
 * Registers a set of error messages into the global registry.
 * This allows service-specific error codes to be resolved to human-readable messages
 * by the shared @irctc/errors package.
 */
export const registerErrorMessages = (
  messages: Record<string, string>,
): void => {
  Object.assign(registry, messages);
};

/**
 * Retrieves a message from the registry for a given error code.
 */
export const getMessageFromRegistry = (code: string): string | undefined => {
  return registry[code];
};
