import * as React from 'react';
import { cn } from '@/lib/utils';

const _Table = React.forwardRef<HTMLTableElement, React.ComponentPropsWithoutRef<'table'>>(
  (props, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm', props.className)}
        {...props}
      />
    </div>
  )
);
_Table.displayName = 'Table';

const _TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentPropsWithoutRef<'thead'>
>((props, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', props.className)} {...props} />
));
_TableHeader.displayName = 'TableHeader';

const _TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentPropsWithoutRef<'tbody'>
>((props, ref) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', props.className)} {...props} />
));
_TableBody.displayName = 'TableBody';

const _TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentPropsWithoutRef<'tfoot'>
>((props, ref) => (
  <tfoot
    ref={ref}
    className={cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', props.className)}
    {...props}
  />
));
_TableFooter.displayName = 'TableFooter';

const _TableRow = React.forwardRef<HTMLTableRowElement, React.ComponentPropsWithoutRef<'tr'>>(
  (props, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        props.className
      )}
      {...props}
    />
  )
);
_TableRow.displayName = 'TableRow';

const _TableHead = React.forwardRef<HTMLTableCellElement, React.ComponentPropsWithoutRef<'th'>>(
  (props, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
        props.className
      )}
      {...props}
    />
  )
);
_TableHead.displayName = 'TableHead';

const _TableCell = React.forwardRef<HTMLTableCellElement, React.ComponentPropsWithoutRef<'td'>>(
  (props, ref) => (
    <td
      ref={ref}
      className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', props.className)}
      {...props}
    />
  )
);
_TableCell.displayName = 'TableCell';

const _TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.ComponentPropsWithoutRef<'caption'>
>((props, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-muted-foreground', props.className)}
    {...props}
  />
));
_TableCaption.displayName = 'TableCaption';

const Table = _Table;
const TableHeader = _TableHeader;
const TableBody = _TableBody;
const TableFooter = _TableFooter;
const TableHead = _TableHead;
const TableRow = _TableRow;
const TableCell = _TableCell;
const TableCaption = _TableCaption;

Table.displayName = 'Table';
TableHeader.displayName = 'TableHeader';
TableBody.displayName = 'TableBody';
TableFooter.displayName = 'TableFooter';
TableHead.displayName = 'TableHead';
TableRow.displayName = 'TableRow';
TableCell.displayName = 'TableCell';
TableCaption.displayName = 'TableCaption';

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
