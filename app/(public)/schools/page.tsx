import { moderniz } from '@/lib/fonts';
import SchoolsGrid from '@/components/schools/schools-grid';
import { getPublicActiveSchools } from '@/actions/schools';
import { School } from '@/lib/types/schools';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Member Schools | CESAFI Esports League',
  description: 'Discover the member schools of the Cebu Schools Athletic Foundation, Inc. that compete in the CESAFI Esports League.',
};

export const revalidate = 1800; // Revalidate every 30 minutes

export default async function SchoolsPage() {
  // Fetch active schools server-side
  const schoolsResult = await getPublicActiveSchools();
  const schools: School[] = schoolsResult.success && schoolsResult.data ? schoolsResult.data : [];

  return (
    <>
      {/* Hero Section - moved directly into page */}
      <section className="from-primary/10 via-background to-secondary/10 relative bg-gradient-to-br pt-20 pb-12 sm:pt-24 sm:pb-16">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzM2YzYxIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCIpLz48L3N2Zz4=')] bg-repeat" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 sm:space-y-6">
            <h1 className={`${moderniz.className} uppercase text-foreground mb-4 text-3xl font-bold sm:mb-6 sm:text-4xl md:text-6xl lg:text-7xl`}>
              Member <span className="text-gradient-cel">Schools</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto sm:text-lg">
              Discover the educational institutions that make up the Cebu Schools Athletic Foundation, Inc.
            </p>
          </div>
        </div>
      </section>

      {/* Schools Grid with initial data */}
      <SchoolsGrid initialSchools={schools} />
    </>
  );
}
