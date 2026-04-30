import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import { CheckCircle, RefreshCw, AlertCircle, Mail, Smartphone, Edit2 } from 'lucide-react';
import { toast } from '../../lib/toast';
import { motion } from 'framer-motion';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../../components/ui/input-otp';

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'sms'>('email');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [showResend, setShowResend] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [switchedToEmail, setSwitchedToEmail] = useState(false);

  useEffect(() => {
    const emailFromState = location.state?.email;
    const phoneFromState = location.state?.phone_number;
    const methodFromState = location.state?.verification_method;

    if (emailFromState) setEmail(emailFromState);
    if (phoneFromState) {
      setPhoneNumber(phoneFromState);
      setNewPhone(phoneFromState);
    }
    if (methodFromState) setVerificationMethod(methodFromState === 'sms' ? 'sms' : 'email');
  }, [location.state]);

  const startCountdown = () => {
    setCountdown(60);
    setShowResend(false);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startCountdown();
  }, []);

  const handleVerify = async (verificationCode: string) => {
    if (verificationCode.length !== 6) {
      toast({ title: 'Invalid code', description: 'Please enter the complete 6-digit code.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      await authAPI.verifySms({ identifier: phoneNumber || email, code: verificationCode });
      toast({ title: 'Account Verified!', description: 'Your account has been verified successfully.' });
      navigate('/login', { state: { verified: true } });
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Verification failed. Check your code and try again.';
      toast({ title: 'Verification failed', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(code);
  };

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (value.length === 6) handleVerify(value);
  };

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    setShowResend(false);
    try {
      const forceEmail = switchedToEmail;
      await authAPI.resendVerification(email, forceEmail);
      toast({
        title: 'Code sent!',
        description: switchedToEmail
          ? 'A new verification link has been sent to your email.'
          : verificationMethod === 'sms'
          ? 'A new verification code has been sent to your phone.'
          : 'A new verification link has been sent to your email. Check your spam/junk folder.',
      });
      startCountdown();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to resend code';
      toast({ title: 'Failed to send', description: message, variant: 'destructive' });
      setShowResend(true);
    } finally {
      setIsResending(false);
    }
  };

  const handleSwitchToEmail = async () => {
    setIsResending(true);
    try {
      await authAPI.resendVerification(email, true);
      setSwitchedToEmail(true);
      setVerificationMethod('email');
      toast({
        title: 'Email link sent!',
        description: 'We sent a verification link to your email instead. Check your inbox and spam folder.',
      });
      startCountdown();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to send email';
      toast({ title: 'Failed', description: message, variant: 'destructive' });
    } finally {
      setIsResending(false);
    }
  };

  const handleUpdatePhone = async () => {
    if (!newPhone || !/^(07|01)[0-9]{8}$/.test(newPhone)) {
      toast({ title: 'Invalid number', description: 'Enter a valid Kenyan phone number (e.g. 0712345678)', variant: 'destructive' });
      return;
    }
    setIsUpdatingPhone(true);
    try {
      await authAPI.updatePhoneBeforeVerify(email, newPhone);
      setPhoneNumber(newPhone);
      setEditingPhone(false);
      toast({ title: 'Phone updated!', description: `A new code has been sent to ${newPhone}.` });
      startCountdown();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to update phone';
      toast({ title: 'Failed', description: message, variant: 'destructive' });
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  const isEmailMethod = verificationMethod === 'email' || switchedToEmail;
  const displayContact = isEmailMethod ? email : (phoneNumber || email);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <motion.div
              className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/30 backdrop-blur-sm"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
            >
              <img src="/android-chrome-512x512.png" alt="Logo" className="w-full h-full object-cover" />
            </motion.div>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Verify Your Account</h1>
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
              {isEmailMethod ? <Mail className="w-4 h-4 text-primary" /> : <Smartphone className="w-4 h-4 text-primary" />}
              <span>{isEmailMethod ? 'Check your email inbox' : 'Enter the SMS code'}</span>
            </div>
          </div>
        </div>

        <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-6 space-y-5">
            {/* Contact display */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                {isEmailMethod ? <Mail className="w-4 h-4 text-primary" /> : <Smartphone className="w-4 h-4 text-primary" />}
                <span className="text-sm font-medium">{displayContact}</span>
              </div>
            </div>

            {/* Email method: just show instructions */}
            {isEmailMethod ? (
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-center space-y-2">
                  <Mail className="w-8 h-8 text-primary mx-auto" />
                  <p className="text-sm font-medium text-foreground">Verification link sent to your email</p>
                  <p className="text-xs text-muted-foreground">
                    Click the link in your email to verify your account. Check your <strong>spam/junk folder</strong> if you don't see it.
                  </p>
                </div>

                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {showResend ? "Didn't receive the link?" : `You can resend in ${countdown} seconds`}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResend}
                    disabled={isResending || !showResend}
                    className="w-full h-11"
                  >
                    {isResending ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Sending...</> : 'Resend Verification Link'}
                  </Button>
                </div>
              </div>
            ) : (
              /* SMS method: code entry */
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-3">
                  <Label className="text-sm font-medium block text-center">Enter 6-digit SMS code</Label>
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={code} onChange={handleCodeChange} disabled={isLoading}>
                      <InputOTPGroup>
                        {[0,1,2,3,4,5].map(i => (
                          <InputOTPSlot key={i} index={i} className="w-12 h-14 text-xl font-bold border-2 border-border/50 bg-background/50 focus:border-primary" />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {isLoading && <p className="text-center text-sm text-primary animate-pulse">Verifying...</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-primary to-primary/90"
                  disabled={isLoading || code.length !== 6}
                >
                  {isLoading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : <><CheckCircle className="w-4 h-4 mr-2" />Verify Account</>}
                </Button>

                {/* Edit phone number */}
                {!editingPhone ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditingPhone(true)} className="w-full text-muted-foreground hover:text-foreground">
                    <Edit2 className="w-3 h-3 mr-2" />Wrong number? Edit phone
                  </Button>
                ) : (
                  <div className="space-y-2 p-3 bg-muted/50 rounded-lg border">
                    <Label className="text-xs font-medium">New Phone Number</Label>
                    <div className="flex gap-2">
                      <Input
                        type="tel"
                        placeholder="0712345678"
                        value={newPhone}
                        onChange={e => setNewPhone(e.target.value)}
                        className="h-10 text-sm"
                      />
                      <Button type="button" size="sm" onClick={handleUpdatePhone} disabled={isUpdatingPhone} className="h-10 px-3">
                        {isUpdatingPhone ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Update'}
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setEditingPhone(false)} className="h-10 px-3">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {showResend ? "Didn't receive the code?" : `Resend in ${countdown}s`}
                  </p>
                  {showResend && (
                    <Button type="button" variant="outline" onClick={handleResend} disabled={isResending} className="w-full h-11">
                      {isResending ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Sending...</> : 'Resend SMS Code'}
                    </Button>
                  )}
                </div>

                {/* Switch to email fallback */}
                <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 rounded-lg text-xs">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-amber-800 dark:text-amber-200 space-y-1">
                      <p className="font-medium">Not receiving SMS?</p>
                      <p>You can verify via email instead using your registered email address.</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleSwitchToEmail}
                        disabled={isResending}
                        className="mt-2 h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                      >
                        <Mail className="w-3 h-3 mr-1" />
                        {isResending ? 'Sending...' : 'Send verification to my email instead'}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            <div className="text-center text-xs text-muted-foreground pt-2">
              Already verified?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">Sign In Here</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
