import {
  KafkaConsumerRunner,
  RetryPolicies,
  createConsumer,
} from "@irctc/kafka";
import { env } from "@config/env.js";
import { logger } from "@irctc/logger";
import { getProducer, initKafka, kafka } from "@config/kafka.js";
import { initRedis, redis } from "@config/redis.js";
import { getEmailVendor } from "@config/email.js";
import { IDEMPOTENCY_KEYS } from "@constants/idempotency.constants.js";
import { IdempotencyRepository } from "@repositories/idempotency.repository.js";
import { EmailProviderFactory } from "@providers/email/index.js";
import type { EmailProvider } from "@providers/email/email-provider.js";
import { OtpNotificationService } from "@services/otp-notification.service.js";
import { WelcomeNotificationService } from "@services/welcome-notification.service.js";
import { OtpRequestedConsumer } from "@consumers/otp-requested.consumer.js";
import { UserLoggedInConsumer } from "@consumers/user-logged-in.consumer.js";

/**
 * Composition root for the notification service.
 *
 * Wires (in order):
 *   1. Kafka producer (kept warm; not currently used by the runner)
 *   2. Idempotency repositories (one per topic — separate keyspaces)
 *   3. Email provider (chosen via EmailProviderFactory + EMAIL_VENDOR env)
 *   4. Notification services (validate + dedupe + render + send)
 *   5. KafkaJS consumers + generic runners, one per topic
 *   6. Business consumers (depend on the runners)
 *
 * Each topic gets its own consumer group and runner, so an offset
 * stall or retry exhaustion on one topic does not block the other.
 */
export const bootstrap = async () => {
  // 1. Producer kept warm so the producer manager returns a connected
  //    instance for any future DLQ writes (the current runner does not
  //    emit DLQ messages).
  await initKafka();
  const producer = await getProducer();

  // 2. Idempotency repositories (one keyspace per topic).
  //    Await Redis readiness first so the client is fully connected
  //    before we hand it to the repository (avoids bootstrap races).
  await initRedis();
  const otpIdempotency = new IdempotencyRepository(
    redis,
    env.IDEMPOTENCY_TTL_SECONDS,
    IDEMPOTENCY_KEYS.OTP_REQUESTED,
  );
  const loginIdempotency = new IdempotencyRepository(
    redis,
    env.IDEMPOTENCY_TTL_SECONDS,
    IDEMPOTENCY_KEYS.USER_LOGGED_IN,
  );

  // 3. Email provider (vendor picked from env)
  const email: EmailProvider = EmailProviderFactory.create(getEmailVendor(), {
    sendgridApiKey: env.SENDGRID_API_KEY,
    sendgridSender: env.SENDGRID_SENDER,
    logger,
  });

  // 4. Services
  const otpService = new OtpNotificationService(
    otpIdempotency,
    email,
    env.OTP_TTL_SECONDS,
    logger,
  );
  const welcomeService = new WelcomeNotificationService(
    loginIdempotency,
    email,
    logger,
  );

  // 5. KafkaJS consumers + generic runners, one per topic.
  //    Retry config is service-side (kafkajs applies it inside the
  //    consumer instance, not at run()).
  const retryPolicy = RetryPolicies.custom({
    retries: env.KAFKA_RETRY_MAX_RETRIES,
    initialRetryTime: env.KAFKA_RETRY_INITIAL_MS,
    maxRetryTime: env.KAFKA_RETRY_MAX_MS,
  });

  const otpKafkaConsumer = createConsumer(
    kafka,
    env.KAFKA_CONSUMER_GROUP_ID,
    retryPolicy,
  );
  const otpRunner = new KafkaConsumerRunner(otpKafkaConsumer, logger);

  const loginKafkaConsumer = createConsumer(
    kafka,
    env.KAFKA_LOGIN_CONSUMER_GROUP_ID,
    retryPolicy,
  );
  const loginRunner = new KafkaConsumerRunner(loginKafkaConsumer, logger);

  // 6. Business consumers (depend on the runners)
  const otpConsumer = new OtpRequestedConsumer(otpRunner, otpService);
  const loginConsumer = new UserLoggedInConsumer(loginRunner, welcomeService);

  await Promise.all([otpConsumer.start(), loginConsumer.start()]);

  logger.info(
    {
      module: "container",
      otpConsumer: env.KAFKA_CONSUMER_GROUP_ID,
      loginConsumer: env.KAFKA_LOGIN_CONSUMER_GROUP_ID,
    },
    "Notification service consuming",
  );

  return {
    otpConsumer: otpKafkaConsumer,
    loginConsumer: loginKafkaConsumer,
    otpRunner,
    loginRunner,
    producer,
    otpService,
    welcomeService,
  };
};
