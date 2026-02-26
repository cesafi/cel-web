export type NavItem = {
  name: string;
  href?: string;
  children?: { name: string; href: string }[];
};

export const navItems: NavItem[] = [
  { name: 'Home', href: '/' },
  {
    name: 'Season',
    children: [
      { name: 'Schedule', href: '/schedule' },
      { name: 'Standings', href: '/standings' },
      { name: 'Statistics', href: '/statistics' },
    ]
  },
  {
    name: 'Community',
    children: [
      { name: 'Schools', href: '/schools' },
      { name: 'Players', href: '/players' },
      { name: 'Volunteers', href: '/volunteers' },
      { name: 'Sponsors', href: '/sponsors' },
    ]
  },
  { name: 'News', href: '/news' },
  {
    name: 'Info',
    children: [
      { name: 'About Us', href: '/about-us' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Contact Us', href: '/contact' },
    ]
  },
];
