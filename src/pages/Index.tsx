import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, Zap, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };

    checkAuth();
  }, [navigate]);

  const features = [
    {
      icon: MessageSquare,
      title: "Real-time Messaging",
      description: "Chat with friends instantly with real-time message delivery",
    },
    {
      icon: Users,
      title: "Friend Requests",
      description: "Send and receive friend requests to build your network",
    },
    {
      icon: Zap,
      title: "Typing Indicators",
      description: "See when your friends are typing a message",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your conversations are protected with enterprise-grade security",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <MessageSquare className="w-10 h-10 text-primary" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Connect & Chat in Real-Time
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
            A beautiful, modern chat application where you can send friend requests, 
            chat with friends, and stay connected in real-time.
          </p>

          <div className="flex gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/auth")}
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm hover:bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${(index + 4) * 150}ms` }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center p-12 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur-sm">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands of users already chatting with friends and making connections.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate("/auth")}
            className="shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Create Your Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
