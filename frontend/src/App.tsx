import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CommandCenter } from './pages/CommandCenter';
import { LiveFleet } from './pages/LiveFleet';
import { GISMap } from './pages/GISMap';
import { AIVideoAnalytics } from './pages/AIVideoAnalytics';
import { TrafficIntelligence } from './pages/TrafficIntelligence';
import { RoadConditions } from './pages/RoadConditions';
import { IncidentCenter } from './pages/IncidentCenter';
import { Infrastructure } from './pages/Infrastructure';
import { RoutesDelays } from './pages/RoutesDelays';
import { Reports } from './pages/Reports';
import { SystemHealth } from './pages/SystemHealth';
import { Settings } from './pages/Settings';
import { useWebSocket } from './hooks/useWebSocket';

function AppInner() {
  useWebSocket();
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<CommandCenter />} />
        <Route path="fleet" element={<LiveFleet />} />
        <Route path="gis" element={<GISMap />} />
        <Route path="video" element={<AIVideoAnalytics />} />
        <Route path="traffic" element={<TrafficIntelligence />} />
        <Route path="roads" element={<RoadConditions />} />
        <Route path="incidents" element={<IncidentCenter />} />
        <Route path="infrastructure" element={<Infrastructure />} />
        <Route path="routes" element={<RoutesDelays />} />
        <Route path="reports" element={<Reports />} />
        <Route path="health" element={<SystemHealth />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <HashRouter>
      <AppInner />
    </HashRouter>
  );
}

export default App;
