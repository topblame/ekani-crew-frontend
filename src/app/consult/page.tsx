import ConsultClient from './ConsultClient';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ConsultPage() {
  return (
    <ProtectedRoute>
      <ConsultClient />
    </ProtectedRoute>
  );
}