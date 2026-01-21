'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { ReactNode, RefObject } from 'react';

interface ScrollEffectsProps {
  children: ReactNode;
  ref: RefObject<HTMLElement | null>;
}

export function ScrollEffects({ children, ref }: ScrollEffectsProps) {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <motion.div style={{ y, opacity }}>
      {children}
    </motion.div>
  );
}
