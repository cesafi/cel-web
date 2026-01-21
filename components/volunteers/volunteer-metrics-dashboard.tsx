'use client';

import { motion } from 'framer-motion';
import { Users, Building2, Calendar, BarChart3 } from 'lucide-react';
import { moderniz, roboto } from '@/lib/fonts';
import { useVolunteerMetrics } from '@/hooks/use-volunteer-metrics';
import { Skeleton } from '@/components/ui/skeleton';

export default function VolunteerMetricsDashboard() {
  const metrics = useVolunteerMetrics();

  if (metrics.isLoading) {
    return (
      <section className="py-16 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-background/40 backdrop-blur-lg rounded-lg border border-border/30 p-6">
                <Skeleton className="h-6 w-6 mb-4" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (metrics.error) {
    return (
      <section className="py-16 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-8">
            <BarChart3 className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className={`${moderniz.className} text-xl font-semibold text-destructive mb-2`}>
              Unable to Load Metrics
            </h3>
            <p className={`${roboto.className} text-muted-foreground`}>
              {metrics.error?.message || 'An error occurred while loading metrics.'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const dashboardMetrics = [
    {
      icon: Users,
      title: 'Total Volunteers',
      value: metrics.totalActiveVolunteers,
      description: 'Active volunteers across all seasons',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      icon: Building2,
      title: 'Departments',
      value: metrics.totalDepartments,
      description: 'Organizational units',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      icon: Calendar,
      title: 'Seasons',
      value: metrics.totalSeasons,
      description: 'Academic years covered',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
  ];

  return (
    <section className="py-16 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className={`${moderniz.className} text-3xl md:text-4xl font-bold text-foreground mb-4`}>
            Volunteer Statistics
          </h2>
          <p className={`${roboto.className} text-lg text-muted-foreground max-w-2xl mx-auto`}>
            Real-time insights into our volunteer community and organizational structure
          </p>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {dashboardMetrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`bg-background/40 backdrop-blur-lg rounded-lg border ${metric.borderColor} p-6 hover:shadow-lg transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 ${metric.bgColor} rounded-lg`}>
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
              
              <div className={`${moderniz.className} text-3xl font-bold text-foreground mb-2`}>
                {metric.value}
              </div>
              
              <div className={`${roboto.className} text-sm font-medium text-foreground mb-1`}>
                {metric.title}
              </div>
              
              <div className={`${roboto.className} text-xs text-muted-foreground`}>
                {metric.description}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Department Breakdown */}
        {metrics.volunteersByDepartment.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-background/40 backdrop-blur-lg rounded-lg border border-border/30 p-6"
          >
            <h3 className={`${moderniz.className} text-xl font-semibold text-foreground mb-6`}>
              Volunteers by Department
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.volunteersByDepartment.map((dept, index) => (
                <motion.div
                  key={dept.departmentName}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors duration-200"
                >
                  <div>
                    <div className={`${roboto.className} text-sm font-medium text-foreground`}>
                      {dept.departmentName}
                    </div>
                    <div className={`${roboto.className} text-xs text-muted-foreground`}>
                      {dept.count} volunteer{dept.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className={`${moderniz.className} text-lg font-bold text-primary`}>
                    {dept.count}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
