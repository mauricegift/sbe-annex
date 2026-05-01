import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userAPI, authAPI, profileAPI, groupsAPI } from '../lib/api';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from '../lib/toast';
import { Camera, Save, Loader2, Key, ShieldAlert, Trash2, RefreshCw, User, Award, AlertTriangle, Check, Clock, Calendar, Shield, Mail, Phone, Bell, BellOff, X, Send } from 'lucide-react';
import { ProfileSkeleton } from '../components/PageSkeletons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent } from '../components/ui/dialog';
import getCroppedImg from '../lib/cropImage';
import { isIOSDevice, logMobileUploadDebug } from '../utils/mobileUploadFix';
import { uploadProfilePicture } from '../lib/githubCdn';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const t = searchParams.get('tab');
    return ['info','status','security','danger'].includes(t||'') ? t! : 'info';
  });
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('tab', value); return p; });
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [groups, setGroups] = useState<{id:string;code:string;name:string;specializations:string[]}[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    year_of_study: 1,
    semester_of_study: 1,
    group: '',
    specialization: '',
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Email change state
  const [emailChangeStep, setEmailChangeStep] = useState<'idle'|'form'|'sent'>('idle');
  const [newEmailInput, setNewEmailInput] = useState('');
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);

  // Phone change state
  const [phoneChangeStep, setPhoneChangeStep] = useState<'idle'|'form'|'otp'>('idle');
  const [newPhoneInput, setNewPhoneInput] = useState('');
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [phoneChangeLoading, setPhoneChangeLoading] = useState(false);

  // Notification preferences
  const [notifyOnUpload, setNotifyOnUpload] = useState<boolean>(true);
  const [notifyLoading, setNotifyLoading] = useState(false);

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        name: user?.name || '',
        year_of_study: user?.year_of_study || 1,
        semester_of_study: user?.semester_of_study || 1,
        group: (user as any)?.group || '',
        specialization: user?.specialization || '',
      });
      setNotifyOnUpload((user as any)?.notify_on_upload_decision !== false);
    }
  }, [user]);

  useEffect(() => {
    groupsAPI.getGroups().then(r => setGroups(r.data || [])).catch(() => {});
  }, []);

  // Handle URL params from email-change confirmation redirect
  useEffect(() => {
    const emailChanged = searchParams.get('email_changed');
    const emailChangeErr = searchParams.get('email_change');
    if (emailChanged === 'true') {
      toast({ title: 'Email updated', description: 'Your email address has been changed successfully.' });
      setEmailChangeStep('idle');
      handleRefresh();
      setSearchParams(prev => { const p = new URLSearchParams(prev); p.delete('email_changed'); return p; });
    } else if (emailChangeErr) {
      const msgs: Record<string,string> = {
        expired: 'The email change link has expired. Please request a new one.',
        invalid: 'The email change link is invalid.',
        taken: 'That email address is already taken by another account.',
        mismatch: 'Email change request mismatch. Please try again.',
      };
      toast({ title: 'Email change failed', description: msgs[emailChangeErr] || 'Email change failed.', variant: 'destructive' });
      setSearchParams(prev => { const p = new URLSearchParams(prev); p.delete('email_change'); return p; });
    }
  }, []);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSecurityInputChange = (field: string, value: string) => {
    setSecurityForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const profileData: Record<string, any> = {
        name: formData.name,
        year_of_study: formData.year_of_study,
        semester_of_study: formData.semester_of_study,
      };
      if (formData.group) profileData.group = formData.group;
      if (formData.specialization) profileData.specialization = formData.specialization;
      
      const response = await userAPI.updateProfile(profileData);
      updateUser(response.data);
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await userAPI.getProfile();
      updateUser(response.data);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePasswordChange = async () => {
    setIsLoading(true);
    try {
      if (securityForm.newPassword === securityForm.currentPassword) {
        toast({ title: 'Error', description: 'New password cannot be the same as your current password.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      if (securityForm.newPassword !== securityForm.confirmPassword) {
        throw new Error("New passwords don't match");
      }
      
      await profileAPI.changePassword({
        current_password: securityForm.currentPassword,
        new_password: securityForm.newPassword,
      });
      
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      
      setSecurityForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Password change error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || error.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Email change handlers ─────────────────────────────────────────────────────
  const handleRequestEmailChange = async () => {
    if (!newEmailInput.trim()) return;
    setEmailChangeLoading(true);
    try {
      await userAPI.requestEmailChange(newEmailInput.trim());
      setEmailChangeStep('sent');
      toast({ title: 'Confirmation email sent', description: `Check ${newEmailInput} for a confirmation link. Click it to complete the change.` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to send confirmation email', variant: 'destructive' });
    } finally {
      setEmailChangeLoading(false);
    }
  };

  // ── Phone change handlers ─────────────────────────────────────────────────────
  const handleRequestPhoneChange = async () => {
    if (!newPhoneInput.trim()) return;
    setPhoneChangeLoading(true);
    try {
      await userAPI.requestPhoneChange(newPhoneInput.trim());
      setPhoneChangeStep('otp');
      toast({ title: 'Code sent', description: `A 6-digit verification code has been sent to ${newPhoneInput}.` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to send verification code', variant: 'destructive' });
    } finally {
      setPhoneChangeLoading(false);
    }
  };

  const handleConfirmPhoneChange = async () => {
    if (!phoneOtpCode.trim()) return;
    setPhoneChangeLoading(true);
    try {
      const res = await userAPI.confirmPhoneChange(phoneOtpCode.trim());
      updateUser(res.data);
      setPhoneChangeStep('idle');
      setNewPhoneInput('');
      setPhoneOtpCode('');
      toast({ title: 'Phone updated', description: 'Your phone number has been changed successfully.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Invalid or expired code', variant: 'destructive' });
    } finally {
      setPhoneChangeLoading(false);
    }
  };

  // ── Notification preference handler ──────────────────────────────────────────
  const handleNotificationToggle = async (value: boolean) => {
    setNotifyLoading(true);
    try {
      await userAPI.updateNotificationPreferences(value);
      setNotifyOnUpload(value);
      toast({ title: 'Preferences saved', description: value ? 'You will receive upload decision notifications.' : 'Upload notifications are now off.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save preferences', variant: 'destructive' });
    } finally {
      setNotifyLoading(false);
    }
  };

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [croppingFile, setCroppingFile] = useState<File | null>(null);

  const handleProfilePicSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }
    // Accept any image format; compression handles size reduction
    if (!file.type.startsWith('image/') && !['image/heic', 'image/heif'].includes(file.type.toLowerCase())) {
      if (!file.name.match(/\.(jpg|jpeg|png|webp|gif|bmp|tiff|heic|heif|avif)$/i)) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }
    }
    // Allow up to 50MB before compression (compression will shrink it)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "Please select an image smaller than 50MB.",
        variant: "destructive",
      });
      return;
    }
    setSelectedImage(URL.createObjectURL(file));
    setCroppingFile(file);
    setCropModalOpen(true);
  };

  const handleCropAndUpload = async () => {
    if (!croppingFile || !croppedAreaPixels) {
      toast({
        title: "No image selected",
        description: "Please select and crop an image.",
        variant: "destructive",
      });
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels);
      if (!croppedBlob) {
        toast({
          title: "Cropping failed",
          description: "Could not crop the image. Try a different image.",
          variant: "destructive",
        });
        return;
      }
      setUploadProgress(20);
      const croppedFile = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' });
      const cdnUrl = await uploadProfilePicture(croppedFile, (progress) => {
        setUploadProgress(20 + Math.round(progress * 0.6));
      });
      setUploadProgress(85);
      const response = await userAPI.updateProfilePicture(cdnUrl);
      const updatedUser = { ...user, profile_picture: response.data?.profile_picture || cdnUrl };
      setUploadProgress(100);
      updateUser(updatedUser);
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully.",
      });
      setCropModalOpen(false);
      setSelectedImage(null);
      setCroppingFile(null);
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteCode, setDeleteCode] = useState('');
  const [deleteStep, setDeleteStep] = useState<'request' | 'confirm'>('request');

  const handleRequestDeletion = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const res = await userAPI.requestDelete();
      const method = res.data?.method || 'email';
      setDeleteStep('confirm');
      toast({
        title: "Deletion request sent",
        description: method === 'sms'
          ? "A confirmation code has been sent via SMS. Enter it below."
          : "A confirmation link has been sent to your email. Click it to permanently delete your account.",
      });
    } catch (error: any) {
      console.error('Deletion request error:', error);
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
    if (!user?.email || !deleteCode) return;
    
    setIsLoading(true);
    try {
      await authAPI.confirmAccountDeletion({
        email_or_phone: user.email,
        code: deleteCode,
        verification_method: 'email',
      });
      toast({
        title: "Account deleted",
        description: "Your account has been successfully deleted.",
      });
      // User will be automatically logged out
    } catch (error: any) {
      console.error('Account deletion error:', error);
      toast({
        title: "Deletion failed",
        description: error.response?.data?.detail || "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground text-sm">Manage your account and personal details</p>
        </div>
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing} className="shrink-0 mt-1">
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Profile Card */}
      <Card className="border border-border/60 bg-gradient-to-r from-primary/5 to-primary/10 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            {/* Avatar with camera upload */}
            <div className="relative flex-shrink-0">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarImage src={user?.profile_picture} alt={user?.name} className="object-cover" />
                <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-background border-2 border-primary/30 shadow flex items-center justify-center hover:bg-primary/10 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  logMobileUploadDebug('Profile pic button click');
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                    if (isIOSDevice()) {
                      setTimeout(() => fileInputRef.current?.click(), 100);
                    } else {
                      fileInputRef.current.click();
                    }
                  }
                }}
                disabled={isUploading}
                title="Change profile picture"
              >
                {isUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                ) : (
                  <Camera className="h-3.5 w-3.5 text-primary" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePicSelect}
                className="hidden"
              />
            </div>

            {/* Name + role + actions */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-lg text-foreground">{user?.name}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                      user?.role === 'super_admin' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' :
                      user?.role === 'admin' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' :
                      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                    }`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : 'Student'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate max-w-[180px] sm:max-w-none">@{user?.username} · {user?.email}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!isEditing ? (
                    <Button size="sm" onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: user?.name || '',
                          year_of_study: user?.year_of_study || 1,
                          semester_of_study: user?.semester_of_study || 1,
                          group: (user as any)?.group || '',
                          specialization: user?.specialization || '',
                        });
                      }}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                        Save
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Academic info pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-background border border-border/60 text-foreground">
              <User className="w-3.5 h-3.5 text-primary" />
              Year {user?.year_of_study}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-background border border-border/60 text-foreground">
              <Clock className="w-3.5 h-3.5 text-primary" />
              Semester {user?.semester_of_study}
            </span>
            {(user as any)?.group && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-background border border-border/60 text-foreground">
                <Award className="w-3.5 h-3.5 text-primary" />
                {(user as any).group}
              </span>
            )}
            {user?.specialization && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-background border border-border/60 text-foreground">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                {user.specialization}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
          <TabsList className="inline-flex w-max sm:w-full sm:grid sm:grid-cols-4 h-auto gap-2 bg-muted/50 p-1.5 rounded-xl border border-border/50">
            <TabsTrigger value="info" className="text-sm px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
              <div className="flex items-center gap-2 font-medium">
                <User className="w-4 h-4" />
                <span>Information</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="status" className="text-sm px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
              <div className="flex items-center gap-2 font-medium">
                <Award className="w-4 h-4" />
                <span>Status</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="security" className="text-sm px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
              <div className="flex items-center gap-2 font-medium">
                <Key className="w-4 h-4" />
                <span>Security</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="danger" className="text-sm px-4 py-2.5 rounded-lg data-[state=active]:bg-red-500/10 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 data-[state=active]:shadow-sm transition-all hover:text-red-600">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4" />
                <span>Danger Zone</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Information Tab */}
        <TabsContent value="info" className="mt-0">
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b border-border/50 pb-6">
              <CardTitle className="text-xl">Personal Information</CardTitle>
              <CardDescription>Update your academic and personal details</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-sm font-medium text-foreground/80">Full Name</Label>
                  <Input
                    id="name"
                    value={isEditing ? formData.name : user?.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    className={`transition-all ${isEditing ? 'border-primary ring-1 ring-primary/20' : 'bg-muted/30'}`}
                  />
                </div>
                
                {/* Email address with change flow */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground/80 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-primary" /> Email Address
                  </Label>
                  {emailChangeStep === 'idle' && (
                    <>
                      <div className="flex gap-2">
                        <Input value={user?.email} disabled className="bg-muted/50 text-muted-foreground flex-1" />
                        <Button size="sm" variant="outline" onClick={() => setEmailChangeStep('form')} className="shrink-0">Change</Button>
                      </div>
                      {(user as any)?.pending_email && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending change to: <strong>{(user as any).pending_email}</strong>
                        </p>
                      )}
                    </>
                  )}
                  {emailChangeStep === 'form' && (
                    <div className="space-y-2 p-3 border border-primary/30 rounded-lg bg-primary/5">
                      <p className="text-xs text-muted-foreground">Enter your new email address. A confirmation link will be sent to it.</p>
                      <div className="flex gap-2">
                        <Input placeholder="new@email.com" value={newEmailInput} onChange={e => setNewEmailInput(e.target.value)} type="email" className="flex-1" />
                        <Button size="sm" onClick={handleRequestEmailChange} disabled={emailChangeLoading || !newEmailInput.trim()}>
                          {emailChangeLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setEmailChangeStep('idle'); setNewEmailInput(''); }}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {emailChangeStep === 'sent' && (
                    <div className="p-3 border border-emerald-300 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800">
                      <p className="text-sm text-emerald-700 dark:text-emerald-400">
                        ✓ Confirmation link sent to <strong>{newEmailInput}</strong>. Click the link in that email to complete the change.
                      </p>
                      <button onClick={() => setEmailChangeStep('idle')} className="text-xs text-muted-foreground mt-1 hover:underline">Dismiss</button>
                    </div>
                  )}
                </div>

                {/* Phone number with change flow */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground/80 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-primary" /> Phone Number
                  </Label>
                  {phoneChangeStep === 'idle' && (
                    <div className="flex gap-2">
                      <Input value={user?.phone_number || 'Not set'} disabled className="bg-muted/50 text-muted-foreground flex-1" />
                      <Button size="sm" variant="outline" onClick={() => setPhoneChangeStep('form')} className="shrink-0">Change</Button>
                    </div>
                  )}
                  {phoneChangeStep === 'form' && (
                    <div className="space-y-2 p-3 border border-primary/30 rounded-lg bg-primary/5">
                      <p className="text-xs text-muted-foreground">Enter your new phone number (07xx or 01xx). A verification code will be sent to it.</p>
                      <div className="flex gap-2">
                        <Input placeholder="07XXXXXXXX" value={newPhoneInput} onChange={e => setNewPhoneInput(e.target.value)} type="tel" className="flex-1" />
                        <Button size="sm" onClick={handleRequestPhoneChange} disabled={phoneChangeLoading || !newPhoneInput.trim()}>
                          {phoneChangeLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setPhoneChangeStep('idle'); setNewPhoneInput(''); }}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {phoneChangeStep === 'otp' && (
                    <div className="space-y-2 p-3 border border-primary/30 rounded-lg bg-primary/5">
                      <p className="text-xs text-muted-foreground">Enter the 6-digit code sent to <strong>{newPhoneInput}</strong>.</p>
                      <div className="flex gap-2">
                        <Input placeholder="000000" value={phoneOtpCode} onChange={e => setPhoneOtpCode(e.target.value)} maxLength={6} className="flex-1 tracking-widest text-center" />
                        <Button size="sm" onClick={handleConfirmPhoneChange} disabled={phoneChangeLoading || phoneOtpCode.length < 6}>
                          {phoneChangeLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          Confirm
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setPhoneChangeStep('idle'); setPhoneOtpCode(''); setNewPhoneInput(''); }}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="username" className="text-sm font-medium text-foreground/80">Username</Label>
                  <Input
                    id="username"
                    value={user?.username}
                    disabled
                    className="bg-muted/50 text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground/70">Username cannot be changed</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="year" className="text-sm font-medium text-foreground/80">Year of Study</Label>
                  <Select
                    value={isEditing ? formData.year_of_study.toString() : user?.year_of_study?.toString()}
                    onValueChange={(value) => handleInputChange('year_of_study', parseInt(value))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className={isEditing ? 'border-primary ring-1 ring-primary/20' : 'bg-muted/30'}>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Year 1</SelectItem>
                      <SelectItem value="2">Year 2</SelectItem>
                      <SelectItem value="3">Year 3</SelectItem>
                      <SelectItem value="4">Year 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="semester" className="text-sm font-medium text-foreground/80">Semester</Label>
                  <Select
                    value={isEditing ? formData.semester_of_study.toString() : user?.semester_of_study?.toString()}
                    onValueChange={(value) => handleInputChange('semester_of_study', parseInt(value))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className={isEditing ? 'border-primary ring-1 ring-primary/20' : 'bg-muted/30'}>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="group" className="text-sm font-medium text-foreground/80">Study Group</Label>
                  {isEditing && groups.length > 0 ? (
                    <Select
                      value={formData.group}
                      onValueChange={(value) => {
                        handleInputChange('group', value);
                        handleInputChange('specialization', '');
                      }}
                    >
                      <SelectTrigger className="border-primary ring-1 ring-primary/20"><SelectValue placeholder="Select study group" /></SelectTrigger>
                      <SelectContent>
                        {groups.map(g => (
                          <SelectItem key={g.id} value={g.code}>{g.name} ({g.code})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={isEditing
                        ? (groups.length === 0 ? 'No groups added yet — ask admin' : (formData.group || 'Not set'))
                        : ((user as any)?.group || 'Not set')}
                      disabled
                      className="bg-muted/50 text-muted-foreground"
                    />
                  )}
                </div>

                {/* Specialization */}
                {(() => {
                  const selectedGroup = groups.find(g => g.code === (isEditing ? formData.group : (user as any)?.group));
                  const specs = (selectedGroup?.specializations || []).filter(s => s !== 'COMMON');
                  const displaySpec = isEditing ? formData.specialization : (user?.specialization || '');
                  if (!isEditing && !displaySpec) return null;
                  return (
                    <div className="space-y-3">
                      <Label htmlFor="specialization" className="text-sm font-medium text-foreground/80">Specialization</Label>
                      {isEditing && specs.length > 0 ? (
                        <Select
                          value={formData.specialization}
                          onValueChange={(value) => handleInputChange('specialization', value)}
                        >
                          <SelectTrigger className="border-primary ring-1 ring-primary/20"><SelectValue placeholder="Select specialization" /></SelectTrigger>
                          <SelectContent>
                            {specs.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={displaySpec || 'Not set'}
                          disabled
                          className="bg-muted/50 text-muted-foreground"
                        />
                      )}
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Status Tab */}
        <TabsContent value="status" className="mt-0">
          <Card className="border shadow-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 border-b border-border/50 pb-6">
              <CardTitle className="text-xl">Account Status</CardTitle>
              <CardDescription>Your verification and standing in the platform</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-5 rounded-xl border bg-card hover:bg-accent/5 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Email Verification</p>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{user?.is_verified ? 'Verified' : 'Pending'}</span>
                      {user?.is_verified && <Check className="w-5 h-5 text-emerald-500" />}
                    </div>
                  </div>
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full ${user?.is_verified ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                    <div className={`w-3 h-3 rounded-full shadow-sm ${user?.is_verified ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-5 rounded-xl border bg-card hover:bg-accent/5 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Platform Role</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold shadow-sm ${
                      user?.role === 'super_admin' ? 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' :
                      user?.role === 'admin' ? 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' :
                      'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}>
                      {user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : 'Student'}
                    </span>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800">
                    <Award className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-5 rounded-xl border bg-card hover:bg-accent/5 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Account Standing</p>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{user?.is_disabled ? 'Disabled' : 'Active & Healthy'}</span>
                    </div>
                  </div>
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full ${user?.is_disabled ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                    <div className={`w-3 h-3 rounded-full shadow-sm ${user?.is_disabled ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-5 rounded-xl border bg-card hover:bg-accent/5 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Member Since</p>
                    <p className="font-semibold text-lg">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800">
                    <Clock className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-0">
          <div className="grid grid-cols-1 gap-6">
            <Card className="border shadow-sm border-amber-200/50 dark:border-amber-900/50">
              <CardHeader className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 border-b border-amber-100 dark:border-amber-900/50 pb-6">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-500" />
                  Change Password
                </CardTitle>
                <CardDescription>Ensure your account stays secure with a strong password</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8">
                  <div className="space-y-3">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={securityForm.currentPassword}
                      onChange={(e) => handleSecurityInputChange('currentPassword', e.target.value)}
                      className="focus-visible:ring-amber-500 border-border"
                    />
                  </div>
                  <div className="hidden md:block"></div>
                  <div className="space-y-3">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={securityForm.newPassword}
                      onChange={(e) => handleSecurityInputChange('newPassword', e.target.value)}
                      className="focus-visible:ring-amber-500 border-border"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={securityForm.confirmPassword}
                      onChange={(e) => handleSecurityInputChange('confirmPassword', e.target.value)}
                      className="focus-visible:ring-amber-500 border-border"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-border/50">
                  <Button onClick={handlePasswordChange} disabled={isLoading} className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-muted/30">
                  <div className="mb-4 sm:mb-0">
                    <p className="font-semibold flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-muted-foreground" />
                      Not Enabled
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">We recommend enabling 2FA for maximum security.</p>
                  </div>
                  <Button variant="outline" disabled className="w-full sm:w-auto">
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Email Notifications
                </CardTitle>
                <CardDescription>Control which emails you receive from the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-card">
                  <div className="mb-4 sm:mb-0 flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${notifyOnUpload ? 'bg-primary/10' : 'bg-muted'}`}>
                      {notifyOnUpload ? <Bell className="w-4 h-4 text-primary" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">Upload decisions</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {notifyOnUpload
                          ? 'You will be emailed when your notes or past papers are approved or rejected, including any admin remarks.'
                          : 'You will not receive email notifications for upload decisions.'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={notifyOnUpload ? 'outline' : 'secondary'}
                    size="sm"
                    disabled={notifyLoading}
                    onClick={() => handleNotificationToggle(!notifyOnUpload)}
                    className="w-full sm:w-auto shrink-0"
                  >
                    {notifyLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                    {notifyOnUpload ? 'Turn off' : 'Turn on'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Danger Zone Tab */}
        <TabsContent value="danger" className="mt-0">
          <Card className="border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-red-50/50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/50 pb-6">
              <CardTitle className="text-xl text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-red-600/70 dark:text-red-400/70">
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {user?.role === 'super_admin' ? (
                <div className="p-5 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                      <ShieldAlert className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-purple-900 dark:text-purple-300">Protected Account</p>
                      <p className="text-sm text-purple-700 dark:text-purple-400 mt-1 leading-relaxed">
                        The Super Admin account is system-protected and cannot be deleted to ensure the platform always maintains an administrator.
                      </p>
                    </div>
                  </div>
                </div>
              ) : !showDeleteConfirm ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10">
                  <div className="flex-1 mb-4 sm:mb-0">
                    <p className="font-semibold text-foreground">Delete Account</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Permanently delete your account, files, and all associated data. This action cannot be reversed.
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full sm:w-auto shadow-sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              ) : (
                <div className="space-y-6 p-6 border border-red-200 dark:border-red-900/50 rounded-xl bg-red-50/50 dark:bg-red-950/20 animate-fade-in">
                  <div className="space-y-2 text-center sm:text-left">
                    <h4 className="text-lg font-bold text-red-600 dark:text-red-400">Are you absolutely sure?</h4>
                    <p className="text-sm text-red-800/80 dark:text-red-200/80 max-w-2xl">
                      {deleteStep === 'request' 
                        ? 'This action cannot be undone. This will permanently delete your account and remove your data from our servers. Click confirm to receive a verification code via email.'
                        : 'We sent a verification code to your email. Enter it below to confirm permanent account deletion.'
                      }
                    </p>
                  </div>
                  
                  {deleteStep === 'confirm' && (
                    <div className="space-y-3 max-w-sm mx-auto sm:mx-0">
                      <Label htmlFor="deleteCode" className="text-red-900 dark:text-red-200">Verification Code</Label>
                      <Input
                        id="deleteCode"
                        type="text"
                        placeholder="Enter the 6-digit code"
                        value={deleteCode}
                        onChange={(e) => setDeleteCode(e.target.value)}
                        className="border-red-300 dark:border-red-800 focus-visible:ring-red-500 bg-white dark:bg-background"
                      />
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      variant="destructive"
                      onClick={deleteStep === 'request' ? handleRequestDeletion : handleConfirmDeletion}
                      disabled={isLoading || (deleteStep === 'confirm' && !deleteCode)}
                      className="w-full sm:w-auto shadow-sm"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      {deleteStep === 'request' ? 'Send Deletion Code' : 'Permanently Delete'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteStep('request');
                        setDeleteCode('');
                      }}
                      className="w-full sm:w-auto border-red-200 hover:bg-red-100 dark:border-red-900/50 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={cropModalOpen} onOpenChange={(open) => { if (!isUploading) setCropModalOpen(open); }}>
        <DialogContent className="w-[95vw] max-w-lg p-4 sm:p-6 overflow-hidden">
          <div className="space-y-1 mb-3">
            <h2 className="text-base font-semibold">Adjust Profile Picture</h2>
            <p className="text-xs text-muted-foreground">Drag to reposition · Pinch or slide to zoom</p>
          </div>
          <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ height: 'min(55vw, 260px)' }}>
            <Cropper
              image={selectedImage}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
            />
          </div>
          <div className="space-y-3 mt-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-8 shrink-0">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                className="w-full h-1.5 accent-primary"
              />
            </div>
            {isUploading && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setCropModalOpen(false)} disabled={isUploading}>Cancel</Button>
              <Button size="sm" onClick={handleCropAndUpload} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    Save Photo
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
