import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      if (env.SMTP_HOST) {
        this.transporter = nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT || 587,
          auth: env.SMTP_USER && env.SMTP_PASS
            ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
            : undefined,
        });
      } else {
        this.transporter = nodemailer.createTransport({
          streamTransport: true,
          buffer: true,
        });
      }
    }
    return this.transporter;
  }

  private async sendEmail(to: string, subject: string, html: string) {
    try {
      const transporter = this.getTransporter();
      const info = await transporter.sendMail({
        from: env.FROM_EMAIL,
        to,
        subject,
        html,
      });
      logger.debug(`Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error(`Failed to send email to ${to}`, error);
      throw error;
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    const url = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    await this.sendEmail(
      email,
      'Verify your email',
      `<p>Click <a href="${url}">here</a> to verify your email. Link expires in 24 hours.</p>`
    );
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const url = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    await this.sendEmail(
      email,
      'Reset your password',
      `<p>Click <a href="${url}">here</a> to reset your password. Link expires in 15 minutes.</p>`
    );
  }

  async sendMagicLinkEmail(email: string, token: string) {
    const url = `${env.FRONTEND_URL}/auth/magic-link?token=${token}`;
    await this.sendEmail(
      email,
      'Sign in to AuthForge',
      `<p>Click <a href="${url}">here</a> to sign in. Link expires in 10 minutes.</p>`
    );
  }

  async sendOTPEmail(email: string, otp: string) {
    await this.sendEmail(
      email,
      'Your OTP code',
      `<p>Your OTP code is: <strong>${otp}</strong></p><p>Expires in 5 minutes.</p>`
    );
  }
}

export const emailService = new EmailService();
