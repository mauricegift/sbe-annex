import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import { ArrowRight, ArrowLeft, Mail, Smartphone, CheckCircle } from 'lucide-react';
import { toast } from '../../lib/toast';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [iconPulse, setIconPulse] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [sentMethod, setSentMethod] = useState<'email' | 'sms' | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    const interval = setInterval(() => setIconPulse(prev => !prev), 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) return;
    setIsLoading(true);

    try {
      const response = await authAPI.forgotPassword(emailOrPhone.trim());
      const method: 'email' | 'sms' = response.data?.method || 'email';
      setSentMethod(method);
      setCountdown(60);

      if (method === 'sms') {
        toast({
          title: 'Reset code sent!',
          description: 'A password reset code has been sent to your phone.',
        });
        navigate('/reset-password', { state: { phone: emailOrPhone.trim(), method: 'sms' } });
      } else {
        toast({
          title: 'Reset link sent!',
          description: 'Check your email for a password reset link. Check your spam/junk folder.',
        });
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to send reset instructions';
      toast({ title: 'Failed', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || !emailOrPhone) return;
    setIsLoading(true);
    try {
      await authAPI.forgotPassword(emailOrPhone.trim());
      setCountdown(60);
      toast({
        title: 'Instructions resent!',
        description: sentMethod === 'sms' ? 'New code sent to your phone.' : 'New reset link sent to your email.',
      });
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to resend';
      toast({ title: 'Failed', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (sentMethod === 'email') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div className="w-full max-w-md space-y-6 relative z-10">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/30">
                <img src="/android-chrome-512x512.png" alt="Logo" className={`w-full h-full object-cover transition-all duration-300 ${iconPulse ? 'scale-105' : 'scale-100'}`} />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Check Your Email</h1>
          </div>
          <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-xl">
            <CardContent className="p-6 space-y-5">
              <div className="p-5 bg-primary/5 border border-primary/20 rounded-xl text-center space-y-3">
                <Mail className="w-10 h-10 text-primary mx-auto" />
                <p className="font-semibold text-foreground">Reset link sent!</p>
                <p className="text-sm text-muted-foreground">
                  We've sent a password reset link to <strong>{emailOrPhone}</strong>. Click it to reset your password.
                </p>
                <p className="text-xs text-muted-foreground">Check your <strong>spam/junk folder</strong> if you don't see it.</p>
              </div>
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  {countdown > 0 ? `Resend available in ${countdown}s` : "Didn't receive it?"}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResend}
                  disabled={isLoading || countdown > 0}
                  className="w-full h-11"
                >
                  Resend Reset Link
                </Button>
              </div>
              <div className="text-center">
                <Link to="/login" className="inline-flex items-center text-primary hover:underline text-sm">
                  <ArrowLeft className="w-4 h-4 mr-1" />Back to Sign In
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-4">
          <div className="flex justify-center" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/30 hover:shadow-2xl hover:scale-105 transition-all duration-500">
              <img src="/android-chrome-512x512.png" alt="Logo" className={`w-full h-full object-cover transition-all duration-300 ${iconPulse ? 'scale-105' : 'scale-100'} ${isHovering ? 'rotate-12' : 'rotate-0'}`} />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold animate-fade-in">Forgot Password?</h1>
            <p className="text-muted-foreground text-sm">Enter your email or phone number to receive reset instructions</p>
          </div>
        </div>

        <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-6 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailOrPhone" className="text-sm font-medium">Email or Phone Number</Label>
                <div className="relative">
                  <Input
                    id="emailOrPhone"
                    type="text"
                    placeholder="Enter your email or phone (e.g. 0712345678)"
                    value={emailOrPhone}
                    onChange={e => setEmailOrPhone(e.target.value)}
                    onFocus={() => setFocusedField('emailOrPhone')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className={`h-12 transition-all duration-300 border-2 bg-background/50 ${focusedField === 'emailOrPhone' ? 'border-primary/50 ring-4 ring-primary/10' : 'border-border/50 hover:border-primary/30'}`}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Email users get a reset link. Phone-registered users get an SMS code.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 font-medium"
                disabled={isLoading || countdown > 0}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : countdown > 0 ? `Resend in ${countdown}s` : (
                  <><ArrowRight className="w-4 h-4 mr-2" />Send Reset Instructions</>
                )}
              </Button>
            </form>

            <div className="text-center text-xs text-muted-foreground">
              <Link to="/login" className="inline-flex items-center text-primary hover:underline font-medium">
                <ArrowLeft className="w-4 h-4 mr-1" />Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
