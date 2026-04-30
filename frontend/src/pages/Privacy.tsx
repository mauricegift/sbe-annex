import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Shield, Database, Eye, Lock, Bell, Users, Trash2, Mail, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const Privacy: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      <div className="flex-1 py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
                <p className="text-muted-foreground">Last updated: 09-12-2025</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Introduction */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" />
                    Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    At BBM Annex, we take your privacy seriously. This Privacy Policy explains how we collect, use, 
                    disclose, and safeguard your information when you use our educational platform. Please read this 
                    policy carefully to understand our practices regarding your personal data.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Information We Collect */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Information We Collect
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Personal Information</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                      <li><strong>Account Information:</strong> Name, username, email address, phone number</li>
                      <li><strong>Academic Information:</strong> Year of study, semester, specialization</li>
                      <li><strong>Profile Information:</strong> Profile picture (optional)</li>
                      <li><strong>Authentication Data:</strong> Password (encrypted), verification codes</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Usage Information</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                      <li>Content you upload (notes, past papers, blog posts)</li>
                      <li>Content you view and download</li>
                      <li>Reviews and ratings you provide</li>
                      <li>Login timestamps and session information</li>
                      <li>Device information and browser type</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* How We Use Your Information */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    How We Use Your Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">To Provide Our Services</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                      <li>Create and manage your account</li>
                      <li>Display relevant content based on your year and specialization</li>
                      <li>Enable you to upload, share, and access educational materials</li>
                      <li>Process your reviews and feedback</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">To Improve Our Platform</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                      <li>Analyze usage patterns to enhance user experience</li>
                      <li>Develop new features and functionality</li>
                      <li>Fix bugs and troubleshoot issues</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">To Communicate With You</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                      <li>Send verification codes via email or SMS</li>
                      <li>Notify you about important updates or changes</li>
                      <li>Respond to your inquiries and support requests</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Data Security */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    Data Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground text-sm">
                  <p>
                    We implement appropriate technical and organizational security measures to protect your personal 
                    information against unauthorized access, alteration, disclosure, or destruction.
                  </p>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Our Security Measures Include:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Encryption of passwords and sensitive data</li>
                      <li>Secure HTTPS connections for all data transmission</li>
                      <li>Regular security audits and updates</li>
                      <li>Access controls and authentication requirements</li>
                      <li>Secure file storage and handling</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Data Sharing */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    Data Sharing & Disclosure
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground text-sm">
                  <p>
                    <strong className="text-foreground">We do not sell your personal information.</strong> We may share 
                    your information only in the following circumstances:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>With Other Users:</strong> Your public profile information (name, username, profile picture) 
                        is visible to other users when you upload content or leave reviews</li>
                    <li><strong>With Service Providers:</strong> We may share data with trusted third-party services 
                        that help us operate our platform (e.g., email services, hosting providers)</li>
                    <li><strong>For Legal Reasons:</strong> We may disclose information if required by law or to protect 
                        our rights and the safety of our users</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Your Rights */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Your Rights & Choices
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground text-sm">
                  <p>You have the following rights regarding your personal data:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Access:</strong> Request a copy of your personal data</li>
                    <li><strong>Correction:</strong> Update or correct inaccurate information through your profile settings</li>
                    <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
                    <li><strong>Portability:</strong> Request your data in a portable format</li>
                    <li><strong>Opt-out:</strong> Unsubscribe from non-essential communications</li>
                  </ul>
                  <p className="mt-4">
                    To exercise any of these rights, please contact us at{' '}
                    <a href="mailto:bbm@giftedtech.co.ke" className="text-primary hover:underline">
                      bbm@giftedtech.co.ke
                    </a>
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Data Retention */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-primary" />
                    Data Retention
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground text-sm">
                  <p>
                    We retain your personal information for as long as your account is active or as needed to provide 
                    you with our services. If you delete your account, we will delete or anonymize your personal data 
                    within 30 days, except where we are required to retain it for legal purposes.
                  </p>
                  <p>
                    Content you have uploaded may remain visible to other users even after account deletion, unless 
                    you specifically request its removal.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    Contact Us
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  <p>
                    If you have any questions about this Privacy Policy or our data practices, please contact us at:
                  </p>
                  <p className="mt-2">
                    <a href="mailto:bbm@giftedtech.co.ke" className="text-primary hover:underline">
                      bbm@giftedtech.co.ke
                    </a>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Footer Text */}
          <motion.div 
            className="mt-8 text-center text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p>By using BBM Annex, you consent to the collection and use of information as described in this Privacy Policy.</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;