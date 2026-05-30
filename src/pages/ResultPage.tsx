import { useParams } from 'react-router-dom';

export default function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <h1 className="text-2xl font-bold text-gray-800">結果画面 (sessionId: {sessionId})</h1>
    </div>
  );
}
