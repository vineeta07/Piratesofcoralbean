import { Suspense } from 'react';
import AskView from '../../components/app/AskView';

export default function AskPage() {
  return (
    <Suspense fallback={null}>
      <AskView />
    </Suspense>
  );
}
