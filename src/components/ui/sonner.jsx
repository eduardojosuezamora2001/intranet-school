import React from 'react';
import { Toaster as SonnerToaster } from 'sonner';
import { cn } from './button';

// Mapea tus temas personalizados a los que Sonner entiende
const themeMap = {
  light: 'light',
  dark: 'dark',
  esmeralda: 'light',
  burdeos: 'light',
};

export function Toaster({ theme = 'light', ...props }) {
  return (
    <SonnerToaster
      theme={themeMap[theme] || 'light'}
      className={cn('toaster group')}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-900 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg',
          title: 'text-sm font-semibold',
          description: 'text-xs text-slate-500',
          actionButton: 'bg-indigo-600 text-white hover:bg-indigo-700 text-xs',
          cancelButton: 'bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs',
        },
      }}
      {...props}
    />
  );
}
