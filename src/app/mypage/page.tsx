import MypageClient from './MypageClient';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function MypagePage() {
  return (
    <ProtectedRoute>
      <MypageClient />
    </ProtectedRoute>
  );
}
