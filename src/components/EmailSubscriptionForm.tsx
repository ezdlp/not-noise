import React from 'react';
import EmailSubscribeForm from './smart-link/EmailSubscribeForm';

interface EmailSubscriptionFormProps {
  smartLinkId: string;
}

export const EmailSubscriptionForm = ({ smartLinkId }: EmailSubscriptionFormProps) => {
  return <EmailSubscribeForm smartLinkId={smartLinkId} />;
};