import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EmailSubscribeFormProps {
  smartLinkId: string;
  title?: string;
  description?: string;
}

const EmailSubscribeForm = ({ smartLinkId, title, description }: EmailSubscribeFormProps) => {
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsSubscribing(true);
    try {
      const { error } = await supabase
        .from('email_subscribers')
        .insert({
          smart_link_id: smartLinkId,
          email
        });

      if (error) throw error;
      
      toast.success("Successfully subscribed!");
      setEmail("");
    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <form onSubmit={handleSubscribe} className="mt-8 p-6 bg-gray-50 rounded-xl">
      <h3 className="text-lg font-semibold mb-2">
        {title || "Subscribe to my newsletter"}
      </h3>
      <p className="text-gray-600 mb-4">
        {description || "Stay updated with my latest releases"}
      </p>
      <div className="space-y-3">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full"
        />
        <Button 
          type="submit" 
          className="w-full bg-black hover:bg-black/90 text-white"
          disabled={isSubscribing}
        >
          {isSubscribing ? "Subscribing..." : "Subscribe"}
        </Button>
      </div>
    </form>
  );
};

export default EmailSubscribeForm;