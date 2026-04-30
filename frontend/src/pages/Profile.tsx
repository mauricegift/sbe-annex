import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI, authAPI, profileAPI } from '../lib/api';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from '../lib/toast';
import { Camera, Save, Loader2, Key, ShieldAlert, Trash2, RefreshCw } from 'lucide-react';
import { ProfileSkeleton } from '../components/PageSkeletons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent } from '../components/ui/dialog';
import getCroppedImg from '../lib/cropImage';
import { isIOSDevice, logMobileUploadDebug } from '../utils/mobileUploadFix';
import { groupsAPI } from '../lib/api';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('info');
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
    }
  }, [user]);

  useEffect(() => {
    groupsAPI.getGroups().then(r => setGroups(r.data || [])).catch(() => {});
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
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid image type",
        description: "Please select a valid image (JPEG, PNG, WEBP)",
        variant: "destructive",
      });
      return;
    }
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "Please select an image smaller than 5MB",
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
      setUploadProgress(50);
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(croppedBlob);
      });
      setUploadProgress(80);
      const response = await userAPI.updateProfilePicture(base64);
      const updatedUser = { ...user, profile_picture: response.data?.profile_picture || base64 };
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
      await authAPI.requestAccountDeletion('email');
      setDeleteStep('confirm');
      toast({
        title: "Deletion code sent",
        description: "Please check your email for the verification code.",
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
    <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info" onClick={() => setActiveTab('info')} className="text-xs sm:text-sm">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <span className="hidden sm:inline">Information</span>
                <span className="sm:hidden">Info</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="status" onClick={() => setActiveTab('status')} className="text-xs sm:text-sm">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <span>Status</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="security" onClick={() => setActiveTab('security')} className="text-xs sm:text-sm">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Key className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Security</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="danger" onClick={() => setActiveTab('danger')} className="text-xs sm:text-sm">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <ShieldAlert className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Danger</span>
                <span className="sm:hidden">Danger</span>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Information Tab */}
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your profile information</CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="space-x-2">
                    <Button variant="outline" onClick={() => {
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
                      <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={user?.profile_picture} alt={user?.name} />
                      <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full touch-manipulation"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        logMobileUploadDebug('Profile pic button click');
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                          // Small delay for iOS
                          if (isIOSDevice()) {
                            setTimeout(() => fileInputRef.current?.click(), 100);
                          } else {
                            fileInputRef.current.click();
                          }
                        }
                      }}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePicSelect}
                      className="hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium">{user?.name}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <p className="text-sm text-muted-foreground">@{user?.username}</p>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      user?.role === 'super_admin' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' :
                      user?.role === 'admin' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' :
                      'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                    }`}>
                      {user?.role === 'super_admin' ? '⭐ Super Admin' : user?.role === 'admin' ? '🛡 Admin' : '🎓 Student'}
                    </span>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={isEditing ? formData.name : user?.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      value={user?.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={user?.phone_number || 'Not set'}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Phone number cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={user?.username}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Username cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Year of Study</Label>
                    <Select
                      value={isEditing ? formData.year_of_study.toString() : user?.year_of_study?.toString()}
                      onValueChange={(value) => handleInputChange('year_of_study', parseInt(value))}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
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

                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester</Label>
                    <Select
                      value={isEditing ? formData.semester_of_study.toString() : user?.semester_of_study?.toString()}
                      onValueChange={(value) => handleInputChange('semester_of_study', parseInt(value))}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Semester 1</SelectItem>
                        <SelectItem value="2">Semester 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Study Group - dynamic from admin */}
                  <div className="space-y-2">
                    <Label htmlFor="group">Study Group</Label>
                    {isEditing && groups.length > 0 ? (
                      <Select
                        value={formData.group}
                        onValueChange={(value) => {
                          handleInputChange('group', value);
                          handleInputChange('specialization', '');
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="Select study group" /></SelectTrigger>
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
                        className="bg-muted"
                      />
                    )}
                  </div>

                  {/* Specialization - dynamic from selected group */}
                  {(() => {
                    const selectedGroup = groups.find(g => g.code === (isEditing ? formData.group : (user as any)?.group));
                    const specs = selectedGroup?.specializations || [];
                    const displaySpec = isEditing ? formData.specialization : (user?.specialization || '');
                    if (!isEditing && !displaySpec) return null;
                    return (
                      <div className="space-y-2">
                        <Label htmlFor="specialization">Specialization</Label>
                        {isEditing && specs.length > 0 ? (
                          <Select
                            value={formData.specialization}
                            onValueChange={(value) => handleInputChange('specialization', value)}
                          >
                            <SelectTrigger><SelectValue placeholder="Select specialization" /></SelectTrigger>
                            <SelectContent>
                              {specs.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={displaySpec || 'Not set'}
                            disabled
                            className="bg-muted"
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
          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
                <CardDescription>Your account verification and status information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground">Email Status</p>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${user?.is_verified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <p className={`font-medium ${user?.is_verified ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                        {user?.is_verified ? 'Verified' : 'Pending Verification'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground">Account Role</p>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        user?.role === 'super_admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                        user?.role === 'admin' ? 'bg-primary/10 text-primary' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {user?.role === 'super_admin' ? '⭐ Super Admin' : user?.role === 'admin' ? '🛡 Admin' : '🎓 Student'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground">Account Status</p>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${user?.is_disabled ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <p className={`font-medium ${user?.is_disabled ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {user?.is_disabled ? 'Disabled' : 'Active'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                    <p className="font-medium">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Change your password and manage security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={securityForm.currentPassword}
                      onChange={(e) => handleSecurityInputChange('currentPassword', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={securityForm.newPassword}
                      onChange={(e) => handleSecurityInputChange('newPassword', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={securityForm.confirmPassword}
                      onChange={(e) => handleSecurityInputChange('confirmPassword', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handlePasswordChange} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">2FA Status</p>
                    <p className="text-sm text-muted-foreground">Not enabled</p>
                  </div>
                  <Button variant="outline" disabled>
                    Enable 2FA
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger">
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Permanently delete your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {user?.role === 'super_admin' ? (
                  <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                    <p className="font-medium text-purple-800 dark:text-purple-300">Super Admin accounts cannot be deleted</p>
                    <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                      The Super Admin account is protected and cannot be deleted to ensure the platform always has an administrator.
                    </p>
                  </div>
                ) : !showDeleteConfirm ? (
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
                        {deleteStep === 'request' 
                          ? 'This action cannot be undone. Click confirm to receive a verification code via email.'
                          : 'Enter the verification code sent to your email to confirm account deletion.'
                        }
                      </p>
                    </div>
                    
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
                        onClick={deleteStep === 'request' ? handleRequestDeletion : handleConfirmDeletion}
                        disabled={isLoading || (deleteStep === 'confirm' && !deleteCode)}
                        className="w-full sm:w-auto"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        {deleteStep === 'request' ? 'Confirm Deletion' : 'Delete Account'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteStep('request');
                          setDeleteCode('');
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
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="max-w-lg">
          <div className="relative w-full h-64 bg-black">
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
          <div className="space-y-4 mt-4">
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="w-full"
            />
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCropModalOpen(false)} disabled={isUploading}>Cancel</Button>
              <Button onClick={handleCropAndUpload} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save
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
