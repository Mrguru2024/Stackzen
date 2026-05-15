import React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui';
import { useToast } from '@/components/ui/use-toast';

interface ApiResponse {
  status: number;
  headers: Record<string, string>;
  data: any;
  time: number;
}

export function ApiTester() {
  const { toast } = useToast();
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [body, setBody] = useState('');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddHeader = () => {
    setHeaders({ ...headers, '': '' });
  };

  const handleHeaderChange = (key: string, value: string) => {
    const newHeaders = { ...headers };
    if (value === '') {
      delete newHeaders[key];
    } else {
      newHeaders[key] = value;
    }
    setHeaders(newHeaders);
  };

  const handleTest = async () => {
    if (!url) {
      toast({
        title: 'Error',
        description: 'Please enter a URL',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      if (method !== 'GET' && body) {
        options.body = body;
      }

      const response = await fetch(url, options);
      const data = await response.json();
      const endTime = Date.now();

      setResponse({
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data,
        time: endTime - startTime,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Tester</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Enter API URL"
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleTest} disabled={isLoading}>
              {isLoading ? 'Testing...' : 'Test'}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Headers</h3>
              <Button variant="outline" size="sm" onClick={handleAddHeader}>
                Add Header
              </Button>
            </div>
            {Object.entries(headers).map(([key, value], index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Header name"
                  value={key}
                  onChange={e => handleHeaderChange(key, e.target.value)}
                />
                <Input
                  placeholder="Header value"
                  value={value}
                  onChange={e => handleHeaderChange(key, e.target.value)}
                />
              </div>
            ))}
          </div>

          {method !== 'GET' && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Request Body</h3>
              <Textarea
                placeholder="Enter request body (JSON)"
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={5}
              />
            </div>
          )}

          {response && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Response</h3>
              <div className="rounded-md bg-muted p-2">
                <div className="mb-2">
                  <span className="font-medium">Status: </span>
                  <span className={response.status >= 400 ? 'text-red-500' : 'text-green-500'}>
                    {response.status}
                  </span>
                  <span className="ml-2 text-muted-foreground">(Time: {response.time}ms)</span>
                </div>
                <div className="mb-2">
                  <span className="font-medium">Headers:</span>
                  <ScrollArea className="h-20">
                    <pre className="text-sm">{JSON.stringify(response.headers, null, 2)}</pre>
                  </ScrollArea>
                </div>
                <div>
                  <span className="font-medium">Body:</span>
                  <ScrollArea className="h-40">
                    <pre className="text-sm">{JSON.stringify(response.data, null, 2)}</pre>
                  </ScrollArea>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
