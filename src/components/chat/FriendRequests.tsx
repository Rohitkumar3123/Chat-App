import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Check, X, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface FriendRequest {
  id: string;
  sender_id: string;
  status: string;
  created_at: string;
  sender: {
    id: string;
    username: string;
    display_name: string;
  };
}

interface FriendRequestsProps {
  userId: string;
}

export const FriendRequests = ({ userId }: FriendRequestsProps) => {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRequests = async () => {
      const { data } = await supabase
        .from("friend_requests")
        .select(
          `
          *,
          sender:profiles!friend_requests_sender_id_fkey(id, username, display_name)
        `
        )
        .eq("receiver_id", userId)
        .eq("status", "pending");

      if (data) {
        setRequests(data as any);
      }
    };

    fetchRequests();

    // Subscribe to friend request changes
    const channel = supabase
      .channel("friend-requests-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friend_requests",
          filter: `receiver_id=eq.${userId}`,
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleResponse = async (requestId: string, status: "accepted" | "rejected") => {
    try {
      const { error } = await supabase
        .from("friend_requests")
        .update({ status })
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: status === "accepted" ? "Friend request accepted" : "Friend request rejected",
        description:
          status === "accepted"
            ? "You can now chat with this user"
            : "The friend request has been rejected",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            <span>Friend Requests</span>
          </div>
          {requests.length > 0 && (
            <Badge variant="destructive">{requests.length}</Badge>
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="border border-border rounded-lg bg-card">
          {requests.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No pending requests
            </div>
          ) : (
            <ScrollArea className="max-h-64">
              <div className="p-2 space-y-2">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="p-3 rounded-lg border border-border bg-background"
                  >
                    <p className="font-medium text-sm mb-2">
                      {request.sender.display_name}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleResponse(request.id, "accepted")}
                        className="flex-1"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResponse(request.id, "rejected")}
                        className="flex-1"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
