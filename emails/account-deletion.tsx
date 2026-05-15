import React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { format } from 'date-fns';

interface AccountDeletionEmailProps {
  username: string;
  deletionDate: Date;
  daysRemaining: number;
}

export const AccountDeletionEmail = ({
  username,
  deletionDate,
  daysRemaining,
}: AccountDeletionEmailProps) => {
  const previewText = `Your StackZen account will be permanently deleted in ${daysRemaining} days`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={_main}>
        <Container style={_container}>
          <Heading style={_h1}>Account Deletion Notice</Heading>
          <Section style={_section}>
            <Text style={_text}>Hi {username},</Text>
            <Text style={_text}>
              This is a reminder that your StackZen account is scheduled for permanent deletion on{' '}
              {format(deletionDate, 'MMMM d, yyyy')}. You have {daysRemaining} days remaining to
              recover your account.
            </Text>
            <Text style={_text}>
              If you wish to keep your account, you can recover it by logging in with your email and
              password. All your data will be restored to its original state.
            </Text>
            <Text style={_text}>
              If you do not take any action, your account and all associated data will be
              permanently deleted after the grace period ends.
            </Text>
            <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/login`} style={_button}>
              Recover Account
            </Link>
            <Text style={_text}>
              If you have any questions or need assistance, please don&apos;t hesitate to contact
              our support team.
            </Text>
            <Text style={_text}>
              Best regards,
              <br />
              The StackZen Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const _main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const _container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const _section = {
  padding: '24px',
  backgroundColor: '#f6f9fc',
  borderRadius: '8px',
};

const _h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 24px',
};

const _text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0 0 16px',
};

const _button = {
  backgroundColor: '#000',
  borderRadius: '4px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '1.5',
  margin: '24px 0',
  padding: '12px 24px',
  textDecoration: 'none',
  textAlign: 'center' as const,
};

export default AccountDeletionEmail;
