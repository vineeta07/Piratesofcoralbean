import ClientPage from './ClientPage';

export function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default function DealPageWrapper({ params }: { params: { id: string } }) {
  return <ClientPage params={params} />;
}