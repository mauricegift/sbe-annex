import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../lib/api';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { motion } from 'framer-motion';

const ConfirmDelete: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'expired' | 'invalid' | 'forbidden'>('loading');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    const confirm = async () => {
      try {
        await authAPI.confirmDeleteLink(token);
        setStatus('success');
      } catch (err: any) {
        const detail = (err.response?.data?.detail || '').toLowerCase();
        if (detail.includes('expired')) setStatus('expired');
        else if (detail.includes('super')) setStatus('forbidden');
        else setStatus('invalid');
      }
    };
    confirm();
  }, [token]);

  useEffect(() => {
    if (status === 'success') {
      const t = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(t); navigate('/'); }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(t);
    }
  }, [status, navigate]);

  const config = {
    loading: { icon: <Loader2 className="w-12 h-12 text-primary animate-spin" />, title: 'Processing…', desc: 'Confirming account deletion, please wait.' },
    success: { icon: <CheckCircle className="w-12 h-12 text-emerald-500" />, title: 'Account deleted', desc: `Your account and all associated data have been permanently deleted. Redirecting in ${countdown}s…` },
    expired: { icon: <XCircle className="w-12 h-12 text-destructive" />, title: 'Link expired', desc: 'This deletion link has expired. Please log in and request a new deletion link from your profile settings.' },
    invalid: { icon: <XCircle className="w-12 h-12 text-destructive" />, title: 'Invalid link', desc: 'This deletion link is invalid or has already been used.' },
    forbidden: { icon: <AlertTriangle className="w-12 h-12 text-amber-500" />, title: 'Not allowed', desc: 'This account type cannot be deleted through this link.' },
  }[status];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-destructive/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6 space-y-3">
          <motion.div className="flex justify-center" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/30">
              <img src="/android-chrome-512x512.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
          </motion.div>
          <h1 className="text-2xl font-bold">Account Deletion</h1>
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
            {status !== 'loading' && status !== 'success' && (
              <Button variant="ghost" asChild className="w-full mt-2">
                <Link to="/login">Back to login</Link>
              </Button>
            )}
            {status === 'success' && (
              <Button asChild className="w-full mt-2">
                <Link to="/">Go to home</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConfirmDelete;
