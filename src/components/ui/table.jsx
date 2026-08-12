import React from 'react';
import { cn } from './button';

export function Table({ className, children, ...props }) {
  return (
    <div className="relative w-full overflow-auto rounded-lg border border-slate-200">
      <table
        className={cn("w-full caption-bottom text-sm text-left border-collapse", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children, ...props }) {
  return (
    <thead className={cn("bg-slate-50/80 text-slate-700 border-b border-slate-200 font-medium", className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className, children, ...props }) {
  return (
    <tbody className={cn("divide-y divide-slate-100 bg-white", className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className, children, ...props }) {
  return (
    <tr
      className={cn(
        "transition-colors hover:bg-slate-50/60 data-[state=selected]:bg-slate-100",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ className, children, ...props }) {
  return (
    <th
      className={cn(
        "h-11 px-4 text-left align-middle font-semibold text-slate-700 uppercase tracking-wider text-[11px]",
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...props }) {
  return (
    <td
      className={cn("p-4 align-middle text-slate-700 text-sm", className)}
      {...props}
    >
      {children}
    </td>
  );
}
