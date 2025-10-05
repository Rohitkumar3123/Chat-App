import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const AddFriend = () => {
  const [username, setUsername] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAddFriend = async () => {
    if (!username.trim()) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Find user by username
      const { data: targetUser, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.trim())
        .single();

      if (userError || !targetUser) {
        throw new Error("User not found");
      }

      if (targetUser.id === user.id) {
        throw new Error("You cannot add yourself as a friend");
      }

      // Check if already friends or request exists
      const { data: existingRequest } = await supabase
        .from("friend_requests")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .or(`sender_id.eq.${targetUser.id},receiver_id.eq.${targetUser.id}`)
        .single();

      if (existingRequest) {
        throw new Error("Friend request already exists");
      }

      // Send friend request
      const { error } = await supabase.from("friend_requests").insert({
        sender_id: user.id,
        receiver_id: targetUser.id,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Friend request sent!",
        description: `Your friend request has been sent to ${username}`,
      });

      setUsername("");
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Friend
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Friend</DialogTitle>
          <DialogDescription>
            Enter the username of the person you want to add as a friend.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddFriend();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAddFriend} disabled={isLoading || !username.trim()}>
            {isLoading ? "Sending..." : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
