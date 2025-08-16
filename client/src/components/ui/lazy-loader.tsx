import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function LazyLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center"
      >
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <motion.p 
          className="text-gray-600 text-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Loading content...
        </motion.p>
      </motion.div>
    </div>
  );
}