'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, FileUp, Loader2 } from 'lucide-react';
import Image from 'next/image';

export type MentorDocumentKind = 'headshot' | 'license' | 'id';

const LABELS: Record<MentorDocumentKind, { title: string; hint: string; accept: string }> = {
  headshot: {
    title: 'Professional headshot',
    hint: 'Clear photo of your face (PNG, JPG, WEBP — max 5MB)',
    accept: 'image/png,image/jpeg,image/webp',
  },
  license: {
    title: 'Financial license or credential',
    hint: 'CFP, Series 65, CPA, or equivalent (image or PDF)',
    accept: 'image/png,image/jpeg,image/webp,application/pdf',
  },
  id: {
    title: 'Government-issued ID',
    hint: 'Used only for identity verification (image or PDF)',
    accept: 'image/png,image/jpeg,image/webp,application/pdf',
  },
};

interface MentorDocumentUploadProps {
  kind: MentorDocumentKind;
  currentUrl?: string | null;
  onUploaded?: (url: string) => void;
  /** During application, files upload before a Mentor row exists. */
  mode?: 'application' | 'mentor';
}

export function MentorDocumentUpload({
  kind,
  currentUrl,
  onUploaded,
  mode = 'mentor',
}: MentorDocumentUploadProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl ?? '');

  const meta = LABELS[kind];

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', kind);

      const endpoint =
        mode === 'application' ? '/api/mentors/application-documents' : '/api/mentors/documents';
      const res = await fetch(endpoint, { method: 'POST', body: formData });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok) {
        throw new Error(data?.error ?? 'Upload failed');
      }
      if (data?.url) {
        setPreview(data.url);
        onUploaded?.(data.url);
        toast({ title: 'Document uploaded', description: meta.title });
      }
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Try again',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Label className="text-base font-medium">{meta.title}</Label>
          <p className="text-sm text-muted-foreground">{meta.hint}</p>
        </div>
        {preview ? <CheckCircle className="h-5 w-5 shrink-0 text-primary" /> : null}
      </div>

      {preview && !preview.endsWith('.pdf') ? (
        <div className="relative h-24 w-24 overflow-hidden rounded-md border">
          <Image src={preview} alt={meta.title} fill className="object-cover" unoptimized />
        </div>
      ) : preview ? (
        <p className="text-sm text-muted-foreground">Document on file (PDF)</p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={meta.accept}
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileUp className="mr-2 h-4 w-4" />
        )}
        {preview ? 'Replace file' : 'Upload file'}
      </Button>
    </div>
  );
}
