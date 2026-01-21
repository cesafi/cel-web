import ComingSoon from '@/components/shared/coming-soon';

export default function PartnersPage() {
  return (
    <ComingSoon
      title="Partners & Sponsors"
      description="Meet the organizations and companies that support CESAFI's mission and student-athletes."
      features={[
        'Official sponsors and partners',
        'Corporate partnership opportunities',
        'Sponsor recognition and benefits',
        'Partnership success stories',
        'How to become a partner'
      ]}
      estimatedLaunch="Q2 2025"
    />
  );
}
