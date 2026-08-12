import React from 'react';
import { cn } from './button';
import { Info, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

export function Alert({ variant = 'info', title, children, className }) {
  const styles = {
    info: {
      bg: "bg-blue-50 border-blue-200 text-blue-900",
      icon: <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
    },
    warning: {
      bg: "bg-amber-50 border-amber-200 text-amber-900",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
    },
    success: {
      bg: "bg-emerald-50 border-emerald-200 text-emerald-900",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
    },
    error: {
      bg: "bg-rose-50 border-rose-200 text-rose-900",
      icon: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
    }
  };

  const current = styles[variant] || styles.info;

  return (
    <div className={cn("flex items-start space-x-3 p-4 rounded-xl border text-sm shadow-xs", current.bg, className)}>
      {current.icon}
      <div>
        {title && <h4 className="font-semibold mb-0.5 text-sm">{title}</h4>}
        <div className="text-xs leading-relaxed opacity-90">{children}</div>
      </div>
    </div>
  );
}

export function StatsCard({ title, value, description, icon: Icon, trend, color = 'indigo' }) {
  const colorMap = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    sky: "bg-sky-50 text-sky-700 border-sky-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100"
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        <div className="flex items-baseline space-x-2">
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {trend && <span className="text-xs text-emerald-600 font-medium">{trend}</span>}
        </div>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      {Icon && (
        <div className={cn("p-3 rounded-xl border flex items-center justify-center", colorMap[color] || colorMap.indigo)}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
}
