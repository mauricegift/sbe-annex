import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, MapPin, Clock, Send, MessageCircle } from 'lucide-react';
import { showToast } from '@/lib/toast';
import { motion } from 'framer-motion';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    reason: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    showToast.success('Message sent successfully! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', subject: '', reason: '', message: '' });
    setIsSubmitting(false);
  };

  const contactReasons = [
    'General Inquiry',
    'Technical Support',
    'Account Issues',
    'Content Request',
    'Bug Report',
    'Feature Suggestion',
    'Partnership Inquiry',
    'Other'
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex flex-col">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{ backgroundImage: 'url(/android-chrome-512x512.png)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background/80 to-primary/10" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Get in Touch
            </h1>
            <p className="text-lg text-muted-foreground">
              Have questions, feedback, or need assistance? We're here to help. 
              Reach out to us and we'll respond as soon as possible.
            </p>
          </motion.div>
        </div>
      </section>

      <motion.div 
        className="container mx-auto px-4 pb-16 flex-1"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Contact Form */}
          <motion.div className="lg:col-span-2" variants={itemVariants}>
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason for Contact *</Label>
                      <Select
                        value={formData.reason}
                        onValueChange={(value) => setFormData({ ...formData, reason: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                        <SelectContent>
                          {contactReasons.map((reason) => (
                            <SelectItem key={reason} value={reason}>
                              {reason}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Brief description of your inquiry"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Please provide as much detail as possible..."
                      rows={6}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>Sending...</>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Info Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Email</p>
                      <a 
                        href="mailto:bbm@giftedtech.co.ke" 
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        bbm@giftedtech.co.ke
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Response Time</p>
                      <p className="text-sm text-muted-foreground">Within 24-48 hours</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Location</p>
                      <p className="text-sm text-muted-foreground">Kenya</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Social Media */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Connect With Us</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a
                    href="https://x.com/GiftedMauriceKe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-sm">
                      𝕏
                    </div>
                    <div>
                      <p className="font-medium text-sm">Twitter / X</p>
                      <p className="text-xs text-muted-foreground">@GiftedMauriceKe</p>
                    </div>
                  </a>
                  <a
                    href="https://github.com/mauricegift"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-sm">GitHub</p>
                      <p className="text-xs text-muted-foreground">mauricegift</p>
                    </div>
                  </a>
                  <a
                    href="https://whatsapp.com/channel/0029Vb3hlgX5kg7G0nFggl0Y"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">WhatsApp</p>
                      <p className="text-xs text-muted-foreground">Join our channel</p>
                    </div>
                  </a>
                  <a
                    href="https://instagram.com/giftedtechnexus"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Instagram</p>
                      <p className="text-xs text-muted-foreground">@giftedtechnexus</p>
                    </div>
                  </a>
                </CardContent>
              </Card>
            </motion.div>

            {/* FAQ Link */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold mb-2">Looking for quick answers?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Check our FAQ section for common questions and answers.
                  </p>
                  <Link 
                    to="/faq"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
                  >
                    View FAQ
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Contact;