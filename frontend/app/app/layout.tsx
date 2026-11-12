import AppShell from '../../components/app/AppShell';
import { AnalysisProvider } from '../../lib/analysis';

export const metadata = {
  title: 'Workspace — Coral Bean',
};

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AnalysisProvider>
      <AppShell>{children}</AppShell>
    </AnalysisProvider>
  );
}
