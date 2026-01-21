import { moderniz, roboto } from '@/lib/fonts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`${moderniz.className} text-4xl font-bold text-foreground mb-4 sm:text-5xl lg:text-6xl`}>
            Terms of Service
          </h1>
          <p className={`${roboto.className} text-muted-foreground text-lg sm:text-xl`}>
            Rules and guidelines for using our platform
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
                Agreement to Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                Welcome to the Cebu Schools Athletic Foundation, Inc. (CESAFI) official website. These Terms of Service (&quot;Terms&quot;) govern your use of our website and related digital services (collectively, the &quot;Service&quot;) operated by CESAFI, a non-profit organization dedicated to promoting inter-school sports competition in Cebu.
              </p>
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                By accessing or using our website, you agree to be bound by these Terms. If you disagree with any part of these terms, please do not use our Service.
              </p>
            </CardContent>
          </Card>

          {/* About CESAFI */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                About CESAFI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                The Cebu Schools Athletic Foundation, Inc. (CESAFI) is a non-profit organization that organizes and manages inter-school sports competitions among member educational institutions in Cebu. Our mission is to promote sportsmanship, academic excellence, and character development through competitive athletics.
              </p>
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                By using our website, you acknowledge that you understand CESAFI&apos;s role as a sports governing body and agree to respect our mission and values.
              </p>
            </CardContent>
          </Card>

          {/* Website Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🌐</span>
                Website Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                Our website provides public access to information about CESAFI activities and services, including:
              </p>
              <ul className={`${roboto.className} text-muted-foreground space-y-2 ml-4`}>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Sports schedules, results, and standings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>News and updates about CESAFI events and activities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Information about member schools and their athletic programs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Historical records and achievements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Volunteer opportunities and community engagement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Contact information and organizational details</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Administrative Access */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🔐</span>
                Administrative Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                Administrative access to our content management system is restricted to authorized CESAFI personnel, member school representatives, and approved volunteers. Access is granted solely for official CESAFI business and sports administration purposes.
              </p>
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                Authorized users with administrative access agree to maintain the confidentiality of their credentials and use the system responsibly in accordance with CESAFI policies and procedures.
              </p>
            </CardContent>
          </Card>

          {/* Acceptable Use */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📜</span>
                Acceptable Use Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className={`${moderniz.className} text-xl font-semibold mb-3`}>Permitted Uses</h3>
                <p className={`${roboto.className} text-muted-foreground leading-relaxed mb-3`}>
                  You may use our website for legitimate purposes, including:
                </p>
                <ul className={`${roboto.className} text-muted-foreground space-y-2 ml-4`}>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Viewing sports schedules, results, and standings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Reading news and updates about CESAFI activities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Learning about member schools and their programs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Accessing information about volunteer opportunities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Contacting CESAFI for legitimate inquiries</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className={`${moderniz.className} text-xl font-semibold mb-3`}>Prohibited Uses</h3>
                <p className={`${roboto.className} text-muted-foreground leading-relaxed mb-3`}>
                  You agree not to use our Service for:
                </p>
                <ul className={`${roboto.className} text-muted-foreground space-y-2 ml-4`}>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Any unlawful purpose or to solicit others to perform unlawful acts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Violating any international, federal, provincial, or state regulations, rules, laws, or local ordinances</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Transmitting or procuring the sending of any advertising or promotional material without our prior written consent</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Impersonating or attempting to impersonate CESAFI, a CESAFI employee, another user, or any other person or entity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Engaging in any other conduct that restricts or inhibits anyone&apos;s use or enjoyment of the Service</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Content and Intellectual Property */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📝</span>
                Content and Intellectual Property
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                The Service and its original content, features, and functionality are and will remain the exclusive property of CESAFI and its licensors. The Service is protected by copyright, trademark, and other laws.
              </p>
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                You retain ownership of content you submit to our Service, but grant us a license to use, modify, and distribute such content in connection with our services.
              </p>
            </CardContent>
          </Card>

          {/* Privacy Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                Privacy Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information when you use our Service. By using our Service, you agree to the collection and use of information in accordance with our Privacy Policy.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className={`${roboto.className} text-sm text-muted-foreground`}>
                  <strong>Note:</strong> Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Access Restrictions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🚫</span>
                Access Restrictions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                We reserve the right to restrict or terminate access to our website for users who violate these Terms of Service or engage in activities that may harm our organization, member schools, or the broader CESAFI community.
              </p>
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                Administrative access may be revoked immediately for authorized users who misuse their privileges or fail to comply with CESAFI policies and procedures.
              </p>
            </CardContent>
          </Card>

          {/* Disclaimers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                Disclaimers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                The information on this Service is provided on an &quot;as is&quot; basis. To the fullest extent permitted by law, CESAFI excludes all representations, warranties, conditions and terms relating to our Service and the use of this Service.
              </p>
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                Nothing in this disclaimer will limit or exclude our or your liability for death or personal injury, fraud, or any other liability that cannot be excluded or limited by applicable law.
              </p>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">⚖️</span>
                Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                In no event shall CESAFI, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
              </p>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🏛️</span>
                Governing Law
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                These Terms shall be interpreted and governed by the laws of the Philippines, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
              </p>
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📝</span>
                Changes to Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
              </p>
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📞</span>
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                If you have any questions about these Terms of Service, please contact us:
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
