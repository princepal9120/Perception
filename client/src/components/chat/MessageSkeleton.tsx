/**
 * Message Skeleton Loader
 * Shows loading state while messages are being fetched
 */
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface MessageSkeletonProps {
  count?: number;
}

const SingleMessageSkeleton = ({ isUser = false }: { isUser?: boolean }) => (
  <div className="flex gap-4 md:gap-6 w-full">
    {/* Avatar skeleton */}
    <Skeleton className={`w-8 h-8 rounded-sm flex-shrink-0 ${isUser ? 'bg-gray-300' : 'bg-green-200'}`} />

    {/* Content skeleton */}
    <div className="flex-1 space-y-2">
      {/* Name and timestamp */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>

      {/* Message content - varies by role */}
      {isUser ? (
        <Skeleton className="h-4 w-3/4" />
      ) : (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      )}
    </div>
  </div>
);

export const MessageSkeleton: React.FC<MessageSkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="pb-6 border-b border-black/5 dark:border-white/5 last:border-0"
        >
          <SingleMessageSkeleton isUser={index % 2 === 0} />
        </motion.div>
      ))}
    </div>
  );
};

export default MessageSkeleton;
