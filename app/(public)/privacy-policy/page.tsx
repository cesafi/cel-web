import { moderniz, roboto } from '@/lib/fonts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`${moderniz.className} text-4xl font-bold text-foreground mb-4 sm:text-5xl lg:text-6xl`}>
            Privacy Policy
          </h1>
          <p className={`${roboto.className} text-muted-foreground text-lg sm:text-xl`}>
            How we collect, use, and protect your information
          </p>
          <div className="mt-4">
            <Badge variant="secondary" className="text-sm">
              Last updated: December 2024
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                The Cebu Schools Athletic Foundation, Inc. (CESAFI) is committed to protecting your privacy and personal information. As a non-profit organization dedicated to promoting inter-school sports competition, we collect and use information primarily to provide sports-related services and maintain our website.
              </p>
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website. By using our website, you consent to the data practices described in this policy.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className={`${moderniz.className} text-xl font-semibold mb-3`}>Information We May Collect</h3>
                <ul className={`${roboto.className} text-muted-foreground space-y-2 ml-4`}>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Contact information when you reach out to us through our contact forms or email</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Information provided when inquiring about volunteer opportunities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>School affiliation and role when relevant to your inquiry</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Information from authorized personnel accessing administrative functions</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className={`${moderniz.className} text-xl font-semibold mb-3`}>Usage Information</h3>
                <ul className={`${roboto.className} text-muted-foreground space-y-2 ml-4`}>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Website usage data, including pages visited and time spent on our site</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Device information, browser type, and IP address</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Cookies and similar tracking technologies</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className={`${moderniz.className} text-xl font-semibold mb-3`}>Administrative Content</h3>
                <ul className={`${roboto.className} text-muted-foreground space-y-2 ml-4`}>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Content created by authorized personnel for website management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Sports-related photos and media uploaded by authorized users</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Communications related to CESAFI operations and administration</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                We use the information we collect to:
              </p>
              <ul className={`${roboto.className} text-muted-foreground space-y-2 ml-4`}>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Maintain and improve our website and information services</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Provide information about CESAFI events, schedules, and results</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Respond to inquiries and provide information about our organization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Coordinate volunteer activities and community engagement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Ensure compliance with sports regulations and organizational policies</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Analyze website usage to improve our services</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Communicate important updates about CESAFI activities</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Information Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🤝</span>
                Information Sharing and Disclosure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:
              </p>
              <ul className={`${roboto.className} text-muted-foreground space-y-2 ml-4`}>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>With your consent:</strong> When you explicitly authorize us to share your information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Service providers:</strong> With trusted third parties who assist us in operating our website and services</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Legal requirements:</strong> When required by law or to protect our rights and safety</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Member schools:</strong> With CESAFI member schools for legitimate sports administration and coordination purposes</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className={`${roboto.className} text-muted-foreground space-y-2 ml-4`}>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Encryption of sensitive data in transit and at rest</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Regular security assessments and updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Access controls and authentication measures</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Secure hosting and data storage practices</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">⚖️</span>
                Your Rights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                You have the following rights regarding your personal information:
              </p>
              <ul className={`${roboto.className} text-muted-foreground space-y-2 ml-4`}>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Access:</strong> Request a copy of the personal information we hold about you</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Correction:</strong> Request correction of inaccurate or incomplete information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Deletion:</strong> Request deletion of your personal information (subject to legal and operational requirements)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Portability:</strong> Request transfer of your data to another service provider</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Objection:</strong> Object to processing of your personal information for certain purposes</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🍪</span>
                Cookies and Tracking Technologies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                We use cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookie settings through your browser preferences.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className={`${roboto.className} text-sm text-muted-foreground`}>
                  <strong>Note:</strong> Disabling cookies may affect the functionality of certain features on our website.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Student Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🎓</span>
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                As a sports organization serving educational institutions, CESAFI may display publicly available information about student-athletes, including names, photos, and athletic achievements, as part of our sports coverage and historical records.
              </p>
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                Such information is typically provided by member schools and is considered part of the public record of inter-school athletic competition. If you have concerns about student information displayed on our website, please contact us.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Privacy Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📝</span>
                Changes to This Privacy Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
              </p>
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                We encourage you to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📞</span>
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className={`${roboto.className} text-sm`}>
                  <strong>Cebu Schools Athletic Foundation, Inc. (CESAFI)</strong>
                </p>
                <p className={`${roboto.className} text-sm text-muted-foreground`}>
                  Email: info@cesafi.org
                </p>
                <p className={`${roboto.className} text-sm text-muted-foreground`}>
                  Website: www.cesafi.org
                </p>
                <p className={`${roboto.className} text-sm text-muted-foreground`}>
                  Address: Cebu City, Philippines
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
