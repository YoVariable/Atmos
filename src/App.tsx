import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import Home from '@/pages/Home';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { SettingsProvider } from '@/lib/use-settings';

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center text-center p-4">
      <div className="space-y-2">
        <h1 className="text-4xl font-medium tracking-tight">404</h1>
        <p className="text-muted-foreground">The sky is clear here, but there's no data.</p>
        <a href="/" className="inline-block mt-4 text-primary hover:underline">Return to instruments</a>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <SettingsProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </SettingsProvider>
  );
}

export default App;
