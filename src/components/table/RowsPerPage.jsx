"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

export function RowsPerPage({
  pageSize,
  onPageSizeChange,
  options = [5, 10, 25, 50],
}) {
  return (
    <div className="flex items-center space-x-3">
      <span className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
        Filas por página:
      </span>
      <div className="relative">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md px-4 py-1.5 pr-8 text-zinc-800 dark:text-white text-sm shadow-sm appearance-none focus:border-[var(--app-secondary)] focus:ring-1 focus:ring-[var(--app-secondary)] focus:outline-none"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500 dark:text-zinc-400">
          {/* <ChevronDown className="h-4 w-4" /> */}
        </div>
      </div>
    </div>
  );
}
