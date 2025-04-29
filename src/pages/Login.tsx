
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    await login();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-team-light to-white">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">TeamClipSync</CardTitle>
          <CardDescription>Record videos and sync to Google Drive</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col items-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-team-primary flex items-center justify-center">
              <svg 
                width="42" 
                height="42" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="text-white"
              >
                <path d="M23 7v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2z" />
                <path d="m16 2-4 4-4-4" />
                <rect x="7" y="9" width="10" height="6" rx="1" />
              </svg>
            </div>
            
            <div className="text-center">
              <h3 className="text-xl font-medium mb-2">Welcome!</h3>
              <p className="text-muted-foreground mb-6">
                Login with your Google account to start recording videos and syncing them to Google Drive.
              </p>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            className="w-full bg-team-primary hover:bg-team-primary/90" 
            size="lg"
            onClick={handleLogin}
          >
            Sign in with Google
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
