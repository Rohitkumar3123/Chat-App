import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  status: string;
  is_online: boolean;
}

interface ChatWindowProps {
  userId: string;
  friendId: string;
}

export const ChatWindow = ({ userId, friendId }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [friendProfile, setFriendProfile] = useState<Profile | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchFriendProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", friendId)
        .single();

      if (data) {
        setFriendProfile(data as Profile);
      }
    };

    fetchFriendProfile();
  }, [friendId]);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .or(`sender_id.eq.${friendId},receiver_id.eq.${friendId}`)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(data as Message[]);
        
        // Mark messages as read
        await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("receiver_id", userId)
          .eq("sender_id", friendId)
          .eq("is_read", false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${userId}-${friendId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${friendId},receiver_id=eq.${userId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${userId},receiver_id=eq.${friendId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    // Subscribe to typing indicators
    const typingChannel = supabase
      .channel(`typing-${friendId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_indicators",
          filter: `user_id=eq.${friendId},chat_with_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new) {
            setIsTyping(payload.new.is_typing);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(typingChannel);
    };
  }, [userId, friendId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTyping = async () => {
    await supabase
      .from("typing_indicators")
      .upsert({
        user_id: userId,
        chat_with_id: friendId,
        is_typing: true,
        updated_at: new Date().toISOString(),
      });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(async () => {
      await supabase
        .from("typing_indicators")
        .upsert({
          user_id: userId,
          chat_with_id: friendId,
          is_typing: false,
          updated_at: new Date().toISOString(),
        });
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: userId,
        receiver_id: friendId,
        content: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
      
      // Clear typing indicator
      await supabase
        .from("typing_indicators")
        .upsert({
          user_id: userId,
          chat_with_id: friendId,
          is_typing: false,
          updated_at: new Date().toISOString(),
        });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!friendProfile) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar>
              <AvatarFallback>{getInitials(friendProfile.display_name)}</AvatarFallback>
            </Avatar>
            {friendProfile.is_online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
            )}
          </div>
          <div>
            <h2 className="font-semibold">{friendProfile.display_name}</h2>
            <p className="text-sm text-muted-foreground">
              {friendProfile.is_online ? "Online" : "Offline"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const isSent = message.sender_id === userId;
            return (
              <div
                key={message.id}
                className={`flex ${isSent ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isSent
                      ? "bg-[hsl(var(--chat-bubble-sent))] text-[hsl(var(--chat-bubble-sent-text))]"
                      : "bg-[hsl(var(--chat-bubble-received))] text-[hsl(var(--chat-bubble-received-text))]"
                  }`}
                >
                  <p className="break-words">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isSent ? "text-white/70" : "text-muted-foreground"
                    }`}
                  >
                    {format(new Date(message.created_at), "HH:mm")}
                  </p>
                </div>
              </div>
            );
          })}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[hsl(var(--chat-bubble-received))] text-[hsl(var(--chat-bubble-received-text))] rounded-2xl px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};
