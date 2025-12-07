/**
 * Deep Research Page
 * Main page for Deep Research Mode
 */
import React from 'react';
import { DeepResearchPanel } from '@/components/DeepResearchPanel';
import { motion } from 'framer-motion';

const DeepResearchPage: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-background"
        >
            <DeepResearchPanel />
        </motion.div>
    );
};

export default DeepResearchPage;
