import { Metadata } from 'next';
import ContactForm from '@/components/contact/contact-form';
import { moderniz, roboto } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'Contact Us | CESAFI Sports',
  description: 'Get in touch with CESAFI Sports. Send us your questions, feedback, or inquiries.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className={`${moderniz.className} text-4xl md:text-5xl lg:text-6xl font-bold mb-4`}>
              CONTACT
              <br />
              <span className="text-primary">US</span>
            </h1>
            <p className={`${roboto.className} text-lg text-muted-foreground max-w-2xl mx-auto`}>
              Have questions about CESAFI Sports? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold mb-6">Get in Touch</h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    </div>
                    <div>
                      <h3 className="font-medium">General Inquiries</h3>
                      <p className="text-muted-foreground">For general questions about CESAFI Sports</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    </div>
                    <div>
                      <h3 className="font-medium">Media & Press</h3>
                      <p className="text-muted-foreground">Media inquiries and press releases</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    </div>
                    <div>
                      <h3 className="font-medium">Technical Support</h3>
                      <p className="text-muted-foreground">Website issues and technical problems</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="font-semibold mb-3">Response Time</h3>
                <p className="text-muted-foreground text-sm">
                  We typically respond to all inquiries within 24-48 hours during business days. 
                  For urgent matters, please indicate the urgency in your message.
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}