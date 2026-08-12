import React from 'react';
import { cn } from './button';

export function Tabs({ tabs, activeTab, onChange, className }) {
  return (
    <div className={cn("flex space-x-1 border-b border-slate-200 mb-6", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer -mb-px flex items-center space-x-2",
              isActive
                ? "border-indigo-700 text-indigo-700 bg-indigo-50/50 rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={cn(
                "ml-2 text-xs px-2 py-0.5 rounded-full font-semibold",
                isActive ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-600"
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
