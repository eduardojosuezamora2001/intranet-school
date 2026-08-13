import React from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function PaginationControls({
  page,
  totalPages,
  hasNextPage,
  hasPrevPage,
  onNextPage,
  onPrevPage,
  totalItems,
  pageSize
}) {
  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = totalItems !== undefined ? Math.min(page * pageSize, totalItems) : page * pageSize;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
      <div>
        {totalItems !== undefined ? (
          <span>
            Mostrando <strong className="font-semibold text-slate-700 dark:text-slate-200">{startItem} - {endItem}</strong> de <strong className="font-semibold text-slate-700 dark:text-slate-200">{totalItems}</strong> registros
          </span>
        ) : (
          <span>
            Página <strong className="font-semibold text-slate-700 dark:text-slate-200">{page}</strong>
          </span>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevPage}
          disabled={!hasPrevPage}
          className="h-8 px-2.5 text-xs"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>
        <span className="px-2 font-medium text-slate-600 dark:text-slate-400">
          {page} {totalPages ? `/ ${totalPages}` : ''}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!hasNextPage}
          className="h-8 px-2.5 text-xs"
        >
          Siguiente
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
