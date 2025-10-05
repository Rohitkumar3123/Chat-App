import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface Friend {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  status: string;
  is_online: boolean;
  last_seen: string;
}

interface FriendListProps {
  userId: string;
  selectedFriendId: string | null;
  onSelectFriend: (friendId: string) => void;
}

export const FriendList = ({ userId, selectedFriendId, onSelectFriend }: FriendListProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
    const fetchFriends = async () => {
      const { data: friendships } = await supabase
        .from("friendships")
        .select("friend_id")
        .eq("user_id", userId);

      if (friendships && friendships.length > 0) {
        const friendIds = friendships.map((f) => f.friend_id);
        const { data: friendsData } = await supabase
          .from("profiles")
          .select("*")
          .in("id", friendIds);

        if (friendsData) {
          setFriends(friendsData as Friend[]);
        }
      }
    };

    fetchFriends();

    // Subscribe to profile changes
    const channel = supabase
      .channel("profiles-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          fetchFriends();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Users className="w-4 h-4" />
          <span>Friends ({friends.length})</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {friends.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              No friends yet. Add friends to start chatting!
            </div>
          ) : (
            friends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => onSelectFriend(friend.id)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  selectedFriendId === friend.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar>
                      <AvatarFallback>{getInitials(friend.display_name)}</AvatarFallback>
                    </Avatar>
                    {friend.is_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{friend.display_name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {friend.is_online ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
