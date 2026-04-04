import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useEffect, lazy, Suspense } from 'react';

const Scene = lazy(() => import('./scene/Scene').then((m) => ({ default: m.Scene })));
import { Overlay } from './ui/Overlay';
import { MissionStats } from './ui/MissionStats';
import { PlaybackControls } from './ui/PlaybackControls';
import { CameraButtons } from './ui/CameraButtons';
import { Timeline } from './ui/Timeline';
import { DsnStatus } from './ui/DsnStatus';
import { HelpPanel } from './ui/HelpPanel';
import { Milestones } from './ui/Milestones';
import { LoadingOverlay, ErrorOverlay } from './ui/StatusOverlay';
import { InfoLinks } from './ui/InfoLinks';
import { fetchTrajectory } from './data/horizons';
import { useMissionStore } from './store';

const queryClient = new QueryClient();

function DataLoader() {
  const setTrajectory = useMissionStore((s) => s.setTrajectory);
  const trajectory = useMissionStore((s) => s.trajectory);

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['trajectory'],
    queryFn: () => fetchTrajectory(),
    refetchInterval: 30 * 60 * 1000,
    staleTime: 15 * 60 * 1000,
  });

  useEffect(() => {
    if (data) setTrajectory(data);
  }, [data, setTrajectory]);

  if (isLoading && trajectory.length === 0) {
    return <LoadingOverlay />;
  }

  if (error && trajectory.length === 0) {
    return (
      <ErrorOverlay
        message={error instanceof Error ? error.message : 'Unknown error'}
        onRetry={() => refetch()}
      />
    );
  }

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ width: '100vw', height: '100dvh', position: 'relative' }}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        <DataLoader />
        <Overlay>
          <div className="overlay-top">
            <div className="overlay-top-left">
              <MissionStats />
              <HelpPanel />
            </div>
            <div className="overlay-top-right">
              <div className="mobile-hide-controls">
                <CameraButtons />
              </div>
              <div className="mobile-hide">
                <Milestones />
                <DsnStatus />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Timeline />
            <PlaybackControls />
            <InfoLinks />
          </div>
        </Overlay>
      </div>
    </QueryClientProvider>
  );
}

export default App;
