'use client';

import React from 'react';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/ui/icons';
import {
  previewImportFile,
  generateTemplate,
  validationRules,
  dateFormats,
  fieldMappings,
  TransformOptions,
  TemplateOptions,
  CategoryMapping,
  saveTemplate,
  loadTemplates,
  deleteTemplate,
  SavedTemplate,
  getTemplateCategories,
  getTemplateTags,
  updateTemplateVisibility,
  getTemplateVersions,
  restoreTemplateVersion,
  TemplateVersion,
  exportTemplate,
  importTemplate,
  type ImportPreview,
} from '@/lib/import';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { currencies } from '@/lib/currency';
import { useSession } from 'next-auth/react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui';
import { ScrollArea } from '@/components/ui';
import { format } from 'date-fns';
import { TemplateVersionDiff } from './template-version-diff/TemplateVersionDiff';
import JSZip from 'jszip';

const importFormSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      file =>
        file.type === 'application/json' ||
        file.type === 'text/csv' ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Only JSON, CSV, and Excel files are supported'
    ),
});

type ImportFormValues = z.infer<typeof importFormSchema>;

const dataTypes = [
  { value: 'expenses', label: 'Expenses' },
  { value: 'income', label: 'Income' },
  { value: 'goals', label: 'Goals' },
  { value: 'challenges', label: 'Challenges' },
] as const;

const fileFormats = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'Excel' },
] as const;

const TEMPLATE_FILTER_ALL = '__all__' as const;

