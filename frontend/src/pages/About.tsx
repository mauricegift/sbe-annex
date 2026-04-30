import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, Target, Award, Heart, Lightbulb, Shield, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import { AboutSkeleton } from '@/components/PageSkeletons';

const About: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for smooth skeleton display
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <AboutSkeleton />;
  }
  const stats = [
    { label: 'Active Students', value: '70+', icon: Users },
    { label: 'Study Materials', value: '100+', icon: BookOpen },
    { label: 'Course Units', value: '20+', icon: Award },
    { label: 'Success Rate', value: '95%', icon: Target }
  ];

  const values = [
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'We continuously improve our platform with cutting-edge technology to enhance the learning experience.'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Building a supportive community where students help each other succeed academically.'
    },
    {
      icon: Shield,
      title: 'Quality',
      description: 'Every resource is reviewed to ensure accuracy and relevance to your curriculum.'
    },
    {
      icon: Rocket,
      title: 'Accessibility',
      description: 'Making quality education resources accessible to all students, anywhere, anytime.'
    }
  ];

  const team = [
    {
      name: 'Gifted Maurice',
      role: 'Admin & Developer',
      description: 'Passionate about education technology and empowering students with better learning tools.',
      image: '/team/mygifted2.png'
    },
    {
      name: 'Dantech Securenet',
      role: 'Admin, Asst Developer & Class Rep',
      description: 'Dedicated to providing seamless user experience and maintaining platform quality.',
      image: '/team/dantech-securenet.jpg'
    },
    {
      name: 'Alice Okumu',
      role: 'Admin Oversee & Class Rep',
      description: 'Ensuring smooth operations and community engagement across the platform.',
      image: ''
    },
    {
      name: 'Joseph Kiarie',
      role: 'Overall Class Rep',
      description: 'Bridging the gap between students and the platform for better academic resources.',
      image: ''
    }
  ];

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
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              About BBM Annex
            </h1>
            <p className="text-lg text-muted-foreground">
              Empowering students with comprehensive academic resources, study materials, 
              and a collaborative learning community.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-16 space-y-16 flex-1">
        {/* Mission Section */}
        <section className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Target className="w-6 h-6 text-primary" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground leading-relaxed text-lg">
                To democratize access to quality educational resources by providing a centralized 
                platform where students can discover, share, and collaborate on study materials. 
                We believe every student deserves equal access to the tools they need to excel 
                in their academic journey.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Stats Section */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <Card key={stat.label} className="border-0 shadow-lg bg-card/80 backdrop-blur-sm text-center p-6">
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Values Section */}
        <section className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <Card key={value.title} className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Story Section */}
        <section className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Heart className="w-6 h-6 text-primary" />
                Our Story
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                BBM Annex was born from a simple observation: students often struggle to find 
                quality study materials, especially for specific courses and specializations. 
                What started as a small collection of shared notes among friends has grown 
                into a comprehensive platform serving thousands of students.
              </p>
              <p>
                We understand the challenges of academic life—tight deadlines, overwhelming 
                syllabi, and the constant pressure to perform. That's why we created a 
                platform that not only provides access to study materials but also fosters 
                a community of learners who support each other.
              </p>
              <p>
                Today, BBM Annex continues to evolve, adding new features and resources to 
                better serve our growing community of students. Our commitment remains the 
                same: to make quality education accessible to everyone.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Team Section */}
        <section className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Meet the Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ 
                  y: -8, 
                  scale: 1.02,
                  transition: { duration: 0.2 } 
                }}
              >
                <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm h-full transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/10">
                  <CardContent className="pt-6 text-center">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                    >
                      {member.image ? (
                        <img 
                          src={member.image} 
                          alt={member.name}
                          className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-2 border-primary/30 transition-all duration-300 hover:border-primary"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4 transition-all duration-300 hover:from-primary/80 hover:to-accent">
                          <span className="text-2xl font-bold text-primary-foreground">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      )}
                    </motion.div>
                    <h3 className="font-semibold text-lg">{member.name}</h3>
                    <p className="text-primary text-sm mb-3">{member.role}</p>
                    <p className="text-sm text-muted-foreground">{member.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto text-center">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur-sm">
            <CardContent className="py-12">
              <h2 className="text-2xl font-bold mb-4">Join Our Community</h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Be part of a growing community of students helping each other succeed. 
                Start exploring resources or contribute your own materials today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  to="/register" 
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Get Started
                </Link>
                <Link 
                  to="/contact" 
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

    </div>
  );
};

export default About;