import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Minimal Resend client over the REST API — no SDK dependency needed
 * (https://resend.com/docs/api-reference/send-email).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly apiKey?: string;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.from =
      this.configService.get<string>('MAIL_FROM') ||
      'NiyyaTrade <onboarding@resend.dev>';
  }

  get isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async send({ to, subject, html }: SendMailOptions): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn(
        `RESEND_API_KEY not set — skipping email "${subject}" to ${to}`,
      );
      return;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: this.from, to, subject, html }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(
        `Resend ${res.status} sending to ${to} — ${body.slice(0, 300)}`,
      );
      throw new Error(`Failed to send email (${res.status})`);
    }
  }
}
