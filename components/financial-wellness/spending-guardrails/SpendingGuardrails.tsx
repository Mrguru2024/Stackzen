'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui';
import Progress from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SpendingGuardrail } from '@/lib/types/financial-wellness';
import { formatCurrency } from '@/lib/utils/format';
import { Plus, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface SpendingGuardrailsProps {
  guardrails: SpendingGuardrail[];
  onAddGuardrail: (guardrail: Omit<SpendingGuardrail, 'id'>) => void;
  onUpdateGuardrail: (guardrail: SpendingGuardrail) => void;
  onDeleteGuardrail: (guardrailId: string) => void;
  onToggleGuardrail: (guardrailId: string) => void;
  className?: string;
}

const CATEGORY_COLORS = {
  food: '#4AE66C',
  entertainment: '#5E2DEB',
  shopping: '#FF4B4B',
  transportation: '#F79C42',
  utilities: '#00B4D8',
  other: '#9D4EDD',
};

export default function SpendingGuardrails({
  guardrails,
  onAddGuardrail,
  onUpdateGuardrail,
  onDeleteGuardrail,
  onToggleGuardrail,
  className = '',
}: SpendingGuardrailsProps) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const getProgressColor = (current: number, limit: number) => {
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return '#FF4B4B';
    if (percentage >= 75) return '#F79C42';
    return '#4AE66C';
  };

  const renderDashboardView = () => (
    <div className="space-y-6">
      {guardrails.length === 0 ? (
        <Card className="p-6 text-center">
          <h3 className="mb-2 text-lg font-medium">No Spending Limits Set</h3>
          <p className="mb-4 text-muted-foreground">
            Set up spending limits to track your expenses and stay on budget.
          </p>
          <Button
            onClick={() =>
              onAddGuardrail({
                userId: 'user1', // This would come from auth context
                category: 'food',
                limit: 500,
                current: 0,
                period: 'monthly',
                notifications: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add First Limit
          </Button>
        </Card>
      ) : (
        guardrails.map(guardrail => (
          <Card key={guardrail.id} className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-medium capitalize">{guardrail.category}</h3>
                <p className="text-sm text-muted-foreground">
                  {guardrail.period} limit: {formatCurrency(guardrail.limit)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {guardrail.current >= guardrail.limit ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : guardrail.current >= guardrail.limit * 0.9 ? (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
              </div>
            </div>
            <Progress
              value={(guardrail.current / guardrail.limit) * 100}
              className="mb-2 h-2"
              style={
                {
                  backgroundColor: `${CATEGORY_COLORS[guardrail.category as keyof typeof CATEGORY_COLORS]}20`,
                  '--progress-foreground': getProgressColor(guardrail.current, guardrail.limit),
                } as any
              }
            />
            <div className="flex justify-between text-sm">
              <span>Spent: {formatCurrency(guardrail.current)}</span>
              <span>Remaining: {formatCurrency(guardrail.limit - guardrail.current)}</span>
            </div>
          </Card>
        ))
      )}
    </div>
  );

  const renderManageView = () => (
    <div className="space-y-4">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-medium">Manage Spending Limits</h3>
        <Button
          onClick={() =>
            onAddGuardrail({
              userId: 'user1', // This would come from auth context
              category: 'food',
              limit: 500,
              current: 0,
              period: 'monthly',
              notifications: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Limit
        </Button>
      </div>
      {guardrails.map(guardrail => (
        <Card key={guardrail.id} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium capitalize">{guardrail.category}</h4>
              <p className="text-sm text-muted-foreground">
                {guardrail.period} limit: {formatCurrency(guardrail.limit)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onUpdateGuardrail(guardrail)}>
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => onToggleGuardrail(guardrail.id)}>
                {guardrail.notifications ? 'Disable' : 'Enable'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDeleteGuardrail(guardrail.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderHistoryView = () => (
    <div className="space-y-4">
      <h3 className="mb-4 text-lg font-medium">Spending History</h3>
      {guardrails.map(guardrail => (
        <Card key={guardrail.id} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium capitalize">{guardrail.category}</h4>
              <p className="text-sm text-muted-foreground">
                {guardrail.period} limit: {formatCurrency(guardrail.limit)}
              </p>
            </div>
            <div className="text-right">
              <div className="font-medium">{formatCurrency(guardrail.current)}</div>
              <div className="text-sm text-muted-foreground">
                {new Date(guardrail.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="mb-2 text-2xl font-bold">Spending Guardrails</h2>
          <p className="text-muted-foreground">
            Set category spending limits to stay on track with your financial goals.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="manage">Manage Limits</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">{renderDashboardView()}</TabsContent>

          <TabsContent value="manage">{renderManageView()}</TabsContent>

          <TabsContent value="history">{renderHistoryView()}</TabsContent>
        </Tabs>
      </Card>
    </motion.div>
  );
}
