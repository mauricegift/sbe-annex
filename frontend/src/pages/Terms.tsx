import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Shield, Users, BookOpen, Lock, AlertTriangle, Mail, Scale } from 'lucide-react';
import { motion } from 'framer-motion';

const Terms: React.FC = () => {
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
                <Scale className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
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
                    <BookOpen className="w-5 h-5 text-primary" />
                    Introduction
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    Welcome to BBM Annex! These Terms of Service ("Terms") govern your use of our educational platform 
                    and services. By accessing or using BBM Annex, you agree to be bound by these Terms. If you do not 
                    agree to these Terms, please do not use our services.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    BBM Annex is an academic resource sharing platform designed to help students access study materials, 
                    notes, past papers, and educational content.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* User Accounts */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    User Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Account Registration</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                      <li>You must provide accurate and complete information during registration</li>
                      <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                      <li>You must be a student or affiliated with an educational institution to use this platform</li>
                      <li>One account per person is allowed</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Account Responsibilities</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                      <li>You are responsible for all activities that occur under your account</li>
                      <li>You must notify us immediately of any unauthorized use of your account</li>
                      <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Acceptable Use */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Acceptable Use Policy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">You May:</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                      <li>Upload and share original study materials, notes, and educational content</li>
                      <li>Download materials for personal educational use</li>
                      <li>Collaborate with other students through the platform</li>
                      <li>Provide constructive feedback and reviews on shared content</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">You May Not:</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                      <li>Upload copyrighted material without proper authorization</li>
                      <li>Share exam answers or facilitate academic dishonesty</li>
                      <li>Upload malicious files, viruses, or harmful content</li>
                      <li>Harass, bully, or discriminate against other users</li>
                      <li>Use the platform for commercial purposes without authorization</li>
                      <li>Attempt to hack, disrupt, or compromise our systems</li>
                      <li>Create multiple accounts or impersonate others</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Content Ownership */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    Content Ownership & Intellectual Property
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground text-sm">
                  <p>
                    <strong className="text-foreground">Your Content:</strong> You retain ownership of the content you upload. 
                    By uploading content, you grant BBM Annex a non-exclusive, worldwide license to display, distribute, 
                    and make your content available to other users on the platform.
                  </p>
                  <p>
                    <strong className="text-foreground">Platform Content:</strong> The BBM Annex platform, including its design, 
                    features, and functionality, is owned by us and protected by intellectual property laws.
                  </p>
                  <p>
                    <strong className="text-foreground">Third-Party Content:</strong> We do not claim ownership of content 
                    uploaded by users. However, we reserve the right to remove content that violates these Terms or 
                    applicable laws.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Disclaimers */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                    Disclaimers & Limitations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground text-sm">
                  <p>
                    BBM Annex is provided "as is" without warranties of any kind. We do not guarantee the accuracy, 
                    completeness, or reliability of any content uploaded by users.
                  </p>
                  <p>
                    We are not responsible for any academic decisions you make based on content found on our platform. 
                    Always verify information with official sources and your instructors.
                  </p>
                  <p>
                    Our liability is limited to the maximum extent permitted by law. We are not liable for any 
                    indirect, incidental, or consequential damages arising from your use of the platform.
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
                    If you have any questions about these Terms of Service, please contact us at:
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
            <p>By using BBM Annex, you acknowledge that you have read and understood these Terms of Service.</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Terms;