import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="font-mono text-6xl text-text-muted">404</div>
      <p className="text-text-secondary text-sm">페이지를 찾을 수 없습니다</p>
      <button
        onClick={() => navigate('/')}
        className="text-accent-blue text-sm underline hover:no-underline"
      >
        홈으로 돌아가기
      </button>
    </div>
  );
}
