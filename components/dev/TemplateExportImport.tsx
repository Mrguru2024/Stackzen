import React from 'react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  description: string;
  metric: string;
  type: string;
  severity: 'warning' | 'error';
  steps: string[];
  notes: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
  category: string;
  tags: string[];
}

interface TemplateExportImportProps {
  templates: Template[];
  onImport: (templates: Template[]) => void;
}

export function TemplateExportImport({
  templates: _templates,
  onImport,
}: TemplateExportImportProps) {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const _handleExport = () => {
    try {
      const _exportData = _templates.map(template => ({
        ...template,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      }));

      const _jsonString = JSON.stringify(_exportData, null, 2);
      const _blob = new Blob([_jsonString], { type: 'application/json' });
      const _url = URL.createObjectURL(_blob);
      const a = document.createElement('a');
      a.href = _url;
      a.download = `templates-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(_url);

      toast.success('Templates exported successfully');
    } catch (error) {
      toast.error('Failed to export templates');
      console.error('Export error:', error);
    }
  };

  const _handleImport = () => {
    try {
      setImportError(null);
      const _importedData = JSON.parse(importData);

      // Validate imported data
      if (!Array.isArray(_importedData)) {
        throw new Error('Imported data must be an array');
      }

      const _validatedTemplates = _importedData.map(template => {
        // Validate required fields
        const _requiredFields = [
          'name',
          'description',
          'metric',
          'type',
          'severity',
          'steps',
          'category',
        ];
        for (const field of _requiredFields) {
          if (!template[field]) {
            throw new Error(`Missing required field: ${field}`);
          }
        }

        // Convert date strings back to Date objects
        return {
          ...template,
          createdAt: new Date(template.createdAt),
          updatedAt: new Date(template.updatedAt),
        };
      });

      onImport(_validatedTemplates);
      setShowImportDialog(false);
      setImportData('');
      toast.success('Templates imported successfully');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Invalid import data');
      toast.error('Failed to import templates');
    }
  };

  const _handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const _reader = new FileReader();
    _reader.onload = e => {
      try {
        const _content = e.target?.result as string;
        setImportData(_content);
      } catch (error) {
        setImportError('Failed to read file');
        toast.error('Failed to read file');
      }
    };
    _reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Template Export/Import</h3>
            <p className="text-sm text-muted-foreground">
              Export templates to share or import from other environments
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={_handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export All
            </Button>
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Templates</DialogTitle>
                  <DialogDescription>
                    Import templates from a JSON file or paste JSON data
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Upload JSON File</Label>
                    <Input
                      type="file"
                      accept=".json"
                      onChange={_handleFileUpload}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Or Paste JSON Data</Label>
                    <Textarea
                      value={importData}
                      onChange={e => setImportData(e.target.value)}
                      placeholder="Paste template JSON data here..."
                      className="font-mono h-[200px] text-sm"
                    />
                  </div>
                  {importError && <p className="text-sm text-red-500">{importError}</p>}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={_handleImport}>Import</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default TemplateExportImport;
