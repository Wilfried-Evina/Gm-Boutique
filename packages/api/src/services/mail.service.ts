import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

class MailService {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE, // true for 465, false for 587
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    }
    return this.transporter;
  }

  /**
   * Envoie un email avec ou sans pièce jointe.
   */
  async sendEmail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    attachments?: Array<{
      filename: string;
      path?: string;
      content?: Buffer | string;
      contentType?: string;
      cid?: string;
    }>;
  }): Promise<boolean> {
    try {
      if (!env.SMTP_USER || !env.SMTP_PASS) {
        logger.warn('SMTP credentials not fully configured. Email not sent.');
        throw new Error('Identifiants SMTP non configurés.');
      }

      const transporter = this.getTransporter();

      const info = await transporter.sendMail({
        from: env.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      });

      logger.info(`Email envoyé avec succès à ${options.to} (MessageId: ${info.messageId})`);
      return true;
    } catch (error) {
      logger.error('Erreur lors de l’envoi de l’email:', error);
      throw error;
    }
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
    const subject = 'GMBoutique - Réinitialisation de votre mot de passe';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Réinitialisation de mot de passe</h2>
        <p>Bonjour,</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe pour l'application GMBoutique.</p>
        <p>Veuillez cliquer sur le bouton ci-dessous pour définir un nouveau mot de passe. Ce lien est valable pendant 1 heure.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <p>Si le bouton ne fonctionne pas, copiez-collez le lien suivant dans votre navigateur :</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email.</p>
        <br/>
        <p>Cordialement,<br/>L'équipe GMBoutique</p>
      </div>
    `;
    
    return this.sendEmail({
      to,
      subject,
      html,
    });
  }
}

export const mailService = new MailService();
