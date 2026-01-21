import { moderniz, roboto } from '@/lib/fonts';

export default function AboutUsArticlesLoading() {
  return (
    <section className="py-32 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className={`${moderniz.className} text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-8 leading-tight`}>
            LATEST
            <br />
            <span className="text-primary">ARTICLES</span>
          </h2>
          
          <p className={`${roboto.className} text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed`}>
            Stay updated with the latest happenings in CESAFI. 
            From championship victories to groundbreaking partnerships.
          </p>
        </div>

        {/* Loading Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="group">
              <div className="bg-background/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-border/50">
                {/* Article Image Skeleton */}
                <div className="relative h-48 bg-muted/30 animate-pulse">
                  <div className="absolute top-3 left-3">
                    <div className="bg-muted/50 h-6 w-16 rounded animate-pulse"></div>
                  </div>
                </div>

                {/* Article Content Skeleton */}
                <div className="p-6">
                  <div className="h-6 bg-muted/30 rounded animate-pulse mb-3"></div>
                  <div className="h-4 bg-muted/20 rounded animate-pulse mb-2"></div>
                  <div className="h-4 bg-muted/20 rounded animate-pulse mb-4 w-3/4"></div>

                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-muted/30 rounded animate-pulse"></div>
                      <div className="h-4 w-20 bg-muted/30 rounded animate-pulse"></div>
                    </div>
                    <div className="h-4 w-16 bg-muted/30 rounded animate-pulse"></div>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-muted/30 rounded animate-pulse"></div>
                      <div className="h-4 w-24 bg-muted/30 rounded animate-pulse"></div>
                    </div>
                  </div>

                  <div className="h-4 w-20 bg-muted/30 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

