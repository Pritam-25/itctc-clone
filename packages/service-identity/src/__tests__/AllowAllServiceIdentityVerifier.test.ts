import { describe, it, expect, vi } from "vitest";
import { AllowAllServiceIdentityVerifier } from "../AllowAllServiceIdentityVerifier.js";
import type { LoggerLike } from "../types.js";

describe("AllowAllServiceIdentityVerifier", () => {
  it("should verify requests and return ok true with unknown serviceId", async () => {
    const mockLogger: LoggerLike = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const verifier = new AllowAllServiceIdentityVerifier(mockLogger);
    const headers = { "x-some-header": "value" };
    const result = await verifier.verify(headers);

    expect(result).toEqual({ ok: true, serviceId: "unknown" });
    expect(mockLogger.info).toHaveBeenCalledWith(
      {},
      expect.stringContaining(
        "AllowAllServiceIdentityVerifier: verifying request",
      ),
    );
  });

  it("should work without a logger", async () => {
    const verifier = new AllowAllServiceIdentityVerifier();
    const result = await verifier.verify({});
    expect(result).toEqual({ ok: true, serviceId: "unknown" });
  });
});
