'use server';

import { Resend } from 'resend';
import { z } from 'zod';

const resend = new Resend(process.env.RESEND_API_KEY);

const contactSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    subject: z.enum(['general', 'media', 'technical', 'partnership', 'other']),
    message: z.string().min(10, 'Message must be at least 10 characters'),
});

const subjectLabels = {
    general: 'General Inquiry',
    media: 'Media & Press',
    technical: 'Technical Support',
    partnership: 'Partnership',
    other: 'Other',
} as const;

type ContactFormData = z.infer<typeof contactSchema>;

const LOGO_URL = 'https://cesafiesportsleague.com/img/cel-logo.png';
const WEBSITE_URL = 'https://cesafiesportsleague.com';

// Brand colors
const YALE_BLUE = '#0f5390';
const CHILI_RED = '#e62e22';
const NAVY = '#000f24';

function buildTeamEmailHtml(name: string, email: string, subjectLabel: string, message: string): string {
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>[${subjectLabel}] Contact Form</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0f;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <!-- Main card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#111118;border-radius:16px;overflow:hidden;border:1px solid #1e1e2e;">
          
          <!-- Header with gradient bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg, ${CHILI_RED} 0%, ${YALE_BLUE} 100%);font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          
          <!-- Logo + Title -->
          <tr>
            <td style="padding:32px 40px 24px 40px;text-align:center;">
              <img src="${LOGO_URL}" alt="CEL" width="48" height="48" style="display:inline-block;height:48px;width:auto;margin-bottom:16px;" />
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">New Contact Submission</h1>
              <p style="margin:8px 0 0 0;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:2px;font-weight:600;">${subjectLabel}</p>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background-color:#1e1e2e;"></div>
            </td>
          </tr>
          
          <!-- Sender details -->
          <tr>
            <td style="padding:28px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0d0d14;border-radius:12px;border:1px solid #1e1e2e;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-bottom:12px;">
                          <span style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;font-weight:600;">From</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:4px;">
                          <span style="font-size:17px;font-weight:600;color:#f1f5f9;">${name}</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <a href="mailto:${email}" style="font-size:14px;color:${CHILI_RED};text-decoration:none;font-weight:500;">${email}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Message -->
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom:12px;">
                    <span style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;font-weight:600;">Message</span>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#0d0d14;border-radius:12px;border:1px solid #1e1e2e;border-left:3px solid ${YALE_BLUE};padding:20px 24px;">
                    <p style="margin:0;font-size:15px;line-height:1.7;color:#cbd5e1;white-space:pre-wrap;">${message}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#0d0d14;padding:20px 40px;text-align:center;border-top:1px solid #1e1e2e;">
              <p style="margin:0;font-size:12px;color:#475569;line-height:1.5;">Sent via the <a href="${WEBSITE_URL}" style="color:${YALE_BLUE};text-decoration:none;font-weight:600;">CESAFI Esports League</a> contact form</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildUserConfirmationHtml(name: string, subjectLabel: string, message: string): string {
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Message Received - CESAFI Esports League</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0f;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <!-- Main card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#111118;border-radius:16px;overflow:hidden;border:1px solid #1e1e2e;">
          
          <!-- Hero header -->
          <tr>
            <td style="background-color:${NAVY};background-image:linear-gradient(135deg, ${NAVY} 0%, #0a1628 100%);padding:48px 40px 40px 40px;text-align:center;">
              <img src="${LOGO_URL}" alt="CESAFI Esports League" width="72" height="72" style="display:inline-block;height:72px;width:auto;margin-bottom:20px;" />
              <h1 style="margin:0 0 8px 0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Message Received!</h1>
              <p style="margin:0;font-size:14px;color:#94a3b8;font-weight:400;">We appreciate you reaching out</p>
              <!-- Accent bar -->
              <div style="width:60px;height:3px;background:linear-gradient(90deg, ${CHILI_RED}, ${YALE_BLUE});margin:20px auto 0 auto;border-radius:2px;"></div>
            </td>
          </tr>
          
          <!-- Body content -->
          <tr>
            <td style="padding:40px;">
              <!-- Greeting -->
              <p style="margin:0 0 24px 0;font-size:18px;font-weight:600;color:#f1f5f9;">Hi ${name},</p>
              
              <p style="margin:0 0 32px 0;font-size:15px;color:#94a3b8;line-height:1.7;">Thank you for contacting the <strong style="color:#f1f5f9;">CESAFI Esports League</strong>. We have received your message and our team will review it within <strong style="color:#f1f5f9;">24&ndash;48 hours</strong>.</p>
              
              <!-- Submission summary card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0d0d14;border-radius:12px;border:1px solid #1e1e2e;margin-bottom:32px;">
                <tr>
                  <td style="padding:20px 24px 16px 24px;border-bottom:1px solid #1e1e2e;">
                    <span style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${YALE_BLUE};font-weight:700;">Your Submission</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px 8px 24px;">
                    <span style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:600;">Subject</span>
                    <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#e2e8f0;">${subjectLabel}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px 20px 24px;">
                    <span style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:600;">Message</span>
                    <p style="margin:8px 0 0 0;font-size:14px;color:#94a3b8;line-height:1.6;font-style:italic;white-space:pre-wrap;border-left:3px solid #1e1e2e;padding-left:16px;">${message}</p>
                  </td>
                </tr>
              </table>
              
              <p style="margin:0 0 32px 0;font-size:15px;color:#94a3b8;line-height:1.7;">If you have any urgent matters, feel free to reply directly to this email.</p>
              
              <!-- Sign-off -->
              <p style="margin:0;font-size:15px;color:#94a3b8;line-height:1.7;">Best regards,</p>
              <p style="margin:4px 0 0 0;font-size:15px;font-weight:700;color:#f1f5f9;">The CEL Team</p>
            </td>
          </tr>
          
          <!-- CTA button -->
          <tr>
            <td style="padding:0 40px 36px 40px;text-align:center;">
              <a href="${WEBSITE_URL}" style="display:inline-block;background:linear-gradient(135deg, ${YALE_BLUE} 0%, #073d6e 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:14px;letter-spacing:0.3px;">Visit Our Website</a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#0d0d14;padding:28px 40px;text-align:center;border-top:1px solid #1e1e2e;">
              <p style="margin:0 0 4px 0;font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:1.5px;">Cebu Schools Athletic Foundation, Inc.</p>
              <p style="margin:0 0 16px 0;font-size:11px;color:#334155;text-transform:uppercase;letter-spacing:2px;">Esports League</p>
              <p style="margin:0;font-size:11px;color:#334155;">
                <a href="${WEBSITE_URL}" style="color:#64748b;text-decoration:none;">cesafiesportsleague.com</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendContactEmail(formData: ContactFormData) {
    try {
        const validatedData = contactSchema.parse(formData);
        const { name, email, subject, message } = validatedData;
        const subjectLabel = subjectLabels[subject];

        // Send email to team
        const responseTeam = await resend.emails.send({
            from: 'CESAFI Esports League <noreply@cesafiesportsleague.com>',
            to: ['contact@cesafiesportsleague.com'],
            subject: `[${subjectLabel}] New Contact Form Submission`,
            html: buildTeamEmailHtml(name, email, subjectLabel, message),
        });

        // Send confirmation email to the user
        const responseUser = await resend.emails.send({
            from: 'CESAFI Esports League <noreply@cesafiesportsleague.com>',
            to: [email],
            subject: 'Thank you for contacting CESAFI Esports League',
            html: buildUserConfirmationHtml(name, subjectLabel, message),
        });

        if (responseTeam.error) {
            console.error('Resend API error (team):', responseTeam.error);
            return {
                success: false,
                error: `Resend Error: ${responseTeam.error.message}`
            };
        }

        if (responseUser.error) {
            console.error('Resend API error (user):', responseUser.error);
            return {
                success: false,
                error: `Resend Error: ${responseUser.error.message}`
            };
        }

        console.log('Successfully sent contact emails!');
        return { success: true };
    } catch (error) {
        console.error('Contact form action caught exception:', error);

        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: 'Invalid form data',
                details: error.issues
            };
        }

        return {
            success: false,
            error: 'Failed to send message. Please try again.'
        };
    }
}