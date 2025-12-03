import * as React from 'react';

import { cn } from '@/lib/utils';

// Simple utility to combine class names (you may already have this in your utils)
// If not, replace with your own implementation or Tailwind classes directly.

/**
 * Table component – a thin wrapper around the native HTML table element.
 * It applies a default set of Tailwind classes that match the shadcn/ui style.
 */
export const Table = React.forwardRef<
    HTMLTableElement,
    React.TableHTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
    <div className="rounded-md border">
        <table
            ref={ref}
            className={cn('w-full caption-bottom text-sm', className)}
            {...props}
        />
    </div>
));
Table.displayName = 'Table';

/**
 * TableHeader – wraps the `<thead>` element.
 */
export const TableHeader = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <thead
        ref={ref}
        className={cn('[&_tr]:border-b', className)}
        {...props}
    />
));
TableHeader.displayName = 'TableHeader';

/**
 * TableBody – wraps the `<tbody>` element.
 */
export const TableBody = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <tbody
        ref={ref}
        className={cn('bg-muted', className)}
        {...props}
    />
));
TableBody.displayName = 'TableBody';

/**
 * TableFooter – optional wrapper for `<tfoot>`.
 */
export const TableFooter = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <tfoot
        ref={ref}
        className={cn('font-medium', className)}
        {...props}
    />
));
TableFooter.displayName = 'TableFooter';

/**
 * TableRow – wraps the `<tr>` element.
 */
export const TableRow = React.forwardRef<
    HTMLTableRowElement,
    React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
    <tr
        ref={ref}
        className={cn('border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', className)}
        {...props}
    />
));
TableRow.displayName = 'TableRow';

/**
 * TableHead – wraps the `<th>` element.
 */
export const TableHead = React.forwardRef<
    HTMLTableCellElement,
    React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
    <th
        ref={ref}
        className={cn(
            'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
            className
        )}
        {...props}
    />
));
TableHead.displayName = 'TableHead';

/**
 * TableCell – wraps the `<td>` element.
 */
export const TableCell = React.forwardRef<
    HTMLTableCellElement,
    React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
    <td
        ref={ref}
        className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
        {...props}
    />
));
TableCell.displayName = 'TableCell';

/**
 * TableCaption – optional caption for the table.
 */
export const TableCaption = React.forwardRef<
    HTMLTableCaptionElement,
    React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
    <caption
        ref={ref}
        className={cn('mt-4 text-sm text-muted-foreground', className)}
        {...props}
    />
));
TableCaption.displayName = 'TableCaption';

/**
 * Export all components together for convenient import.
 */
export const TableComponents = {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableRow,
    TableHead,
    TableCell,
    TableCaption,
};
