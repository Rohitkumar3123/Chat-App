import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, MessageSquare } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  status: string;
}

interface UserProfileProps {
  userId: string;
  onLogout: () => void;
}

export const UserProfile = ({ userId, onLogout }: UserProfileProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (data) {
        setProfile(data as Profile);
      }
    };

    fetchProfile();
  }, [userId]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!profile) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Chat App
        </h1>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <Avatar className="w-12 h-12">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {getInitials(profile.display_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{profile.display_name}</p>
          <p className="text-sm text-muted-foreground truncate">@{profile.username}</p>
        </div>
        <Button size="icon" variant="ghost" onClick={onLogout}>
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
