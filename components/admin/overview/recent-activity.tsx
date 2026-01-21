import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityProps {
  recentActivity: {
    articles: Array<{ id: string; title: string; created_at?: string }>;
    games: Array<{ id: number; game_number: number; created_at: string }>;
    matches: Array<{ id: number; name: string; created_at: string }>;
  };
}

export function RecentActivity({ recentActivity }: RecentActivityProps) {

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentActivity.articles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Recent Articles</h4>
              {recentActivity.articles.slice(0, 3).map((article: { id: string; title: string; created_at?: string }) => (
                <div key={article.id} className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span className="truncate">{article.title}</span>
                  <span className="text-muted-foreground text-xs">
                    {article.created_at ? formatDistanceToNow(new Date(article.created_at), { addSuffix: true }) : 'Recently'}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {recentActivity.matches.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Recent Matches</h4>
              {recentActivity.matches.slice(0, 2).map((match: { id: number; name: string; created_at: string }) => (
                <div key={match.id} className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="truncate">{match.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(match.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {recentActivity.games.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Recent Games</h4>
              {recentActivity.games.slice(0, 2).map((game: { id: number; game_number: number; created_at: string }) => (
                <div key={game.id} className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                  <span className="truncate">Game {game.game_number}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(game.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {recentActivity.articles.length === 0 && 
            recentActivity.matches.length === 0 && 
            recentActivity.games.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No recent activity to display.
              </p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
