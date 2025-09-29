import { motion } from 'motion/react';
import { cn } from '../ui/utils';

interface TransactionSkeletonProps {
  count?: number;
  variant?: 'card' | 'table' | 'stats';
  className?: string;
}

export function TransactionSkeleton({
  count = 3,
  variant = 'card',
  className
}: TransactionSkeletonProps) {
  if (variant === 'stats') {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6", className)}>
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="relative overflow-hidden rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50"
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/50 dark:to-slate-800/50" />

            {/* Content */}
            <div className="relative p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>

              {/* Title */}
              <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />

              {/* Value */}
              <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Table skeleton */}
        <div className="rounded-3xl overflow-hidden backdrop-blur-xl border bg-white/60 dark:bg-slate-800/60 border-gray-200/50 dark:border-gray-700/50">
          {/* Header */}
          <div className="border-b border-gray-200/50 dark:border-gray-700/50 p-4">
            <div className="grid grid-cols-7 gap-4">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          </div>

          {/* Rows */}
          {[...Array(count)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="border-b border-gray-200/50 dark:border-gray-700/50 p-4 last:border-b-0"
            >
              <div className="grid grid-cols-7 gap-4 items-center">
                {/* Type */}
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="w-3/4 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>

                {/* Category */}
                <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />

                {/* Date */}
                <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />

                {/* Channel */}
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="w-12 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>

                {/* Amount */}
                <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto" />

                {/* Actions */}
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination skeleton */}
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl backdrop-blur-xl border bg-white/60 dark:bg-slate-800/60 border-gray-200/50 dark:border-gray-700/50">
          <div className="w-48 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="flex items-center space-x-2">
            <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Card variant (default)
  return (
    <div className={cn("space-y-6", className)}>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
          className="relative overflow-hidden rounded-3xl backdrop-blur-xl border bg-white/60 dark:bg-slate-800/60 border-gray-200/50 dark:border-gray-700/50"
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/50 dark:to-slate-800/50" />

          {/* Content */}
          <div className="relative p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {/* Icon */}
                <div className="w-10 h-10 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />

                {/* Category and channel info */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="w-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                    <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Menu button */}
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="w-full h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              {/* Date and time */}
              <div className="space-y-1">
                <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>

              {/* Amount */}
              <div className="w-28 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Helper component for quick loading states
export function TransactionListSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats skeleton */}
      <TransactionSkeleton variant="stats" />

      {/* Filters skeleton */}
      <div className="space-y-4">
        <div className="h-12 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl animate-pulse" />
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-20 h-8 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl animate-pulse" />
            ))}
          </div>
          <div className="w-24 h-8 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl animate-pulse" />
        </div>
      </div>

      {/* Transaction cards skeleton */}
      <TransactionSkeleton variant="card" count={5} />
    </div>
  );
}