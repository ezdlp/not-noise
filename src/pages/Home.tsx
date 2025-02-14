
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '@supabase/auth-helpers-react';

const Home = () => {
  const navigate = useNavigate();
  const { session } = useSessionContext();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Welcome to SmartLinks</h1>
        <p className="text-xl text-muted-foreground">
          Create and manage your music smart links
        </p>
        <div className="space-x-4">
          {session ? (
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          ) : (
            <Button onClick={() => navigate('/register')}>
              Get Started
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
