import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';
import { PushSubscriptionEntity } from './push-subscription.entity';
import { SubscribePushInput } from './dto/subscribe-push.input';

/**
 * PushService — Web Push (RFC 8030) sender.
 *
 * On startup, configures the `web-push` library with the configured VAPID
 * keys. If the keys are missing (e.g. dev environment without running
 * `npx web-push generate-vapid-keys`), the service silently degrades —
 * `sendPush` becomes a no-op + warning log. This lets tests run without
 * real VAPID keys.
 *
 * The actual push delivery is best-effort. Failures are logged but never
 * thrown to the caller — push is always "fire and forget" from the
 * caller's perspective.
 */

export interface PushPayload {
  title: string;
  body?: string;
  /** A deep-link URL or route key the client can use to open the right screen. */
  url?: string;
  /** Notification icon URL (small, shown in status bar). */
  icon?: string;
  /** Notification badge URL (monochrome, Android-only). */
  badge?: string;
  /** Arbitrary data tag — used by the service worker for collapse/key. */
  tag?: string;
  /** Any extra data the client/service worker may want. */
  data?: Record<string, unknown>;
}

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private configured = false;

  constructor(
    @InjectRepository(PushSubscriptionEntity)
    private readonly subRepo: Repository<PushSubscriptionEntity>,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY') ?? '';
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY') ?? '';
    const subject = this.config.get<string>('VAPID_SUBJECT') ?? 'mailto:dev@pixora.app';
    const enabled = this.config.get<string>('PUSH_ENABLED') === 'true';

    if (!enabled || !publicKey || !privateKey) {
      this.logger.warn(
        'Web Push not configured (VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY missing or PUSH_ENABLED=false). ' +
          'Run `npx web-push generate-vapid-keys` and set the env vars to enable push.',
      );
      return;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.configured = true;
    this.logger.log('Web Push configured (VAPID keys loaded)');
  }

  isConfigured(): boolean {
    return this.configured;
  }

  /**
   * Subscribe (or update) a push subscription for the given user.
   * Idempotent: subscribing the same endpoint twice updates the keys instead
   * of creating a duplicate.
   */
  async subscribe(
    userId: string,
    input: SubscribePushInput,
  ): Promise<{ subscription: PushSubscriptionEntity; created: boolean }> {
    const existing = await this.subRepo.findOne({
      where: { userId, endpoint: input.endpoint },
    });

    if (existing) {
      existing.p256dh = input.p256dh;
      existing.auth = input.auth;
      existing.expirationTime = input.expirationTime ?? null;
      const subscription = await this.subRepo.save(existing);
      return { subscription, created: false };
    }

    const sub = this.subRepo.create({
      userId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      expirationTime: input.expirationTime ?? null,
    });
    const subscription = await this.subRepo.save(sub);
    return { subscription, created: true };
  }

  /**
   * Unsubscribe by endpoint (called when the browser explicitly unsubscribes
   * or when push delivery returns 410/404).
   */
  async unsubscribe(userId: string, endpoint: string): Promise<number> {
    const result = await this.subRepo.delete({ userId, endpoint });
    return result.affected ?? 0;
  }

  /**
   * Unsubscribe all of a user's subscriptions (e.g. on logout everywhere).
   */
  async unsubscribeAll(userId: string): Promise<number> {
    const result = await this.subRepo.delete({ userId });
    return result.affected ?? 0;
  }

  /**
   * List the current user's push subscriptions (for debugging / UI display).
   */
  async listForUser(userId: string): Promise<PushSubscriptionEntity[]> {
    return this.subRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Send a push notification to ALL of a user's subscribed devices.
   * Best-effort: failures are logged and the offending subscription is
   * deleted (per Web Push spec, a 410/404 means the subscription is no
   * longer valid and should be removed).
   */
  async sendPush(userId: string, payload: PushPayload): Promise<number> {
    if (!this.configured) return 0;

    const subs = await this.subRepo.find({ where: { userId } });
    if (subs.length === 0) return 0;

    const payloadStr = JSON.stringify(payload);
    let sentCount = 0;

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payloadStr,
            {
              TTL: 60 * 60 * 24, // 24h
              urgency: 'normal',
              topic: payload.tag,
            },
          );
          sentCount++;
        } catch (err: any) {
          const status = err?.statusCode ?? 0;
          // 404/410 = subscription gone; 413 = payload too big; 429 = rate limit
          if (status === 404 || status === 410) {
            this.logger.debug(
              `pruning expired push subscription ${sub.id} (status=${status})`,
            );
            await this.subRepo.delete({ id: sub.id });
          } else {
            this.logger.warn(
              `push to ${sub.id} failed (status=${status}): ${err?.message ?? 'unknown'}`,
            );
          }
        }
      }),
    );

    return sentCount;
  }
}
