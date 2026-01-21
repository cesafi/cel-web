interface WelcomeHeaderProps {
  userName: string;
}

export function WelcomeHeader({ userName }: WelcomeHeaderProps) {
  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
      <p className="text-muted-foreground">
        Welcome to the CESAFI admin dashboard, {userName}.
      </p>
    </div>
  );
}
