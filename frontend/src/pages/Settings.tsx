import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from '../lib/toast';
import { Trash2, Loader2, Shield, Mail, Phone } from 'lucide-react';
import { ThemeToggle } from '../components/theme-toggle';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteCode, setDeleteCode] = useState('');
  const [deleteStep, setDeleteStep] = useState<'select' | 'request' | 'confirm'>('select');
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'sms'>('email');

  const hasPhoneNumber = !!user?.phone_number;

  const handleSelectMethod = () => {
    setDeleteStep('request');
  };

  const handleRequestDeletion = async () => {
    setIsLoading(true);
    try {
      await authAPI.requestAccountDeletion(verificationMethod);
      setDeleteStep('confirm');
      const destination = verificationMethod === 'sms' ? 'phone number' : 'email';
      toast({
        title: "Deletion code sent",
        description: `Please check your ${destination} for the verification code.`,
      });
    } catch (error: any) {
      toast({
        title: "Request failed",
        description: error.response?.data?.detail || "Failed to request account deletion",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDeletion = async () => {
    const emailOrPhone = verificationMethod === 'sms' ? user?.phone_number : user?.email;
    if (!emailOrPhone || !deleteCode) return;
    
    setIsLoading(true);
    try {
      await authAPI.confirmAccountDeletion({
        email_or_phone: emailOrPhone,
        code: deleteCode,
        verification_method: verificationMethod,
      });
      toast({
        title: "Account deleted",
        description: "Your account has been successfully deleted.",
      });
      // User will be automatically logged out
    } catch (error: any) {
      toast({
        title: "Deletion failed",
        description: error.response?.data?.detail || "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Appearance</CardTitle>
            <CardDescription>Customize how the application looks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Theme</p>
                <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Account Information</CardTitle>
            <CardDescription>Your account details and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-foreground">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Username</p>
                <p className="text-foreground">@{user?.username}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Account Type</p>
                <div className="flex items-center space-x-2">
                  {user?.is_admin && <Shield className="w-4 h-4 text-primary" />}
                  <p className="text-foreground">{user?.is_admin ? 'Administrator' : 'Student'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                <p className="text-foreground">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that will permanently delete your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showDeleteConfirm ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                <div className="flex-1">
                  <p className="font-medium text-foreground">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            ) : (
              <div className="space-y-4 p-4 border border-destructive rounded-lg bg-destructive/5">
                <div className="space-y-2">
                  <h4 className="font-medium text-destructive">Delete Account</h4>
                  <p className="text-sm text-muted-foreground">
                    {deleteStep === 'select' && 'This action cannot be undone. Choose how you want to receive the verification code.'}
                    {deleteStep === 'request' && `Click confirm to receive a verification code via ${verificationMethod === 'sms' ? 'SMS' : 'email'}.`}
                    {deleteStep === 'confirm' && `Enter the verification code sent to your ${verificationMethod === 'sms' ? 'phone number' : 'email'} to confirm account deletion.`}
                  </p>
                </div>

                {deleteStep === 'select' && (
                  <div className="space-y-3">
                    <Label>Verification Method</Label>
                    <RadioGroup
                      value={verificationMethod}
                      onValueChange={(value) => setVerificationMethod(value as 'email' | 'sms')}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="email" id="delete-email" />
                        <Label htmlFor="delete-email" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Email</p>
                            <p className="text-xs text-muted-foreground">{user?.email}</p>
                          </div>
                        </Label>
                      </div>
                      {hasPhoneNumber && (
                        <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="sms" id="delete-sms" />
                          <Label htmlFor="delete-sms" className="flex items-center gap-2 cursor-pointer flex-1">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">SMS</p>
                              <p className="text-xs text-muted-foreground">{user?.phone_number}</p>
                            </div>
                          </Label>
                        </div>
                      )}
                    </RadioGroup>
                  </div>
                )}
                
                {deleteStep === 'confirm' && (
                  <div className="space-y-2">
                    <Label htmlFor="deleteCode">Verification Code</Label>
                    <Input
                      id="deleteCode"
                      type="text"
                      placeholder="Enter verification code"
                      value={deleteCode}
                      onChange={(e) => setDeleteCode(e.target.value)}
                    />
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button
                    variant="destructive"
                    onClick={
                      deleteStep === 'select' 
                        ? handleSelectMethod 
                        : deleteStep === 'request' 
                          ? handleRequestDeletion 
                          : handleConfirmDeletion
                    }
                    disabled={isLoading || (deleteStep === 'confirm' && !deleteCode)}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    {deleteStep === 'select' && 'Continue'}
                    {deleteStep === 'request' && 'Send Code'}
                    {deleteStep === 'confirm' && 'Delete Account'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteStep('select');
                      setDeleteCode('');
                      setVerificationMethod('email');
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;