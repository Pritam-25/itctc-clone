--[[
  Token Bucket Rate Limiter — Atomic Redis Lua Script

  Uses redis.call("TIME") for a single authoritative clock so multi-node
  deployments refill tokens against the same timeline regardless of
  application-instance clock skew.

  KEYS[1] = rate limit key (e.g. "rl:user:123")
  ARGV[1] = capacity (max tokens)
  ARGV[2] = refillPerSec (tokens added per second)

  Returns: { allowed (0|1), remaining (int), resetMs (int) }
]]

local key          = KEYS[1]
local capacity     = tonumber(ARGV[1])
local refillPerSec = tonumber(ARGV[2])

-- Use Redis server time as the single authoritative clock
local timeResult = redis.call("TIME")
local nowMs      = tonumber(timeResult[1]) * 1000 + math.floor(tonumber(timeResult[2]) / 1000)

-- Read current state
local tokens     = tonumber(redis.call("HGET", key, "tokens"))
local lastRefill = tonumber(redis.call("HGET", key, "lastRefill"))

-- First request: initialise bucket to full capacity
if tokens == nil then
  tokens     = capacity
  lastRefill = nowMs
end

-- Refill based on elapsed time
local elapsedMs = math.max(0, nowMs - lastRefill)
local elapsedSec = elapsedMs / 1000.0
local refill = elapsedSec * refillPerSec
tokens = math.min(capacity, tokens + refill)
lastRefill = nowMs

-- Try to consume one token
local allowed   = 0
local remaining = math.floor(tokens)
local resetMs   = 0

if tokens >= 1 then
  tokens    = tokens - 1
  allowed   = 1
  remaining = math.floor(tokens)
else
  -- Time until 1 token is available
  local deficit = 1 - tokens
  resetMs = math.ceil((deficit / refillPerSec) * 1000)
end

-- Persist state
redis.call("HSET", key, "tokens", tostring(tokens), "lastRefill", tostring(lastRefill))

-- Set TTL so idle keys auto-expire: bucket-fill-time + 1 second buffer
local ttlSec = math.ceil(capacity / refillPerSec) + 1
redis.call("EXPIRE", key, ttlSec)

return { allowed, remaining, resetMs }
