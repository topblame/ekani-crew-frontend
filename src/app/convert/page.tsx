import ConvertClient from './ConvertClient';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ConvertPage() {
  return (
    <ProtectedRoute>
      <ConvertClient />
    </ProtectedRoute>
  );
}