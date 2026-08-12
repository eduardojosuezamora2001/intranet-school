import React from 'react';
import { cn } from './button';

export function Badge({ className, variant = 'default', children, ...props }) {
  const variants = {
    default: "bg-slate-100 text-slate-800 border-slate-200",
    admin: "bg-indigo-50 text-indigo-700 border-indigo-200 font-medium",
    docente: "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium",
    familia: "bg-sky-50 text-sky-700 border-sky-200 font-medium",
    
    // Attendance badges
    presente: "bg-emerald-100 text-emerald-800 border-emerald-300 font-medium",
    ausente: "bg-rose-100 text-rose-800 border-rose-300 font-medium",
    tardanza: "bg-amber-100 text-amber-800 border-amber-300 font-medium",
    justificado: "bg-blue-100 text-blue-800 border-blue-300 font-medium",

    // Announcement categories
    urgente: "bg-rose-100 text-rose-700 border-rose-200",
    academico: "bg-purple-50 text-purple-700 border-purple-200",
    evento: "bg-amber-50 text-amber-700 border-amber-200",
    general: "bg-slate-100 text-slate-700 border-slate-200"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border transition-colors",
        variants[variant] || variants.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
