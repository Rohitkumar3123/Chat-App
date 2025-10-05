import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { FriendList } from "@/components/chat/FriendList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { FriendRequests } from "@/components/chat/FriendRequests";
import { AddFriend } from "@/components/chat/AddFriend";
import { UserProfile } from "@/components/chat/UserProfile";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const updateOnlineStatus = async (isOnline: boolean) => {
      await supabase
        .from("profiles")
        .update({ 
          is_online: isOnline,
          last_seen: new Date().toISOString()
        })
        .eq("id", user.id);
    };

    updateOnlineStatus(true);

    const handleBeforeUnload = () => updateOnlineStatus(false);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      updateOnlineStatus(false);
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!session || !user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <UserProfile userId={user.id} onLogout={handleLogout} />
        </div>

        <div className="p-4 space-y-4 border-b border-border">
          <AddFriend />
          <FriendRequests userId={user.id} />
        </div>

        <div className="flex-1 overflow-hidden">
          <FriendList
            userId={user.id}
            selectedFriendId={selectedFriendId}
            onSelectFriend={setSelectedFriendId}
          />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1">
        {selectedFriendId ? (
          <ChatWindow
            userId={user.id}
            friendId={selectedFriendId}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <p className="text-2xl font-semibold">Welcome to Chat App</p>
              <p>Select a friend to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
