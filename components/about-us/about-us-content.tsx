'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Users, Trophy, Calendar, Target, Award, Heart } from 'lucide-react';
import { moderniz, roboto } from '@/lib/fonts';

const stats = [
  { icon: Users, value: '9+', label: 'Member Schools' },
  { icon: Trophy, value: '4', label: 'Seasons' },
  { icon: Calendar, value: '2', label: 'Esport Titles' },
  { icon: Target, value: '50+', label: 'Players per Season' },
  { icon: Award, value: '3+', label: 'Years of Growth' },
  { icon: Heart, value: '100%', label: 'Student-Led' }
];

const values = [
  {
    title: 'Competitiveness',
    description:
      'Elevating the standard of collegiate esports through fierce but fair competition across MLBB and Valorant.',
    icon: '🎮'
  },
  {
    title: 'Community',
    description:
      'Uniting students from diverse schools under a shared passion for gaming, building bonds that go beyond the screen.',
    icon: '🤝'
  },
  {
    title: 'Student Leadership',
    description:
      'Run by students, for students — from broadcasting and production to event operations and tournament management.',
    icon: '🎓'
  },
  {
    title: 'Inclusivity',
    description:
      'Breaking barriers with the introduction of a women\'s division and welcoming all CESAFI member schools to compete.',
    icon: '🌟'
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
            To foster collegiate esports excellence, provide a competitive platform for
            student-gamers across CESAFI member schools, and cultivate a student-led community that
            develops talent both in-game and beyond.
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
              The principles that drive the CESAFI Esports League forward
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
                After three years of groundwork, CESAFI Executive Director Ryan Balbuena brought
                competitive gaming into the collegiate spotlight. In December 2022, the CESAFI
                Esports League officially launched — becoming the first collegiate esports
                competition in the Philippines supervised by athletic directors from CESAFI member
                schools.
              </p>
              <p className={`${roboto.className} text-muted-foreground text-lg leading-relaxed`}>
                What started with Mobile Legends: Bang Bang in Season 1 quickly expanded to include
                Valorant in Season 2. By Season 4, the league introduced a women&apos;s division — a
                historic milestone for gender inclusivity in Philippine collegiate esports. Today,
                CEL is the largest student-oriented esports league in Cebu City.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className={`${moderniz.className} text-primary mb-2 text-4xl font-bold`}>
                  2022
                </div>
                <div className={`${roboto.className} text-muted-foreground text-sm`}>Founded</div>
              </div>
              <div className="text-center">
                <div className={`${moderniz.className} text-primary mb-2 text-4xl font-bold`}>
                  4
                </div>
                <div className={`${roboto.className} text-muted-foreground text-sm`}>
                  Seasons
                </div>
              </div>
              <div className="text-center">
                <div className={`${moderniz.className} text-primary mb-2 text-4xl font-bold`}>
                  9+
                </div>
                <div className={`${roboto.className} text-muted-foreground text-sm`}>
                  Member Schools
                </div>
              </div>
              <div className="text-center">
                <div className={`${moderniz.className} text-primary mb-2 text-4xl font-bold`}>
                  2
                </div>
                <div className={`${roboto.className} text-muted-foreground text-sm`}>
                  Esport Titles
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
