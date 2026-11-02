import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env';

/** Tells the storefront to drop its cached catalog pages after a product or category changes. */
@Injectable()
export class StorefrontCacheService {
  private readonly logger = new Logger(StorefrontCacheService.name);

  constructor(private readonly config: ConfigService<Env, true>) {}

  /** Fire-and-forget: a slow or offline storefront must never fail an ERP save. */
  catalogChanged(): void {
    const url = this.config.get('STOREFRONT_REVALIDATE_URL', { infer: true });
    const secret = this.config.get('REVALIDATE_SECRET', { infer: true });
    if (!url || !secret) return;
    fetch(url, {
      method: 'POST',
      headers: { 'x-revalidate-secret': secret },
      signal: AbortSignal.timeout(5000),
    })
      .then((res) => {
        if (!res.ok) this.logger.warn(`Storefront revalidate returned ${res.status}`);
      })
      .catch((e: unknown) =>
        this.logger.warn(`Storefront revalidate failed: ${e instanceof Error ? e.message : e}`),
      );
  }
}
