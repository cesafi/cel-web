import Link from 'next/link';
import type { Metadata } from 'next';
import { AlertTriangleIcon, CircleQuestionMark, Shield, User2 } from 'lucide-react';
import Image from 'next/image';
import ThemeSwitcher from '@/components/theme-switcher';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Login | Cebu Schools Athletic Foundation, Inc.',
  description: 'Login page for authorized personnel to access the CESAFI management system.'
};

export default function LoginPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="flex min-h-screen">
        {/* Left side - Brand */}
        <div className="bg-primary text-primary-foreground relative hidden flex-col justify-between overflow-hidden p-12 xl:flex xl:w-1/3">
          <div className="relative z-10 space-y-12">
            <Image src={'/img/cesafi-logo.webp'} alt="CESAFI Logo" width={80} height={80} />
            <h1 className="text-7xl font-bold 2xl:text-9xl">CESAFI PORTAL </h1>
          </div>

          <div className="relative z-10 space-y-8">
            <div className="flex items-start space-x-3">
              <CircleQuestionMark className="h-8 w-8" />
              <div>
                <h3 className="mb-1 text-lg font-medium">Inquiries</h3>
                <p className="text-sm 2xl:text-base">
                  If you have requests, require any help or have any questions, please approach any
                  website operations department member.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Shield className="h-8 w-8" />
              <div>
                <h3 className="mb-1 text-lg font-medium">Access</h3>
                <p className="text-sm 2xl:text-base">
                  This portal is restricted to authorized personnel only. All actions are logged for
                  security purposes.
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 mx-auto text-xs font-medium">
            &copy; {new Date().getFullYear()} Cebu Schools Athletics Foundation, Inc.
          </div>
        </div>

        {/* Right side - Form */}
        <div className="bg-background flex flex-1 flex-col items-center justify-center p-8">
          <div className="absolute top-16 right-16">
            <ThemeSwitcher />
          </div>
          <div className="w-full max-w-md">
            <div className="bg-background border-muted rounded-xl border p-8 shadow-lg">
              <div className="mb-6 flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center space-x-2">
                  <User2 className="h-5 w-5" />
                  <h2 className="text-xl font-medium">Login</h2>
                </div>
                <p className="text-muted-foreground text-sm">
                  Enter your credentials to access your account
                </p>
              </div>

              {/* Form */}
              <LoginForm />

              <div className="bg-muted text-muted-foreground my-4 flex items-start space-x-4 rounded-lg px-5 py-3">
                <AlertTriangleIcon className="-mt-1.5 h-10 w-10" />
                <p className="text-sm">
                  This portal is protected with encryption and security measures. All access
                  attempts are monitored and logged.
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/"
                className="text-muted-foreground text-sm transition-colors hover:text-primary"
              >
                Return to main website
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
