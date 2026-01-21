'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Users, Trophy, Calendar, Target, Award, Heart } from 'lucide-react';
import { moderniz, roboto } from '@/lib/fonts';

const stats = [
  { icon: Users, value: '8+', label: 'Member Schools' },
  { icon: Trophy, value: '50+', label: 'Championships' },
  { icon: Calendar, value: '100+', label: 'Annual Events' },
  { icon: Target, value: '5000+', label: 'Student Athletes' },
  { icon: Award, value: '25+', label: 'Years of Excellence' },
  { icon: Heart, value: '100%', label: 'Passion for Sports' }
];

const values = [
  {
    title: 'Excellence',
    description:
      'We strive for the highest standards in athletic performance, sportsmanship, and fair play across all competitions.',
    icon: '🏆'
  },
  {
    title: 'Unity',
    description:
      'Bringing together diverse educational institutions to create a unified sports community in Cebu.',
    icon: '🤝'
  },
  {
    title: 'Innovation',
    description:
      'Embracing new technologies and methodologies to enhance the sports experience for all participants.',
    icon: '💡'
  },
  {
    title: 'Integrity',
    description:
      'Maintaining the highest ethical standards in all our competitions and organizational practices.',
    icon: '⚖️'
  }
];

export default function AboutUsContent() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="bg-muted/30 relative overflow-hidden py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Mission Statement */}
        <motion.div style={{ y, opacity }} className="mb-20 text-center">
          <h2
            className={`${moderniz.className} text-foreground mb-8 text-4xl leading-tight font-bold lg:text-5xl xl:text-6xl`}
          >
            OUR
            <br />
            <span className="text-primary">MISSION</span>
          </h2>
          <p
            className={`${roboto.className} text-muted-foreground mx-auto max-w-4xl text-xl leading-relaxed lg:text-2xl`}
          >
            To promote and develop athletic excellence among Cebu&apos;s educational institutions
            while fostering unity, sportsmanship, and the holistic development of student-athletes.
          </p>
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="bg-background/50 border-border/50 hover:border-primary/30 rounded-2xl border p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105">
                  <stat.icon className="text-primary mx-auto mb-3 h-8 w-8" />
                  <div
                    className={`${moderniz.className} text-foreground mb-2 text-3xl font-bold lg:text-4xl`}
                  >
                    {stat.value}
                  </div>
                  <div className={`${roboto.className} text-muted-foreground text-sm lg:text-base`}>
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Values Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="mb-16 text-center">
            <h3
              className={`${moderniz.className} text-foreground mb-6 text-3xl font-bold lg:text-4xl`}
            >
              OUR VALUES
            </h3>
            <p className={`${roboto.className} text-muted-foreground mx-auto max-w-3xl text-lg`}>
              The principles that guide everything we do at CESAFI
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-background/50 border-border/50 hover:border-primary/30 rounded-2xl border p-8 text-center backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
              >
                <div className="mb-4 text-4xl">{value.icon}</div>
                <h4 className={`${moderniz.className} text-foreground mb-4 text-xl font-bold`}>
                  {value.title}
                </h4>
                <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* History Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="from-primary/10 via-primary/5 to-secondary/10 border-primary/20 rounded-3xl border bg-gradient-to-r p-8 lg:p-12"
        >
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <h3
                className={`${moderniz.className} text-foreground mb-6 text-3xl font-bold lg:text-4xl`}
              >
                OUR STORY
              </h3>
              <p
                className={`${roboto.className} text-muted-foreground mb-6 text-lg leading-relaxed`}
              >
                Founded with the vision of uniting Cebu&apos;s educational institutions through
                sports, CESAFI has grown from a small group of schools to become the premier
                athletic foundation in the region.
              </p>
              <p className={`${roboto.className} text-muted-foreground text-lg leading-relaxed`}>
                Over the years, we have witnessed countless moments of triumph, perseverance, and
                sportsmanship that define the spirit of Cebu sports. Our commitment to excellence
                and fair play continues to drive us forward.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className={`${moderniz.className} text-primary mb-2 text-4xl font-bold`}>
                  1998
                </div>
                <div className={`${roboto.className} text-muted-foreground text-sm`}>Founded</div>
              </div>
              <div className="text-center">
                <div className={`${moderniz.className} text-primary mb-2 text-4xl font-bold`}>
                  25+
                </div>
                <div className={`${roboto.className} text-muted-foreground text-sm`}>
                  Years Strong
                </div>
              </div>
              <div className="text-center">
                <div className={`${moderniz.className} text-primary mb-2 text-4xl font-bold`}>
                  8
                </div>
                <div className={`${roboto.className} text-muted-foreground text-sm`}>
                  Member Schools
                </div>
              </div>
              <div className="text-center">
                <div className={`${moderniz.className} text-primary mb-2 text-4xl font-bold`}>
                  50+
                </div>
                <div className={`${roboto.className} text-muted-foreground text-sm`}>
                  Championships
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
