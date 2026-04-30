import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from '../../lib/toast';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      toast({
        title: 'Email verified!',
        description: 'Your account has been verified. You can now sign in.',
      });
    }
  }, []);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('rememberMe') === 'true';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [iconPulse, setIconPulse] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Icon pulse animation effect
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setIconPulse(prev => !prev);
    }, 2000);
    return () => clearInterval(pulseInterval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(formData.username, formData.password, rememberMe);
      navigate('/dashboard');
    } catch (error) {
      // Error handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/3 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          <div 
            className="flex justify-center"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/30 transition-all duration-500 hover:shadow-2xl hover:scale-105 backdrop-blur-sm">
                <img 
                  src="/android-chrome-512x512.png" 
                  alt="SBE Annex Logo" 
                  className={`w-full h-full object-cover transition-all duration-300 ${iconPulse ? 'scale-105' : 'scale-100'} ${isHovering ? 'rotate-12' : 'rotate-0'}`}
                />
              </div>
            </div>
          </div>
                      <div className="space-y-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent animate-fade-in">
                Welcome Back
              </h1>
              <p className="text-muted-foreground text-sm animate-fade-in delay-100">
                Access your academic resources
              </p>
            </div>
        </div>

        <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-xl animate-fade-in-up">
          <CardContent className="p-6 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 animate-fade-in-up delay-100">
                <Label htmlFor="username" className="text-sm font-medium text-foreground/90">Username or Email</Label>
                <div className="relative group">
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Enter your username or email"
                    value={formData.username}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className={`h-12 transition-all duration-300 border-2 bg-background/50 backdrop-blur-sm ${
                      focusedField === 'username' 
                        ? 'border-primary/50 ring-4 ring-primary/10' 
                        : 'border-border/50 hover:border-primary/30'
                    }`}
                  />
                  <div className={`absolute inset-0 rounded-md transition-all duration-300 pointer-events-none ${
                    focusedField === 'username' ? 'bg-primary/5' : ''
                  }`}></div>
                </div>
              </div>

              <div className="space-y-2 animate-fade-in-up delay-150">
                <Label htmlFor="password" className="text-sm font-medium text-foreground/90">Password</Label>
                <div className="relative group">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className={`h-12 pr-12 transition-all duration-300 border-2 bg-background/50 backdrop-blur-sm ${
                      focusedField === 'password' 
                        ? 'border-primary/50 ring-4 ring-primary/10' 
                        : 'border-border/50 hover:border-primary/30'
                    }`}
                  />
                  <div className={`absolute inset-0 rounded-md transition-all duration-300 pointer-events-none ${
                    focusedField === 'password' ? 'bg-primary/5' : ''
                  }`}></div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-10 w-10 hover:bg-primary/10 transition-all duration-200 rounded-md"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground transition-transform hover:scale-110" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground transition-transform hover:scale-110" />
                    )}
                  </Button>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center space-x-2 animate-fade-in-up delay-175">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="border-border/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label 
                  htmlFor="rememberMe" 
                  className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                >
                  Remember me
                </Label>
              </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300 hover:shadow-lg hover:scale-[1.02] animate-fade-in-up delay-200 font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </span>
                ) : 'Sign In'}
              </Button>
            </form>

            <div className="space-y-3 animate-fade-in-up delay-300">
              <div className="text-center">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-primary hover:text-primary/80 hover:underline transition-all duration-200 font-medium"
                >
                  Forgot your password?
                </Link>
              </div>
              
              <div className="text-center text-xs text-muted-foreground">
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  className="text-primary hover:text-primary/80 hover:underline font-medium transition-all duration-200"
                >
                  Create one here
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
