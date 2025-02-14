
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const Account = () => {
  const { session } = useSessionContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      <div className="space-y-6">
        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          <p className="text-muted-foreground">Email: {session?.user.email}</p>
        </div>
      </div>
    </div>
  );
};

export default Account;
