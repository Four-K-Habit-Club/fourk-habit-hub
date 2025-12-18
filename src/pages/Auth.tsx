// src/components/Auth.tsx
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export const Auth: React.FC = () => {
  const { user, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">FourK Habit Hub</h1>
        <p className="mb-8">Sign in with Google to sync across devices</p>
        <Button onClick={loginWithGoogle} className="w-full">
          Sign in with Google
        </Button>
      </div>
    </div>
  );
};