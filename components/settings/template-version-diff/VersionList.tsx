'use client';

import React from 'react';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Icons } from '@/components/ui/icons';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Version {
  id: number;
  version: number;
  title: string;
  description: string;
  createdAt: string;
  createdBy: string;
  tags: string[];
  notes: string[];
  isActive: boolean;
  isArchived: boolean;
  branch: string;
}

interface VersionListProps {
  versions: Version[];
  selectedVersions: number[] | null;
  onVersionSelect: (version: number) => void;
  onVersionRestore: (version: number) => void;
  isRestoring: boolean;
  onAddTag: (version: number, tag: string) => void;
  onRemoveTag: (version: number, tag: string) => void;
  onAddNote: (version: number, note: string) => void;
}

export function VersionList({
  versions,
  selectedVersions,
  onVersionSelect,
  onVersionRestore,
  isRestoring,
  onAddTag,
  onRemoveTag,
  onAddNote,
}: VersionListProps) {
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);
  const [newTag, setNewTag] = useState('');
  const [newNote, setNewNote] = useState('');

  const _handleAddTag = (version: number) => {
    if (newTag.trim()) {
      onAddTag(version, newTag.trim());
      setNewTag('');
    }
  };

  const _handleAddNote = (version: number) => {
    if (newNote.trim()) {
      onAddNote(version, newNote.trim());
      setNewNote('');
    }
  };

  return (
    <div className="space-y-4">
      {versions.map(version => (
        <div
          key={version.id}
          className={cn(
            'rounded-lg border p-4 transition-all',
            selectedVersions?.includes(version.version)
              ? 'border-primary bg-primary/5'
              : 'hover:border-muted-foreground/50'
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold">Version {version.version}</h3>
                {version.isActive && (
                  <Badge variant="default" className="text-xs">
                    Active
                  </Badge>
                )}
                {version.isArchived && (
                  <Badge variant="secondary" className="text-xs">
                    Archived
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {version.branch}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{version.title}</p>
              <p className="mt-2 text-sm">{version.description}</p>
              <div className="mt-2 flex items-center space-x-4 text-xs text-muted-foreground">
                <span>Created by {version.createdBy}</span>
                <span>{format(new Date(version.createdAt), 'MMM d, yyyy HH:mm')}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onVersionSelect(version.version)}
                disabled={selectedVersions?.includes(version.version)}
              >
                <Icons.plus className="h-4 w-4" />
                Select
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setExpandedVersion(expandedVersion === version.version ? null : version.version)
                }
              >
                <Icons.chevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    expandedVersion === version.version && 'rotate-180'
                  )}
                />
              </Button>
            </div>
          </div>

          {expandedVersion === version.version && (
            <div className="mt-4 space-y-4 border-t pt-4">
              {/* Tags */}
              <div>
                <h4 className="mb-2 text-sm font-medium">Tags</h4>
                <div className="mb-2 flex flex-wrap gap-2">
                  {version.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer text-xs hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => onRemoveTag(version.version, tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    className="flex-1 rounded border px-2 py-1 text-sm"
                    onKeyPress={e => e.key === 'Enter' && _handleAddTag(version.version)}
                  />
                  <Button size="sm" onClick={() => _handleAddTag(version.version)}>
                    Add
                  </Button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h4 className="mb-2 text-sm font-medium">Notes</h4>
                <div className="mb-2 space-y-2">
                  {version.notes.map((note, index) => (
                    <div key={index} className="rounded bg-muted p-2 text-sm">
                      {note}
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Add note..."
                    className="flex-1 resize-none rounded border px-2 py-1 text-sm"
                    rows={2}
                  />
                  <Button size="sm" onClick={() => _handleAddNote(version.version)}>
                    Add
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onVersionRestore(version.version)}
                  disabled={isRestoring}
                >
                  {isRestoring ? (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Icons.refresh className="mr-2 h-4 w-4" />
                  )}
                  Restore Version
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
