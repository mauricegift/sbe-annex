import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '../components/ui/accordion';
import { Input } from '../components/ui/input';
import { 
  HelpCircle, 
  Search, 
  Shield, 
  Settings, 
  Mail,
  FileText,
  Star,
  UserPlus,
  Key
} from 'lucide-react';
import { motion } from 'framer-motion';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // Getting Started
  {
    category: "Getting Started",
    question: "What is BBM Annex?",
    answer: "BBM Annex is an academic resource sharing platform designed to help students access study materials, notes, past papers, and educational content. It provides a collaborative space where students can share and discover quality educational resources."
  },
  {
    category: "Getting Started",
    question: "How do I create an account?",
    answer: "Click on the 'Register' button on the login page. Fill in your details including your name, email, username, year of study, and semester. Choose your preferred verification method (email or SMS), create a strong password, and accept the Terms and Conditions. You will receive a 6-digit verification code to complete your registration."
  },
  {
    category: "Getting Started",
    question: "I did not receive my verification code. What should I do?",
    answer: "First, check your spam or junk folder if you selected email verification. If using SMS, ensure you entered a valid phone number. You can request a new code by clicking 'Resend Code' on the verification page. Wait at least 60 seconds between resend attempts. If issues persist, contact support."
  },
  {
    category: "Getting Started",
    question: "Can I change my username after registration?",
    answer: "Currently, usernames cannot be changed after registration as they serve as unique identifiers. Please choose your username carefully during registration. If you need to change it, contact our support team for assistance."
  },
  
  // Notes & Past Papers
  {
    category: "Notes & Past Papers",
    question: "How do I upload notes or past papers?",
    answer: "Navigate to the Notes or Past Papers section and click the 'Upload' button. Fill in the required details including title, course unit, year, semester, and specialization. Select your file (PDF format recommended) and optionally add a thumbnail image. Click 'Submit' to upload. Your content will be reviewed by admins before being published."
  },
  {
    category: "Notes & Past Papers",
    question: "What file formats are supported?",
    answer: "We primarily support PDF files for notes and past papers. For thumbnails, we accept common image formats including JPG, PNG, and WebP. Maximum file sizes apply to ensure fast loading times for all users."
  },
  {
    category: "Notes & Past Papers",
    question: "Why is my uploaded content not visible yet?",
    answer: "All uploaded content goes through a review process by our admin team to ensure quality and appropriateness. This typically takes 24-48 hours. You will be notified once your content is approved or if any changes are needed."
  },
  {
    category: "Notes & Past Papers",
    question: "Can I download notes and past papers for offline use?",
    answer: "Yes! You can download any available notes or past papers by clicking the download button on the document viewer. Downloaded files can be accessed offline for your personal study use."
  },
  {
    category: "Notes & Past Papers",
    question: "How do I find content for my specific course?",
    answer: "Use the filter options available on the Notes and Past Papers pages. You can filter by year of study, semester, specialization, and course unit. You can also use the search function to find specific topics or course names."
  },
  
  // Account & Profile
  {
    category: "Account & Profile",
    question: "How do I update my profile information?",
    answer: "Go to your Profile page by clicking on your avatar or navigating to the Profile section. Here you can update your profile picture, name, year of study, semester, and specialization. Some fields may require re-verification."
  },
  {
    category: "Account & Profile",
    question: "How do I reset my password?",
    answer: "Click 'Forgot Password' on the login page. Enter your registered email address to receive a reset code. Enter the 6-digit code and create a new strong password. Your new password must meet our security requirements (8+ characters, uppercase, lowercase, number, special character)."
  },
  {
    category: "Account & Profile",
    question: "How do I delete my account?",
    answer: "Account deletion can be requested through your Profile settings. Please note that this action is permanent and will remove all your data including uploaded content. Contact support if you need assistance with account deletion."
  },
  
  // Reviews & Ratings
  {
    category: "Reviews & Ratings",
    question: "How do reviews work?",
    answer: "After viewing notes, past papers, or blog posts, you can leave a review with a star rating (1-5 stars) and written feedback. Reviews help other students find quality content and provide feedback to content creators."
  },
  {
    category: "Reviews & Ratings",
    question: "Can I edit or delete my review?",
    answer: "Currently, reviews cannot be edited after submission. Please ensure your review is accurate before submitting. If you need to remove an inappropriate review, contact our support team."
  },
  
  // Security & Privacy
  {
    category: "Security & Privacy",
    question: "How is my data protected?",
    answer: "We implement industry-standard security measures including password encryption, secure HTTPS connections, and regular security audits. Your personal information is never sold to third parties. Read our full Privacy Policy for detailed information."
  },
  {
    category: "Security & Privacy",
    question: "Who can see my uploaded content?",
    answer: "Once approved, your uploaded notes and past papers are visible to all registered users of the platform. Your name and profile picture are displayed as the uploader to give proper attribution."
  },
  {
    category: "Security & Privacy",
    question: "What happens to my data if I delete my account?",
    answer: "Upon account deletion, your personal information is removed within 30 days. Content you have uploaded may remain visible to other users unless you specifically request its removal before deleting your account."
  },
  
  // Technical Issues
  {
    category: "Technical Issues",
    question: "The website is not loading properly. What should I do?",
    answer: "Try refreshing the page or clearing your browser cache. Ensure you have a stable internet connection. Try using a different browser. If issues persist, check our social media for any reported outages or contact support."
  },
  {
    category: "Technical Issues",
    question: "I cannot view PDF files on the platform.",
    answer: "Ensure your browser supports PDF viewing (most modern browsers do). Try disabling browser extensions that might interfere. Alternatively, download the file and open it with a dedicated PDF reader application."
  },
  {
    category: "Technical Issues",
    question: "My upload keeps failing. How can I fix this?",
    answer: "Check that your file meets the size requirements and is in a supported format (PDF for documents). Ensure you have a stable internet connection. Try compressing large files before uploading. If using mobile, ensure you have sufficient storage space."
  }
];

