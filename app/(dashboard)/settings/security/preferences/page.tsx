'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

type SecurityPreferences = {
  allowVpn: boolean;
  allowProxy: boolean;
  allowTor: boolean;
  allowHosting: boolean;
  allowDatacenter: boolean;
  maxThreatLevel: 'low' | 'medium' | 'high';
  allowedCountries: string[];
  allowedRegions: string[];
};

export default function SecurityPreferencesPage() {
  const [preferences, setPreferences] = useState<SecurityPreferences>({
    allowVpn: false,
    allowProxy: false,
    allowTor: false,
    allowHosting: false,
    allowDatacenter: false,
    maxThreatLevel: 'medium',
    allowedCountries: [],
    allowedRegions: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_security')
        .select('security_preferences, allowed_countries, allowed_regions')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setPreferences({
        ...preferences,
        ...data.security_preferences,
        allowedCountries: data.allowed_countries || [],
        allowedRegions: data.allowed_regions || [],
      });
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Failed to load security preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<SecurityPreferences>) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const newPreferences = { ...preferences, ...updates };
      setPreferences(newPreferences);

      const { error } = await supabase.from('user_security').upsert({
        user_id: user.id,
        security_preferences: {
          allowVpn: newPreferences.allowVpn,
          allowProxy: newPreferences.allowProxy,
          allowTor: newPreferences.allowTor,
          allowHosting: newPreferences.allowHosting,
          allowDatacenter: newPreferences.allowDatacenter,
          maxThreatLevel: newPreferences.maxThreatLevel,
        },
        allowed_countries: newPreferences.allowedCountries,
        allowed_regions: newPreferences.allowedRegions,
      });

      if (error) throw error;
      toast.success('Security preferences updated');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update security preferences');
      loadPreferences(); // Reload on error
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Security Preferences</h3>
        <p className="text-sm text-muted-foreground">Configure your account security settings</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Control</CardTitle>
            <CardDescription>Control how and where your account can be accessed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow VPN Access</Label>
                <p className="text-sm text-muted-foreground">Allow access from VPN connections</p>
              </div>
              <Switch
                checked={preferences.allowVpn}
                onCheckedChange={checked => updatePreferences({ allowVpn: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Proxy Access</Label>
                <p className="text-sm text-muted-foreground">Allow access from proxy servers</p>
              </div>
              <Switch
                checked={preferences.allowProxy}
                onCheckedChange={checked => updatePreferences({ allowProxy: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Tor Access</Label>
                <p className="text-sm text-muted-foreground">Allow access from Tor network</p>
              </div>
              <Switch
                checked={preferences.allowTor}
                onCheckedChange={checked => updatePreferences({ allowTor: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Hosting Access</Label>
                <p className="text-sm text-muted-foreground">Allow access from hosting providers</p>
              </div>
              <Switch
                checked={preferences.allowHosting}
                onCheckedChange={checked => updatePreferences({ allowHosting: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Datacenter Access</Label>
                <p className="text-sm text-muted-foreground">Allow access from datacenters</p>
              </div>
              <Switch
                checked={preferences.allowDatacenter}
                onCheckedChange={checked => updatePreferences({ allowDatacenter: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Threat Protection</CardTitle>
            <CardDescription>Configure threat detection and protection settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Maximum Threat Level</Label>
                <Select
                  value={preferences.maxThreatLevel}
                  onValueChange={(value: 'low' | 'medium' | 'high') =>
                    updatePreferences({ maxThreatLevel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (Most Permissive)</SelectItem>
                    <SelectItem value="medium">Medium (Balanced)</SelectItem>
                    <SelectItem value="high">High (Most Restrictive)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Block access from IPs with threat levels above this threshold
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
