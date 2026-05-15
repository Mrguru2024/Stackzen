import React from 'react';

const ExportDialog: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({
  isOpen,
  onClose,
}) => <div>Export Dialog Component (stub)</div>;

ExportDialog.displayName = 'ExportDialog';

export { ExportDialog };
