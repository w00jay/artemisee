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
import { fetchTrajectory } from './data/horizons';
import { useMissionStore } from './store';

const queryClient = new QueryClient();

function DataLoader() {
  const setTrajectory = useMissionStore((s) => s.setTrajectory);

  const { data, error } = useQuery({
    queryKey: ['trajectory'],
    queryFn: () => fetchTrajectory(),
    refetchInterval: 30 * 60 * 1000,
    staleTime: 15 * 60 * 1000,
  });

  useEffect(() => {
    if (data) setTrajectory(data);
  }, [data, setTrajectory]);

  if (error) {
    console.error('Trajectory fetch error:', error);
  }

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DataLoader />
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        <Scene />
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
