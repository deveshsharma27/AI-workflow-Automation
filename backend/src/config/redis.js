const IORedis = require("ioredis");

const redisConnection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  // ✅ TLS required for cloud Redis (Upstash, Redis Cloud, etc.)
  tls: process.env.REDIS_URL && process.env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
});

redisConnection.on("connect", () => {
  console.log("Redis Connected");
});

redisConnection.on("error", (err) => {
  console.error("Redis Error:", err.message);
});

module.exports = redisConnection;