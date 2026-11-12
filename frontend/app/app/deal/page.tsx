import { Suspense } from 'react';
import DealView from '../../../components/app/DealView';

export default function DealPage() {
  return (
    <Suspense fallback={null}>
      <DealView />
    </Suspense>
  );
}