export function DataImportDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [selectedType, setSelectedType] = useState<(typeof dataTypes)[number]['value']>('expenses');
  const [selectedFormat, setSelectedFormat] =
    useState<(typeof fileFormats)[number]['value']>('json');
  const [selectedDateFormat, setSelectedDateFormat] = useState<string>(dateFormats[0].value);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [transformOptions, setTransformOptions] = useState<TransformOptions>({
    dateFormat: dateFormats[0].value,
    numberFormat: {
      decimalSeparator: '.',
      thousandsSeparator: ',',
    },
  });
  const [categoryMapping, setCategoryMapping] = useState<CategoryMapping>({});
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [templateOptions, setTemplateOptions] = useState<TemplateOptions>({
    includeExampleData: true,
  });
  const { toast } = useToast();
  const { data: session } = useSession();
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [shareWith, setShareWith] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SavedTemplate | null>(null);
  const [templateVersions, setTemplateVersions] = useState<TemplateVersion[]>([]);
  const [isRestoringVersion, setIsRestoringVersion] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterFormat, setFilterFormat] = useState<string | undefined>();
  const [filterCategory, setFilterCategory] = useState<string | undefined>();
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'name' | 'type' | 'format' | 'updatedAt'>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkExporting, setIsBulkExporting] = useState(false);
  const [selectedTemplateForSharing, setSelectedTemplateForSharing] =
    useState<SavedTemplate | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const form = useForm<ImportFormValues>({
    resolver: zodResolver(importFormSchema),
  });

  // Load available categories
  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/categories')
        .then(res => res.json())
        .then(data => setAvailableCategories(data.categories))
        .catch(console.error);
    }
  }, [session?.user?.id]);

  // Load saved templates
  useEffect(() => {
    if (session?.user?.id) {
      loadTemplates(session.user.id).then(setSavedTemplates).catch(console.error);
    }
  }, [session?.user?.id]);

  // Load categories and tags
  useEffect(() => {
    if (session?.user?.id) {
      Promise.all([getTemplateCategories(session.user.id), getTemplateTags(session.user.id)])
        .then(([cats, tgs]) => {
          setCategories(cats);
          setTags(tgs);
        })
        .catch(console.error);
    }
  }, [session?.user?.id]);

  // Load template versions
  const loadTemplateVersions = async (templateId: string) => {
    try {
      const versions = await getTemplateVersions(templateId);
      setTemplateVersions(versions);
    } catch (error) {
      console.error('Failed to load template versions:', error);
      toast({
        title: 'Failed to load versions',
        description: error instanceof Error ? error.message : 'Failed to load template versions',
        variant: 'destructive',
      });
    }
  };

  // Handle template selection
  const _handleTemplateSelect = async (template: SavedTemplate) => {
    setSelectedTemplate(template);
    await loadTemplateVersions(template.id);
  };

  // Handle version restore
  const _handleRestoreVersion = async (version: number) => {
    if (!selectedTemplate) return;

    setIsRestoringVersion(true);
    try {
      const restored = await restoreTemplateVersion(
        selectedTemplate.id,
        version,
        session!.user!.id
      );
      setSelectedTemplate(restored);
      await loadTemplateVersions(restored.id);
      toast({
        title: 'Version restored',
        description: `Template restored to version ${version}`,
      });
    } catch (error) {
      console.error('Failed to restore version:', error);
      toast({
        title: 'Restore failed',
        description: error instanceof Error ? error.message : 'Failed to restore version',
        variant: 'destructive',
      });
    } finally {
      setIsRestoringVersion(false);
    }
  };

  const _handleFileChange = async (file: File | null) => {
    if (!file) return;

    try {
      const previewData = await previewImportFile(file, {
        dateFormat: selectedDateFormat,
        fieldMapping,
        dataType: selectedType,
      });
      setPreview(previewData);
    } catch (error) {
      console.error('Failed to preview file:', error);
      toast({
        title: 'Preview failed',
        description: error instanceof Error ? error.message : 'Failed to preview file',
        variant: 'destructive',
      });
      setPreview(null);
    }
  };

  const _handleDateFormatChange = (value: string) => {
    setSelectedDateFormat(value);
    if (preview) {
      _handleFileChange(form.getValues('file'));
    }
  };

  const _handleFieldMappingChange = (targetField: string, sourceField: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [targetField]: sourceField,
    }));
    if (preview) {
      _handleFileChange(form.getValues('file'));
    }
  };

  const _handleCategoryMappingChange = (sourceCategory: string, targetCategory: string) => {
    setCategoryMapping(prev => ({
      ...prev,
      [sourceCategory]: targetCategory,
    }));
    if (preview) {
      _handleFileChange(form.getValues('file'));
    }
  };

  const _handleTemplateOptionsChange = (options: Partial<TemplateOptions>) => {
    setTemplateOptions(prev => ({
      ...prev,
      ...options,
    }));
  };

  const _handleDownloadTemplate = () => {
    try {
      const blob = generateTemplate(selectedType, selectedFormat, templateOptions);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedType}-template.${selectedFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download template:', error);
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Failed to download template',
        variant: 'destructive',
      });
    }
  };

  const _handleTransformOptionsChange = (options: Partial<TransformOptions>) => {
    setTransformOptions(prev => ({
      ...prev,
      ...options,
    }));
    if (preview) {
      _handleFileChange(form.getValues('file'));
    }
  };

  const onSubmit = async (data: ImportFormValues) => {
    setIsLoading(true);
    try {
      const files = data.file instanceof FileList ? Array.from(data.file) : [data.file];
      const formData = new FormData();
      formData.append('files', JSON.stringify(files.map(f => f.name)));
      formData.append('options', JSON.stringify(transformOptions));

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to import data');
      }

      toast({
        title: 'Data imported successfully',
        description: `Imported ${result.total.expenses} expenses, ${result.total.income} income entries, ${result.total.goals} goals, and ${result.total.challenges} challenges from ${result.files.length} files.`,
      });

      setOpen(false);
    } catch (error) {
      console.error('Failed to import data:', error);
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const _handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast({
        title: 'Template name required',
        description: 'Please enter a name for your template',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingTemplate(true);
    try {
      const saved = await saveTemplate(
        session!.user!.id,
        templateName,
        selectedType,
        selectedFormat,
        templateOptions,
        selectedCategory,
        selectedTags,
        isPublic,
        shareWith
      );
      setSavedTemplates(prev => [saved, ...prev]);
      setTemplateName('');
      setSelectedCategory(undefined);
      setSelectedTags([]);
      setIsPublic(false);
      setShareWith([]);
      toast({
        title: 'Template saved',
        description: 'Your template has been saved successfully',
      });
    } catch (error) {
      console.error('Failed to save template:', error);
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Failed to save template',
        variant: 'destructive',
      });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const _handleLoadTemplate = (template: SavedTemplate) => {
    setSelectedType(template.type);
    setSelectedFormat(template.format);
    setTemplateOptions(template.options);
    toast({
      title: 'Template loaded',
      description: `Loaded template: ${template.name}`,
    });
  };

  const _handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteTemplate(templateId);
      setSavedTemplates(prev => prev.filter(t => t.id !== templateId));
      toast({
        title: 'Template deleted',
        description: 'The template has been deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete template',
        variant: 'destructive',
      });
    }
  };

  const _handleUpdateVisibility = async (templateId: string, isPublic: boolean) => {
    try {
      await updateTemplateVisibility(templateId, isPublic);
      toast({
        title: 'Visibility updated',
        description: `Template is now ${isPublic ? 'public' : 'private'}`,
      });
    } catch (error) {
      console.error('Failed to update visibility:', error);
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update visibility',
        variant: 'destructive',
      });
    }
  };

  const _handleExportTemplate = async (template: SavedTemplate) => {
    setIsExporting(true);
    try {
      const versions = await getTemplateVersions(template.id);
      const blob = await exportTemplate(template, versions);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}-template.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: 'Template exported',
        description: 'Your template has been exported successfully',
      });
    } catch (error) {
      console.error('Failed to export template:', error);
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export template',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const _handleImportTemplate = async (file: File) => {
    setIsImporting(true);
    try {
      const { template } = await importTemplate(file);
      setSavedTemplates(prev => [template, ...prev]);
      toast({
        title: 'Template imported',
        description: 'Your template has been imported successfully',
      });
    } catch (error) {
      console.error('Failed to import template:', error);
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import template',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Add filtered templates computation
  const _filteredTemplates = savedTemplates.filter(template => {
    const _matchesSearch = searchQuery
      ? template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    const _matchesType = filterType ? template.type === filterType : true;
    const _matchesFormat = filterFormat ? template.format === filterFormat : true;
    const _matchesCategory = filterCategory ? template.category === filterCategory : true;
    const _matchesTags = filterTags.length
      ? filterTags.every(tag => template.tags.includes(tag))
      : true;

    return _matchesSearch && _matchesType && _matchesFormat && _matchesCategory && _matchesTags;
  });

  // Add sorted and filtered templates computation
  const _sortedAndFilteredTemplates = _filteredTemplates.sort((a, b) => {
    const _direction = sortDirection === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'name':
        return _direction * a.name.localeCompare(b.name);
      case 'type':
        return _direction * a.type.localeCompare(b.type);
      case 'format':
        return _direction * a.format.localeCompare(b.format);
      case 'updatedAt':
        return _direction * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
      default:
        return 0;
    }
  });

  // Add bulk action handlers
  const _handleBulkDelete = async () => {
    if (!selectedTemplates.size) return;

    setIsBulkDeleting(true);
    try {
      await Promise.all(Array.from(selectedTemplates).map(id => deleteTemplate(id)));
      setSavedTemplates(prev => prev.filter(t => !selectedTemplates.has(t.id)));
      setSelectedTemplates(new Set());
      toast({
        title: 'Templates deleted',
        description: `Successfully deleted ${selectedTemplates.size} templates`,
      });
    } catch (error) {
      console.error('Failed to delete templates:', error);
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete templates',
        variant: 'destructive',
      });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const _handleBulkExport = async () => {
    if (!selectedTemplates.size) return;

    setIsBulkExporting(true);
    try {
      const templates = savedTemplates.filter(t => selectedTemplates.has(t.id));
      const zip = new JSZip();

      // Add each template to the zip
      await Promise.all(
        templates.map(async template => {
          const versions = await getTemplateVersions(template.id);
          const blob = await exportTemplate(template, versions);
          const content = await blob.text();
          zip.file(`${template.name.toLowerCase().replace(/\s+/g, '-')}-template.json`, content);
        })
      );

      // Generate and download zip
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'templates.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Templates exported',
        description: `Successfully exported ${selectedTemplates.size} templates`,
      });
    } catch (error) {
      console.error('Failed to export templates:', error);
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export templates',
        variant: 'destructive',
      });
    } finally {
      setIsBulkExporting(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Icons.upload className="mr-2 h-4 w-4" />
          Import Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Data</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select
                value={selectedType}
                onValueChange={value => setSelectedType(value as typeof selectedType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent>
                  {dataTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select
                value={selectedFormat}
                onValueChange={value => setSelectedFormat(value as typeof selectedFormat)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {fileFormats.map(format => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={_handleDownloadTemplate}
              className="whitespace-nowrap"
            >
              <Icons.download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="import-options">
              <AccordionTrigger>Import Options</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Date Format</label>
                    <Select
                      value={transformOptions.dateFormat}
                      onValueChange={value => _handleTransformOptionsChange({ dateFormat: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select date format" />
                      </SelectTrigger>
                      <SelectContent>
                        {dateFormats.map(format => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Currency Conversion</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={transformOptions.currency?.from}
                        onValueChange={value =>
                          _handleTransformOptionsChange({
                            currency: {
                              ...transformOptions.currency,
                              from: value,
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="From currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(currencies).map(([code, currency]) => (
                            <SelectItem key={code} value={code}>
                              {currency.code} - {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={transformOptions.currency?.to}
                        onValueChange={value =>
                          _handleTransformOptionsChange({
                            currency: {
                              ...transformOptions.currency,
                              to: value,
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="To currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(currencies).map(([code, currency]) => (
                            <SelectItem key={code} value={code}>
                              {currency.code} - {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Number Format</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Decimal Separator</label>
                        <Select
                          value={transformOptions.numberFormat?.decimalSeparator}
                          onValueChange={value =>
                            _handleTransformOptionsChange({
                              numberFormat: {
                                ...transformOptions.numberFormat,
                                decimalSeparator: value,
                              },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select separator" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value=".">Period (.)</SelectItem>
                            <SelectItem value=",">Comma (,)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Thousands Separator</label>
                        <Select
                          value={transformOptions.numberFormat?.thousandsSeparator}
                          onValueChange={value =>
                            _handleTransformOptionsChange({
                              numberFormat: {
                                ...transformOptions.numberFormat,
                                thousandsSeparator: value,
                              },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select separator" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value=",">Comma (,)</SelectItem>
                            <SelectItem value=".">Period (.)</SelectItem>
                            <SelectItem value=" ">Space ( )</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {selectedType === 'expenses' && (
                    <div>
                      <label className="text-sm font-medium">Category Mapping</label>
                      <div className="mt-2 space-y-2">
                        {preview?.data
                          .map(row => row.category)
                          .filter((category, index, self) => self.indexOf(category) === index)
                          .map(sourceCategory => (
                            <div key={sourceCategory} className="flex items-center space-x-2">
                              <span className="w-32 text-sm">{sourceCategory}</span>
                              <Select
                                value={categoryMapping[sourceCategory] || sourceCategory}
                                onValueChange={value =>
                                  _handleCategoryMappingChange(sourceCategory, value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Map to category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableCategories.map(category => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {(selectedFormat === 'csv' || selectedFormat === 'xlsx') && (
                    <div>
                      <label className="text-sm font-medium">Field Mapping</label>
                      <div className="mt-2 space-y-2">
                        {Object.entries(fieldMappings[selectedType]).map(
                          ([targetField, possibleValues]) => (
                            <div key={targetField} className="flex items-center space-x-2">
                              <span className="w-32 text-sm">{targetField}</span>
                              <Select
                                value={fieldMapping[targetField] || targetField}
                                onValueChange={value =>
                                  _handleFieldMappingChange(targetField, value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select field" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(possibleValues as string[]).map((value: string) => (
                                    <SelectItem key={value} value={value}>
                                      {value}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="template-options">
              <AccordionTrigger>Template Options</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-example"
                      checked={templateOptions.includeExampleData}
                      onCheckedChange={checked =>
                        _handleTemplateOptionsChange({
                          includeExampleData: checked as boolean,
                        })
                      }
                    />
                    <label
                      htmlFor="include-example"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Include example data
                    </label>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Custom Fields</label>
                    <div className="mt-2 space-y-2">
                      {Object.entries(templateOptions.customFields || {}).map(([field, config]) => (
                        <div key={field} className="flex items-center space-x-2">
                          <Input
                            value={field}
                            onChange={e => {
                              const _newFields = {
                                ...templateOptions.customFields,
                              };
                              delete _newFields[field];
                              _newFields[e.target.value] = config;
                              _handleTemplateOptionsChange({
                                customFields: _newFields,
                              });
                            }}
                            className="w-32"
                          />
                          <Select
                            value={config.type}
                            onValueChange={value =>
                              _handleTemplateOptionsChange({
                                customFields: {
                                  ...templateOptions.customFields,
                                  [field]: {
                                    ...config,
                                    type: value as any,
                                  },
                                },
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="string">Text</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="boolean">Yes/No</SelectItem>
                            </SelectContent>
                          </Select>
                          <Checkbox
                            checked={config.required}
                            onCheckedChange={checked =>
                              _handleTemplateOptionsChange({
                                customFields: {
                                  ...templateOptions.customFields,
                                  [field]: {
                                    ...config,
                                    required: checked as boolean,
                                  },
                                },
                              })
                            }
                          />
                          <label className="text-sm">Required</label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const _newFields = {
                                ...templateOptions.customFields,
                              };
                              delete _newFields[field];
                              _handleTemplateOptionsChange({
                                customFields: _newFields,
                              });
                            }}
                          >
                            <Icons.trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          _handleTemplateOptionsChange({
                            customFields: {
                              ...templateOptions.customFields,
                              [`field${
                                Object.keys(templateOptions.customFields || {}).length + 1
                              }`]: {
                                type: 'string',
                                required: false,
                              },
                            },
                          })
                        }
                      >
                        <Icons.plus className="mr-2 h-4 w-4" />
                        Add Field
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Save Template</label>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder="Template name"
                          value={templateName}
                          onChange={e => setTemplateName(e.target.value)}
                        />
                        <Button
                          variant="outline"
                          onClick={_handleSaveTemplate}
                          disabled={isSavingTemplate}
                        >
                          {isSavingTemplate && (
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Save
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Category</label>
                          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(category => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Tags</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between"
                              >
                                {selectedTags.length
                                  ? `${selectedTags.length} tags selected`
                                  : 'Select tags'}
                                <Icons.chevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Search tags..." />
                                <CommandEmpty>No tags found.</CommandEmpty>
                                <CommandGroup>
                                  <ScrollArea className="h-48">
                                    {tags.map(tag => (
                                      <CommandItem
                                        key={tag}
                                        onSelect={() => {
                                          setSelectedTags(prev =>
                                            prev.includes(tag)
                                              ? prev.filter(t => t !== tag)
                                              : [...prev, tag]
                                          );
                                        }}
                                      >
                                        <Icons.check
                                          className={`mr-2 h-4 w-4 ${
                                            selectedTags.includes(tag) ? 'opacity-100' : 'opacity-0'
                                          }`}
                                        />
                                        {tag}
                                      </CommandItem>
                                    ))}
                                  </ScrollArea>
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
                        <label
                          htmlFor="public"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Make template public
                        </label>
                      </div>
                    </div>
                  </div>

                  {savedTemplates.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Saved Templates</label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="file"
                            accept=".json"
                            className="hidden"
                            id="template-import"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                _handleImportTemplate(file);
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('template-import')?.click()}
                            disabled={isImporting}
                          >
                            {isImporting && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                            <Icons.upload className="mr-2 h-4 w-4" />
                            Import
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <Input
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full md:w-64"
                          />
                          <div className="flex items-center space-x-2">
                            <Select value={filterType ?? TEMPLATE_FILTER_ALL} onValueChange={v => setFilterType(v === TEMPLATE_FILTER_ALL ? undefined : v)}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={TEMPLATE_FILTER_ALL}>All Types</SelectItem>
                                {dataTypes.map(type => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCategoryDialogOpen(true)}
                            >
                              <Icons.folderPlus className="mr-2 h-4 w-4" />
                              Categories
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setTagDialogOpen(true)}
                            >
                              <Icons.tag className="mr-2 h-4 w-4" />
                              Tags
                            </Button>
                          </div>
                          <Select value={filterFormat ?? TEMPLATE_FILTER_ALL} onValueChange={v => setFilterFormat(v === TEMPLATE_FILTER_ALL ? undefined : v)}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Filter by format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={TEMPLATE_FILTER_ALL}>All Formats</SelectItem>
                              {fileFormats.map(format => (
                                <SelectItem key={format.value} value={format.value}>
                                  {format.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={filterCategory ?? TEMPLATE_FILTER_ALL} onValueChange={v => setFilterCategory(v === TEMPLATE_FILTER_ALL ? undefined : v)}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Filter by category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={TEMPLATE_FILTER_ALL}>All Categories</SelectItem>
                              {categories.map(category => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-[180px] justify-between"
                              >
                                {filterTags.length
                                  ? `${filterTags.length} tags selected`
                                  : 'Filter by tags'}
                                <Icons.chevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[180px] p-0">
                              <Command>
                                <CommandInput placeholder="Search tags..." />
                                <CommandEmpty>No tags found.</CommandEmpty>
                                <CommandGroup>
                                  <ScrollArea className="h-48">
                                    {tags.map(tag => (
                                      <CommandItem
                                        key={tag}
                                        onSelect={() => {
                                          setFilterTags(prev =>
                                            prev.includes(tag)
                                              ? prev.filter(t => t !== tag)
                                              : [...prev, tag]
                                          );
                                        }}
                                      >
                                        <Icons.check
                                          className={`mr-2 h-4 w-4 ${
                                            filterTags.includes(tag) ? 'opacity-100' : 'opacity-0'
                                          }`}
                                        />
                                        {tag}
                                      </CommandItem>
                                    ))}
                                  </ScrollArea>
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          {(searchQuery ||
                            filterType ||
                            filterFormat ||
                            filterCategory ||
                            filterTags.length > 0) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSearchQuery('');
                                setFilterType(undefined);
                                setFilterFormat(undefined);
                                setFilterCategory(undefined);
                                setFilterTags([]);
                              }}
                            >
                              <Icons.x className="mr-2 h-4 w-4" />
                              Clear Filters
                            </Button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Saved Templates</label>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="file"
                                accept=".json"
                                className="hidden"
                                id="template-import"
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    _handleImportTemplate(file);
                                  }
                                }}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById('template-import')?.click()}
                                disabled={isImporting}
                              >
                                {isImporting && (
                                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                <Icons.upload className="mr-2 h-4 w-4" />
                                Import
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                              <Input
                                placeholder="Search templates..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full md:w-64"
                              />
                              <div className="flex items-center space-x-2">
                                <Select value={filterType ?? TEMPLATE_FILTER_ALL} onValueChange={v => setFilterType(v === TEMPLATE_FILTER_ALL ? undefined : v)}>
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={TEMPLATE_FILTER_ALL}>All Types</SelectItem>
                                    {dataTypes.map(type => (
                                      <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCategoryDialogOpen(true)}
                                >
                                  <Icons.folderPlus className="mr-2 h-4 w-4" />
                                  Categories
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setTagDialogOpen(true)}
                                >
                                  <Icons.tag className="mr-2 h-4 w-4" />
                                  Tags
                                </Button>
                              </div>
                              <Select value={filterFormat ?? TEMPLATE_FILTER_ALL} onValueChange={v => setFilterFormat(v === TEMPLATE_FILTER_ALL ? undefined : v)}>
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Filter by format" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={TEMPLATE_FILTER_ALL}>All Formats</SelectItem>
                                  {fileFormats.map(format => (
                                    <SelectItem key={format.value} value={format.value}>
                                      {format.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select value={filterCategory ?? TEMPLATE_FILTER_ALL} onValueChange={v => setFilterCategory(v === TEMPLATE_FILTER_ALL ? undefined : v)}>
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Filter by category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={TEMPLATE_FILTER_ALL}>All Categories</SelectItem>
                                  {categories.map(category => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-[180px] justify-between"
                                  >
                                    {filterTags.length
                                      ? `${filterTags.length} tags selected`
                                      : 'Filter by tags'}
                                    <Icons.chevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[180px] p-0">
                                  <Command>
                                    <CommandInput placeholder="Search tags..." />
                                    <CommandEmpty>No tags found.</CommandEmpty>
                                    <CommandGroup>
                                      <ScrollArea className="h-48">
                                        {tags.map(tag => (
                                          <CommandItem
                                            key={tag}
                                            onSelect={() => {
                                              setFilterTags(prev =>
                                                prev.includes(tag)
                                                  ? prev.filter(t => t !== tag)
                                                  : [...prev, tag]
                                              );
                                            }}
                                          >
                                            <Icons.check
                                              className={`mr-2 h-4 w-4 ${
                                                filterTags.includes(tag)
                                                  ? 'opacity-100'
                                                  : 'opacity-0'
                                              }`}
                                            />
                                            {tag}
                                          </CommandItem>
                                        ))}
                                      </ScrollArea>
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              {(searchQuery ||
                                filterType ||
                                filterFormat ||
                                filterCategory ||
                                filterTags.length > 0) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSearchQuery('');
                                    setFilterType(undefined);
                                    setFilterFormat(undefined);
                                    setFilterCategory(undefined);
                                    setFilterTags([]);
                                  }}
                                >
                                  <Icons.x className="mr-2 h-4 w-4" />
                                  Clear Filters
                                </Button>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Select
                                  value={sortField}
                                  onValueChange={value => setSortField(value as typeof sortField)}
                                >
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Sort by" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="name">Name</SelectItem>
                                    <SelectItem value="type">Type</SelectItem>
                                    <SelectItem value="format">Format</SelectItem>
                                    <SelectItem value="updatedAt">Last Updated</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
                                  }
                                >
                                  {sortDirection === 'asc' ? (
                                    <Icons.arrowUp className="h-4 w-4" />
                                  ) : (
                                    <Icons.arrowDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>

                              {selectedTemplates.size > 0 && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-muted-foreground">
                                    {selectedTemplates.size} selected
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={_handleBulkExport}
                                    disabled={isBulkExporting}
                                  >
                                    {isBulkExporting && (
                                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    <Icons.download className="mr-2 h-4 w-4" />
                                    Export Selected
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={_handleBulkDelete}
                                    disabled={isBulkDeleting}
                                  >
                                    {isBulkDeleting && (
                                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    <Icons.trash className="mr-2 h-4 w-4" />
                                    Delete Selected
                                  </Button>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              {_sortedAndFilteredTemplates.length === 0 ? (
                                <div className="py-4 text-center text-sm text-muted-foreground">
                                  No templates found matching your filters
                                </div>
                              ) : (
                                _sortedAndFilteredTemplates.map(template => (
                                  <div
                                    key={template.id}
                                    className="space-y-2 rounded-md border p-2"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={selectedTemplates.has(template.id)}
                                          onCheckedChange={checked => {
                                            setSelectedTemplates(prev => {
                                              const next = new Set(prev);
                                              if (checked) {
                                                next.add(template.id);
                                              } else {
                                                next.delete(template.id);
                                              }
                                              return next;
                                            });
                                          }}
                                        />
                                        <div className="space-y-1">
                                          <p className="text-sm font-medium">{template.name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {template.type} • {template.format}
                                            {template.category && ` • ${template.category}`}
                                          </p>
                                          {template.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                              {template.tags.map(tag => (
                                                <Badge key={tag} variant="secondary">
                                                  {tag}
                                                </Badge>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => _handleLoadTemplate(template)}
                                        >
                                          <Icons.load className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => _handleExportTemplate(template)}
                                          disabled={isExporting}
                                        >
                                          {isExporting && (
                                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                          )}
                                          <Icons.download className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => _handleDeleteTemplate(template.id)}
                                        >
                                          <Icons.trash className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between border-t pt-2">
                                      <div className="flex items-center space-x-2">
                                        <Switch
                                          id={`public-${template.id}`}
                                          checked={template.isPublic}
                                          onCheckedChange={checked =>
                                            _handleUpdateVisibility(template.id, checked)
                                          }
                                        />
                                        <label
                                          htmlFor={`public-${template.id}`}
                                          className="text-xs text-muted-foreground"
                                        >
                                          Public
                                        </label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        {template.sharedWith.length > 0 && (
                                          <Badge variant="secondary" className="text-xs">
                                            {template.sharedWith.length} shared
                                          </Badge>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedTemplateForSharing(template);
                                            setShareDialogOpen(true);
                                          }}
                                        >
                                          <Icons.share className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>

                                    {selectedTemplate?.id === template.id && (
                                      <div className="mt-2 space-y-2 border-t pt-2">
                                        <TemplateVersionDiff
                                          template={template}
                                          versions={templateVersions}
                                          onRestore={_handleRestoreVersion}
                                          isRestoring={isRestoringVersion}
                                        />
                                      </div>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="validation-rules">
              <AccordionTrigger>Validation Rules</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {Object.entries(validationRules[selectedType]).map(([field, rule]) => (
                    <div key={field} className="flex items-start space-x-2">
                      <Badge variant="outline" className="mt-1">
                        {field}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{rule}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Alert>
            <Icons.info className="h-4 w-4" />
            <AlertTitle>Date Format</AlertTitle>
            <AlertDescription>
              Selected date format: {dateFormats.find(f => f.value === selectedDateFormat)?.label}
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="file"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Files</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".json,.csv,.xlsx"
                        multiple
                        onChange={e => {
                          const files = e.target.files;
                          if (files) {
                            onChange(files);
                            _handleFileChange(files[0]);
                          }
                        }}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="text-sm text-muted-foreground">
                <p>Supported file formats:</p>
                <ul className="list-disc pl-4">
                  <li>JSON (.json)</li>
                  <li>CSV (.csv)</li>
                  <li>Excel (.xlsx)</li>
                </ul>
                <p className="mt-2">Supported data types:</p>
                <ul className="list-disc pl-4">
                  <li>Expenses</li>
                  <li>Income</li>
                  <li>Goals</li>
                  <li>Challenges</li>
                </ul>
              </div>
              {preview && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Preview</h3>
                    <Badge variant="outline">{preview.type}</Badge>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {preview.headers.map(header => (
                            <TableHead key={header}>{header}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.data.map((row, index) => (
                          <TableRow key={index}>
                            {preview.headers.map(header => (
                              <TableCell key={header}>{row[header]?.toString() || ''}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {preview.errors && (
                    <div className="text-sm text-destructive">
                      {preview.errors.map((error, index) => (
                        <p key={index}>{error}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !preview}>
                  {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                  Import
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
    <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Categories</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Template category management is available from this dialog in a future update.</p>
      </DialogContent>
    </Dialog>
    <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tags</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Template tag management is available from this dialog in a future update.</p>
      </DialogContent>
    </Dialog>
    <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share template</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Sharing controls will be wired here in a future update.</p>
      </DialogContent>
    </Dialog>
    </>
  );
}

export default DataImportDialog;
