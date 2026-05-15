import type { Meta, StoryObj } from '@storybook/react';
import { OperationalAlertCards } from '@/components/operational-center/OperationalAlertCards';
import type { OperationalAlertDto } from '@/lib/operational-notifications/types';
import {
  AutomationNotificationType,
  FinancialEntityType,
  NotificationSeverity,
} from '@prisma/client';
import { stubOperationalExplainability } from '@/lib/explainability/stub';

const samples: OperationalAlertDto[] = [
  {
    id: 'cjld2cjxh0000qzrmn831i9rm',
    automationType: AutomationNotificationType.AUTOMATION_ACTION,
    domain: 'invoice',
    uiPriority: 'critical',
    severity: NotificationSeverity.CRITICAL,
    title: 'Invoice INV-1001 is overdue',
    body: 'Outstanding · follow up immediately.',
    createdAt: new Date().toISOString(),
    readAt: null,
    inAttentionQueue: true,
    suppressed: false,
    relatedEntityType: FinancialEntityType.INVOICE,
    relatedEntityId: 'cjld2cjxi0002qzrmn831i9ro',
    actions: [{ type: 'OPEN_INVOICE', invoiceId: 'cjld2cjxi0002qzrmn831i9ro' }],
    trust: {
      why: 'The due date passed while the invoice remains unpaid.',
      recommendedNextStep: 'Open the invoice and record payment or send a reminder.',
    },
    dedupeKey: 'entity:INVOICE:cjld2cjxi0002qzrmn831i9ro',
    explainability: {
      ...stubOperationalExplainability('cjld2cjxh0000qzrmn831i9rm'),
      attentionKind: 'invoice_overdue_demo',
      blocks: [
        {
          kind: 'trust_reference',
          why: 'The due date passed while the invoice remains unpaid.',
          recommendedNextStep: 'Open the invoice and record payment or send a reminder.',
          sourceEventType: 'INVOICE_OVERDUE',
        },
      ],
    },
  },
];

const meta: Meta<typeof OperationalAlertCards> = {
  title: 'Operational / Alert cards',
  component: OperationalAlertCards,
};
export default meta;

type Story = StoryObj<typeof OperationalAlertCards>;

export const Default: Story = {
  args: {
    items: samples,
    onMutate: async () => {},
    compactTrust: false,
  },
};
