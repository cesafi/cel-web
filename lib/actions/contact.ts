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

export async function sendContactEmail(formData: ContactFormData) {
    try {
        // Validate the form data
        const validatedData = contactSchema.parse(formData);
        const { name, email, subject, message } = validatedData;
        const subjectLabel = subjectLabels[subject];

        // Send email to your team
        await resend.emails.send({
            from: 'CESAFI Contact Form <noreply@yourdomain.com>', // Replace with your domain
            to: ['contact@yourdomain.com'], // Replace with your contact email
            subject: `[${subjectLabel}] New Contact Form Submission`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #336C61;">New Contact Form Submission</h2>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subjectLabel}</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h3>Message:</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #e8f4f1; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              This message was sent from the CESAFI Sports contact form.
            </p>
          </div>
        </div>
      `,
        });

        // Send confirmation email to the user
        await resend.emails.send({
            from: 'CESAFI Sports <noreply@yourdomain.com>', // Replace with your domain
            to: [email],
            subject: 'Thank you for contacting CESAFI Sports',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #336C61;">Thank you for your message!</h2>
          
          <p>Hi ${name},</p>
          
          <p>Thank you for reaching out to CESAFI Sports. We've received your message and will get back to you within 24-48 hours.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Your Message Summary:</h3>
            <p><strong>Subject:</strong> ${subjectLabel}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap; font-style: italic;">${message}</p>
          </div>
          
          <p>If you have any urgent matters, please don't hesitate to reach out to us directly.</p>
          
          <p>Best regards,<br>The CESAFI Sports Team</p>
          
          <div style="margin-top: 30px; padding: 15px; background-color: #e8f4f1; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              Visit us at <a href="https://yourdomain.com" style="color: #336C61;">CESAFI Sports</a>
            </p>
          </div>
        </div>
      `,
        });

        return { success: true };
    } catch (error) {
        console.error('Contact form error:', error);

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