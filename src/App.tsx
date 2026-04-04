import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Scene } from './scene/Scene';
import { fetchTrajectory } from './data/horizons';
import { useMissionStore } from './store';

const queryClient = new QueryClient();

function DataLoader() {
  const setTrajectory = useMissionStore((s) => s.setTrajectory);

  const { data, error } = useQuery({
    queryKey: ['trajectory'],
    queryFn: () => fetchTrajectory(),
    refetchInterval: 30 * 60 * 1000, // 30 min
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
      </div>
    </QueryClientProvider>
  );
}

export default App;
