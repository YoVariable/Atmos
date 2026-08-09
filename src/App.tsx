import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import Home from '@/pages/Home';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { SettingsProvider, useSettings } from '@/lib/use-settings';
import { LocationsProvider } from '@/lib/use-locations';

const queryClient = new QueryClient();

// A lightweight helper to synchronize theme state with the root HTML element
function ThemeEffect() {
  const { settings } = useSettings();

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  return null;
}

function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center text-center p-4 bg-background text-foreground">
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
      <LocationsProvider> 
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ThemeEffect />
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </LocationsProvider>
    </SettingsProvider>
  );
}

export default App;