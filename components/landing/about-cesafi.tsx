'use client';

import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { moderniz, roboto } from '@/lib/fonts';

export default function AboutCesafi() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });

  // Enhanced parallax transforms for smoother effects
  const y1 = useTransform(scrollYProgress, [0, 0.6], [120, 0]);
  const y2 = useTransform(scrollYProgress, [0.1, 0.7], [180, 0]);

  const opacity1 = useTransform(scrollYProgress, [0, 0.4], [0, 1]);
  const opacity2 = useTransform(scrollYProgress, [0.2, 0.6], [0, 1]);

  return (
    <section ref={ref} className="bg-background relative min-h-screen overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
        <div className="grid min-h-[90vh] grid-cols-1 items-center gap-20 lg:grid-cols-3">
          {/* Left Side - CESAFI Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
            animate={
              isInView
                ? { opacity: 1, scale: 1, rotateY: 0 }
                : { opacity: 0, scale: 0.8, rotateY: -15 }
            }
            transition={{
              duration: 1.2,
              delay: 0.3,
              type: 'spring',
              stiffness: 100,
              damping: 15
            }}
            className="flex justify-center lg:justify-start"
          >
            <div className="relative">
              {/* Glowing background effect */}
              <motion.div
                animate={
                  isInView
                    ? {
                      scale: [1, 1.1, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }
                    : { scale: 1, opacity: 0.3 }
                }
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="bg-primary/20 absolute inset-0 rounded-full blur-3xl"
              />

              {/* Floating particles effect */}
              <motion.div
                animate={
                  isInView
                    ? {
                      y: [0, -20, 0],
                      rotate: [0, 180, 360]
                    }
                    : { y: 0, rotate: 0 }
                }
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="bg-primary/40 absolute -top-4 -right-4 h-3 w-3 rounded-full"
              />
              <motion.div
                animate={
                  isInView
                    ? {
                      y: [0, 15, 0],
                      rotate: [0, -180, -360]
                    }
                    : { y: 0, rotate: 0 }
                }
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="bg-primary/30 absolute -bottom-6 -left-6 h-2 w-2 rounded-full"
              />
              <motion.div
                animate={
                  isInView
                    ? {
                      y: [0, -10, 0],
                      x: [0, 10, 0]
                    }
                    : { y: 0, x: 0 }
                }
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="bg-primary/50 absolute top-1/2 -right-8 h-1.5 w-1.5 rounded-full"
              />

              {/* Main logo with enhanced effects */}
              <motion.div
                animate={
                  isInView
                    ? {
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.02, 1],
                      y: [0, -5, 0]
                    }
                    : { rotate: 0, scale: 1, y: 0 }
                }
                transition={{
                  duration: 4,
                  delay: 1.5,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: 'easeInOut'
                }}
                className="relative z-10 flex items-center justify-center"
              >
                <Image
                  src="/img/cesafi-logo.webp"
                  alt="CESAFI Logo"
                  width={400}
                  height={400}
                  className="h-64 w-64 brightness-110 contrast-110 drop-shadow-2xl filter sm:h-72 sm:w-72 lg:h-80 lg:w-80"
                />
              </motion.div>

              {/* Pulsing ring effect */}
              <motion.div
                animate={
                  isInView
                    ? {
                      scale: [1, 1.3, 1],
                      opacity: [0.4, 0, 0.4]
                    }
                    : { scale: 1, opacity: 0.4 }
                }
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                className="border-primary/30 absolute inset-0 rounded-full border-2"
              />
              <motion.div
                animate={
                  isInView
                    ? {
                      scale: [1, 1.5, 1],
                      opacity: [0.2, 0, 0.2]
                    }
                    : { scale: 1, opacity: 0.2 }
                }
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                className="border-primary/20 absolute inset-0 rounded-full border"
              />
            </div>
          </motion.div>

          {/* Right Side - Consolidated Text with Enhanced Parallax */}
          <div className="space-y-2 text-center lg:col-span-2 lg:text-left">
            {/* Main Text Block - Large and Spacious */}
            <motion.div style={{ y: y1, opacity: opacity1 }} className="space-y-8">
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 1, delay: 0.5 }}
                className={`${moderniz.className} text-foreground leading-[1.2] font-bold tracking-tight text-3xl md:text-4xl xl:text-5xl 2xl:text-6xl`}
              >
                Showcasing
                <span className="text-gradient-cel"> top-class performance</span> and
                <span className="text-gradient-cel-reverse"> innovation</span> from the best of the best.
              </motion.p>
            </motion.div>

            {/* Supporting Text Block - Enhanced Fade Effect */}
            <motion.div style={{ y: y2, opacity: opacity2 }} className="space-y-12">
              <motion.p
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                transition={{ duration: 1.2, delay: 0.8 }}
                className={`${roboto.className} text-muted-foreground max-w-4xl text-base leading-relaxed sm:text-lg md:text-xl lg:text-2xl xl:text-3xl`}
              >
                Honoring the athletes, coaches, and institutions who define the future of
                competitive sports in Cebu.
              </motion.p>

              <Link href="/about-us">
                <motion.button
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={
                    isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.9 }
                  }
                  transition={{
                    duration: 0.8,
                    delay: 1.2,
                    type: 'spring',
                    stiffness: 200,
                    damping: 20
                  }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                  }}
                  whileTap={{ scale: 0.95 }}
                  className={`${moderniz.className} bg-foreground hover:bg-foreground/90 text-background rounded-2xl px-10 py-5 text-base font-semibold tracking-wide uppercase shadow-lg transition-all duration-300 sm:text-lg md:text-xl`}
                >
                  Learn More
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
