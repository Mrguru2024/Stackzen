import { Metadata } from 'next';
import { MemberMentorMessagesApp } from '@/components/member-mentor-messages/MemberMentorMessagesApp';

export const metadata: Metadata = {
  title: 'Mentor Messages | StackZen',
  description: 'Message your financial mentors and join upcoming video sessions.',
};

export default function MentorMessagesPage() {
  return <MemberMentorMessagesApp />;
}
