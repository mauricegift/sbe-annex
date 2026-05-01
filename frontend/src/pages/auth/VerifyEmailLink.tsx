import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../lib/api';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { motion } from 'framer-motion';

const VerifyEmailLink: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'already' | 'expired' | 'invalid'>('loading');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    const verify = async () => {
      try {
        const res = await authAPI.verifyEmailLink(token);
        setStatus(res.data?.already_verified ? 'already' : 'success');
      } catch (err: any) {
        const detail = err.response?.data?.detail || '';
        setStatus(detail.includes('expired') ? 'expired' : 'invalid');
      }
    };
    verify();
  }, [token]);

  useEffect(() => {
    if (status === 'success' || status === 'already') {
      const t = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(t); navigate('/login?verified=true'); }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(t);
    }
  }, [status, navigate]);

  const config = {
    loading: { icon: <Loader2 className="w-12 h-12 text-primary animate-spin" />, title: 'Verifying your email…', desc: 'Please wait while we confirm your account.' },
    success: { icon: <CheckCircle className="w-12 h-12 text-emerald-500" />, title: 'Email verified!', desc: `Your account has been verified. Redirecting to login in ${countdown}s…` },
    already: { icon: <CheckCircle className="w-12 h-12 text-emerald-500" />, title: 'Already verified', desc: `Your account was already verified. Redirecting to login in ${countdown}s…` },
    expired: { icon: <XCircle className="w-12 h-12 text-destructive" />, title: 'Link expired', desc: 'This verification link has expired. Please request a new one.' },
    invalid: { icon: <XCircle className="w-12 h-12 text-destructive" />, title: 'Invalid link', desc: 'This verification link is invalid or has already been used.' },
  }[status];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6 space-y-3">
          <motion.div className="flex justify-center" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/30">
              <img src="/android-chrome-512x512.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
          </motion.div>
          <h1 className="text-2xl font-bold">Account Verification</h1>
        </div>
        <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-8 text-center space-y-4">
            <motion.div className="flex justify-center" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}>
              {config.icon}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h2 className="text-xl font-semibold mb-2">{config.title}</h2>
              <p className="text-muted-foreground text-sm">{config.desc}</p>
            </motion.div>
            {(status === 'expired' || status === 'invalid') && (
              <div className="flex flex-col gap-2 pt-2">
                <Button asChild className="w-full">
                  <Link to="/verify"><Mail className="w-4 h-4 mr-2" />Request new verification</Link>
                </Button>
                <Button variant="ghost" asChild className="w-full">
                  <Link to="/login">Back to login</Link>
                </Button>
              </div>
            )}
            {(status === 'success' || status === 'already') && (
              <Button asChild className="w-full mt-2">
                <Link to="/login">Go to login now</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmailLink;
