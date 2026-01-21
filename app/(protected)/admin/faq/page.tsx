import { getPaginatedFaq } from '@/actions/faq';
import { FaqTable } from '@/components/admin/faq/faq-table';
import { HelpCircle, MessageSquare, Star } from 'lucide-react';

export default async function AdminFaqPage() {
  // Fetch initial FAQ data
  const faqResponse = await getPaginatedFaq({
    page: 1,
    pageSize: 10,
    sortBy: 'display_order',
    sortOrder: 'asc'
  });

  const faqData = faqResponse.success && 'data' in faqResponse ? faqResponse.data : null;

  return (
    <div className="w-full space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center space-x-2">
            <MessageSquare className="text-primary h-5 w-5" />
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total FAQ Items</p>
              <p className="text-2xl font-bold">{faqData?.totalCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-muted-foreground text-sm font-medium">Default Open</p>
              <p className="text-2xl font-bold">
                {faqData?.data?.filter((item) => item.is_open).length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center space-x-2">
            <HelpCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-muted-foreground text-sm font-medium">Active Items</p>
              <p className="text-2xl font-bold">
                {faqData?.data?.filter((item) => item.is_active).length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Table */}
      <FaqTable initialData={faqData || undefined} />
    </div>
  );
}
