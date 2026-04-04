import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Scene } from './scene/Scene';
import { Overlay } from './ui/Overlay';
import { MissionStats } from './ui/MissionStats';
import { PlaybackControls } from './ui/PlaybackControls';
import { CameraButtons } from './ui/CameraButtons';
import { Timeline } from './ui/Timeline';
import { DsnStatus } from './ui/DsnStatus';
import { HelpPanel } from './ui/HelpPanel';
import { LoadingOverlay, ErrorOverlay } from './ui/StatusOverlay';
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
        <Scene />
        <DataLoader />
        <Overlay>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <MissionStats />
              <HelpPanel />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
              <CameraButtons />
              <DsnStatus />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Timeline />
            <PlaybackControls />
          </div>
        </Overlay>
      </div>
    </QueryClientProvider>
  );
}

export default App;
