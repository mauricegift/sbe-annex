import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import { Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, Loader2, Lock } from 'lucide-react';
import { toast } from '../../lib/toast';

const passwordRules = [
  { label: '8+ characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'Special character', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

const ResetPassword: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const isLinkFlow = !!token;

  const [formData, setFormData] = useState({
    phone: location.state?.phone || '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const validatePassword = (password: string) => {
    const errs: string[] = [];
    if (password.length < 8) errs.push('Password must be at least 8 characters');
    if (!/[A-Z]/.test(password)) errs.push('Password must contain at least 1 uppercase letter');
    if (!/[a-z]/.test(password)) errs.push('Password must contain at least 1 lowercase letter');
    if (!/[0-9]/.test(password)) errs.push('Password must contain at least 1 number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errs.push('Password must contain at least 1 special character');
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const newErrors: string[] = [];
    if (formData.newPassword !== formData.confirmPassword) newErrors.push('Passwords do not match');
    newErrors.push(...validatePassword(formData.newPassword));

    if (isLinkFlow) {
      // Link flow: only needs token + new password
    } else {
      if (!formData.phone) newErrors.push('Phone number is required');
      if (!formData.code) newErrors.push('Reset code is required');
    }

    if (newErrors.length > 0) { setErrors(newErrors); return; }

    setIsLoading(true);
    try {
      if (isLinkFlow) {
        await authAPI.resetPasswordLink({ token: token!, new_password: formData.newPassword });
      } else {
        await authAPI.resetPasswordSms({
          phone_number: formData.phone,
          code: formData.code,
          new_password: formData.newPassword,
        });
      }
      toast({ title: 'Password reset!', description: 'You can now sign in with your new password.' });
      navigate('/login');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Password reset failed';
      toast({ title: 'Reset failed', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleResendCode = async () => {
    if (!formData.phone || resendCountdown > 0) return;
    setIsResending(true);
    try {
      await authAPI.forgotPassword(formData.phone);
      toast({ title: 'Code resent!', description: 'A new reset code has been sent to your phone.' });
      setResendCountdown(60);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to resend';
      toast({ title: 'Failed', description: message, variant: 'destructive' });
    } finally {
      setIsResending(false);
    }
  };

  const inputClass = (field: string) =>
    `h-12 transition-all duration-300 border-2 bg-background/50 backdrop-blur-sm ${
      focusedField === field ? 'border-primary/50 ring-4 ring-primary/10' : 'border-border/50 hover:border-primary/30'
    }`;

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
              <img src="/android-chrome-512x512.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Reset Password</h1>
            <p className="text-muted-foreground text-sm">
              {isLinkFlow ? 'Enter your new password below' : 'Enter the code from your SMS and a new password'}
            </p>
          </div>
        </div>

        <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-6 space-y-4">
            {errors.length > 0 && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    {errors.map((err, i) => <p key={i} className="text-sm text-destructive">{err}</p>)}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLinkFlow && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                    <Input
                      id="phone" name="phone" type="tel" placeholder="0712345678"
                      value={formData.phone} onChange={handleChange}
                      onFocus={() => setFocusedField('phone')} onBlur={() => setFocusedField(null)}
                      required className={inputClass('phone')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-sm font-medium">SMS Reset Code</Label>
                    <Input
                      id="code" name="code" type="text" placeholder="Enter 6-digit code"
                      value={formData.code} onChange={handleChange}
                      onFocus={() => setFocusedField('code')} onBlur={() => setFocusedField(null)}
                      required maxLength={6}
                      className={`${inputClass('code')} text-center text-lg tracking-widest font-mono`}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword" name="newPassword"
                    type={showPassword ? 'text' : 'password'} placeholder="Create a strong password"
                    value={formData.newPassword} onChange={handleChange}
                    onFocus={() => setFocusedField('newPassword')} onBlur={() => setFocusedField(null)}
                    required className={`${inputClass('newPassword')} pr-12`}
                  />
                  <Button type="button" variant="ghost" size="icon"
                    className="absolute right-1 top-1 h-10 w-10 hover:bg-primary/10"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
                {formData.newPassword && (
                  <div className="grid grid-cols-2 gap-1 text-xs mt-1">
                    {passwordRules.map((rule, i) => (
                      <div key={i} className={`flex items-center gap-1 ${rule.test(formData.newPassword) ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {rule.test(formData.newPassword) ? <CheckCircle className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-current inline-block" />}
                        {rule.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword" name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm your new password"
                    value={formData.confirmPassword} onChange={handleChange}
                    onFocus={() => setFocusedField('confirmPassword')} onBlur={() => setFocusedField(null)}
                    required className={`${inputClass('confirmPassword')} pr-12`}
                  />
                  <Button type="button" variant="ghost" size="icon"
                    className="absolute right-1 top-1 h-10 w-10 hover:bg-primary/10"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
                {formData.confirmPassword && (
                  <p className={`text-xs flex items-center gap-1 ${formData.newPassword === formData.confirmPassword ? 'text-green-600' : 'text-destructive'}`}>
                    {formData.newPassword === formData.confirmPassword ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {formData.newPassword === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}
              </div>

              {!isLinkFlow && (
                <Button type="button" variant="outline" className="w-full h-11"
                  disabled={isResending || resendCountdown > 0 || !formData.phone}
                  onClick={handleResendCode}>
                  {isResending ? 'Resending...' : resendCountdown > 0 ? `Resend Code (${resendCountdown}s)` : 'Resend SMS Code'}
                </Button>
              )}

              <Button type="submit"
                className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 font-medium"
                disabled={isLoading}>
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Resetting...</> : <><CheckCircle className="w-4 h-4 mr-2" />Reset Password</>}
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

export default ResetPassword;
