import {
  KafkaConsumerRunner,
  RetryPolicies,
  createConsumer,
} from "@irctc/kafka";
import { env } from "@config/env.js";
import { logger } from "@irctc/logger";
import { getProducer, initKafka, kafka } from "@config/kafka.js";
import { redis } from "@config/redis.js";
import { getEmailVendor } from "@config/email.js";
import { IDEMPOTENCY_KEYS } from "@constants/idempotency.constants.js";
import { IdempotencyRepository } from "@repositories/idempotency.repository.js";
import { EmailProviderFactory } from "@providers/email/index.js";
import type { EmailProvider } from "@providers/email/email-provider.js";
import { OtpNotificationService } from "@services/otp-notification.service.js";
import { OtpRequestedConsumer } from "@consumers/otp-requested.consumer.js";

/**
 * Composition root for the notification service.
 *
 * Wires (in order):
 *   1. Kafka producer (kept warm; not currently used by the runner)
 *   2. Idempotency repository (Redis SETNX)
 *   3. Email provider (chosen via EmailProviderFactory + EMAIL_VENDOR env)
 *   4. OtpNotificationService (validate + dedupe + render + send)
 *   5. OtpRequestedConsumer (parses Buffer→JSON, calls service)
 *   6. KafkaConsumerRunner — generic connect + subscribe + run
 *
 * Construction order: build the runner (which needs the kafkajs
 * consumer) before the business consumer, so the business consumer
 * can take the runner via constructor injection.
 */
export const bootstrap = async () => {
  // 1. Producer kept warm so the producer manager returns a connected
  //    instance for any future DLQ writes (the current runner does not
  //    emit DLQ messages).
  await initKafka();
  const producer = await getProducer();

  // 2. Idempotency repository
  const idempotency = new IdempotencyRepository(
    redis,
    env.IDEMPOTENCY_TTL_SECONDS,
    IDEMPOTENCY_KEYS.OTP_REQUESTED,
  );

  // 3. Email provider (vendor picked from env)
  const email: EmailProvider = EmailProviderFactory.create(getEmailVendor(), {
    sendgridApiKey: env.SENDGRID_API_KEY,
    sendgridSender: env.SENDGRID_SENDER,
    logger,
  });

  // 4. Service
  const service = new OtpNotificationService(
    idempotency,
    email,
    env.OTP_TTL_SECONDS,
    logger,
  );

  // 5. KafkaJS consumer + generic runner. Retry config is service-side
  //    (kafkajs applies it inside the consumer instance, not at run()).
  const retryPolicy = RetryPolicies.custom({
    retries: env.KAFKA_RETRY_MAX_RETRIES,
    initialRetryTime: env.KAFKA_RETRY_INITIAL_MS,
    maxRetryTime: env.KAFKA_RETRY_MAX_MS,
  });
  const kafkaConsumer = createConsumer(
    kafka,
    env.KAFKA_CONSUMER_GROUP_ID,
    retryPolicy,
  );
  const runner = new KafkaConsumerRunner(kafkaConsumer, logger);

  // 6. Business consumer (depends on the runner)
  const consumer = new OtpRequestedConsumer(runner, service);

  await consumer.start();

  logger.info(
    { module: "container", consumer: env.KAFKA_CONSUMER_GROUP_ID },
    "Notification service consuming",
  );

  return {
    consumer: kafkaConsumer,
    runner,
    producer,
    service,
  };
};
