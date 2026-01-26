/**
 * Page Loader Component
 * Shows while lazy-loaded pages are being fetched
 */
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Loading...' }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen bg-background"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className="w-10 h-10 text-primary" />
      </motion.div>
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
    </motion.div>
  );
};

/**
 * Compact loader for smaller sections
 */
export const SectionLoader: React.FC<PageLoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
      {message && <p className="mt-2 text-xs text-muted-foreground">{message}</p>}
    </div>
  );
};

export default PageLoader;
