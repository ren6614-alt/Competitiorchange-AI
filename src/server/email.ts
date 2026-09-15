export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface IEmailService {
  sendEmail(options: EmailOptions): Promise<boolean>;
  sendHighPriorityChangeAlert(params: {
    to: string;
    competitorName: string;
    changeTitle: string;
    importance: string;
    whyItMatters: string;
    recommendedAction: string;
    dashboardUrl: string;
  }): Promise<boolean>;
}

export class ResendEmailService implements IEmailService {
  private apiKey?: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.apiKey || this.apiKey === "MY_RESEND_API_KEY") {
      // In development or when no Resend key is supplied, log formatted alert securely without secrets
      console.log(`[Email Service Simulated] To: ${options.to} | Subject: "${options.subject}"`);
      return true;
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "CompetitorChange AI <alerts@competitorchange.ai>",
          to: [options.to],
          subject: options.subject,
          html: options.html,
        }),
      });

      return response.ok;
    } catch (err: any) {
      console.error("[Email Service Error]:", err.message);
      return false;
    }
  }

  async sendHighPriorityChangeAlert(params: {
    to: string;
    competitorName: string;
    changeTitle: string;
    importance: string;
    whyItMatters: string;
    recommendedAction: string;
    dashboardUrl: string;
  }): Promise<boolean> {
    const subject = `🚨 ${params.importance.toUpperCase()} competitor change detected: ${params.competitorName}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">CompetitorChange AI Alert</h2>
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
          <p style="margin: 0; font-weight: 600; color: #991b1b;">Competitor: ${params.competitorName}</p>
          <p style="margin: 4px 0 0 0; color: #b91c1c;">Change: ${params.changeTitle}</p>
        </div>

        <h3 style="color: #334155; margin-bottom: 4px;">Why it matters:</h3>
        <p style="color: #475569; line-height: 1.6; margin-top: 0;">${params.whyItMatters}</p>

        <h3 style="color: #334155; margin-bottom: 4px;">Recommended action:</h3>
        <p style="color: #475569; line-height: 1.6; margin-top: 0;">${params.recommendedAction}</p>

        <div style="margin-top: 24px;">
          <a href="${params.dashboardUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            Open Dashboard
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">You received this email because you monitor ${params.competitorName} on CompetitorChange AI.</p>
      </div>
    `;

    return this.sendEmail({
      to: params.to,
      subject,
      html,
    });
  }
}

export const emailService = new ResendEmailService();
