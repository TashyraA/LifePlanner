import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(email, password);
    
    if (success) {
      toast({
        title: "Welcome back! ✨",
        description: "You've successfully logged in.",
      });
      navigate('/college');
    } else {
      toast({
        title: "Login failed",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-coquette-pink-50 via-white to-coquette-brown-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-coquette-pink-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-coquette-pink-300 to-coquette-pink-400 rounded-full mb-4">
              <Heart className="text-white" size={32} fill="white" />
            </div>
            <h1 className="text-3xl font-bold text-coquette-brown-500 mb-2">
              Welcome Back
            </h1>
            <p className="text-coquette-brown-400 flex items-center justify-center gap-2">
              <Sparkles size={16} />
              Your beautiful life, organized
              <Sparkles size={16} />
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-coquette-brown-500">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-coquette-pink-200 focus:border-coquette-pink-400 focus:ring-coquette-pink-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-coquette-brown-500">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-coquette-pink-200 focus:border-coquette-pink-400 focus:ring-coquette-pink-400"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-coquette-pink-400 to-coquette-pink-500 hover:from-coquette-pink-500 hover:to-coquette-pink-600 text-white font-medium py-6 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;