const categoryIcons: Record<string, React.ReactNode> = {
  "Getting Started": <UserPlus className="w-5 h-5" />,
  "Notes & Past Papers": <FileText className="w-5 h-5" />,
  "Account & Profile": <Settings className="w-5 h-5" />,
  "Reviews & Ratings": <Star className="w-5 h-5" />,
  "Security & Privacy": <Shield className="w-5 h-5" />,
  "Technical Issues": <Key className="w-5 h-5" />
};

const FAQ: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const categories = [...new Set(faqData.map(item => item.category))];
  
  const filteredFAQs = faqData.filter(item => 
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const groupedFAQs = categories.reduce((acc, category) => {
    acc[category] = filteredFAQs.filter(item => item.category === category);
    return acc;
  }, {} as Record<string, FAQItem[]>);

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
                <HelpCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h1>
                <p className="text-muted-foreground">Find answers to common questions about BBM Annex</p>
              </div>
            </div>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm mb-8">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search for answers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 bg-background border-border/50"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Links */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {categories.map((category) => (
              <motion.a
                key={category}
                href={`#${category.toLowerCase().replace(/\s+/g, '-')}`}
                className="flex items-center gap-3 p-4 rounded-lg bg-card/60 border border-border/50 hover:border-primary/50 hover:bg-card/80 transition-all group"
                variants={itemVariants}
              >
                <div className="text-primary group-hover:scale-110 transition-transform">
                  {categoryIcons[category]}
                </div>
                <span className="text-sm font-medium text-foreground">{category}</span>
              </motion.a>
            ))}
          </motion.div>

          {/* FAQ Sections */}
          <motion.div 
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {categories.map((category) => {
              const items = groupedFAQs[category];
              if (items.length === 0) return null;
              
              return (
                <motion.div key={category} variants={itemVariants}>
                  <Card 
                    id={category.toLowerCase().replace(/\s+/g, '-')}
                    className="border-0 shadow-lg bg-card/80 backdrop-blur-sm scroll-mt-8"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-primary">
                          {categoryIcons[category]}
                        </div>
                        <h2 className="text-xl font-semibold text-foreground">{category}</h2>
                      </div>
                      
                      <Accordion type="single" collapsible className="w-full">
                        {items.map((item, index) => (
                          <AccordionItem 
                            key={index} 
                            value={`${category}-${index}`}
                            className="border-border/50"
                          >
                            <AccordionTrigger className="text-left hover:text-primary transition-colors py-4">
                              <span className="text-sm font-medium pr-4">{item.question}</span>
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4">
                              {item.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* No Results */}
          {filteredFAQs.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
                  <p className="text-muted-foreground text-sm">
                    Try adjusting your search query or browse the categories above.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/10 to-primary/5 mt-8">
              <CardContent className="p-6 text-center">
                <Mail className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Still have questions?</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
                <a 
                  href="/contact" 
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Contact Support
                </a>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;