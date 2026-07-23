// Single source of truth for the whole site.
// The 3D cartridges, the detail overlay, and the HTML fallback all read from this.
// Add/edit entries here — everything else updates automatically.
//
// color: the cartridge label color (hex). Pick something readable on dark.

export const projects = [
  {
    id: 'kwam-developer-platform',
    title: 'Kwam Developer Platform',
    tagline: 'A paved road from idea to observable service.',
    color: '#c6ff44',
    cover: '/covers/developer-platform-runtime.jpg',
    route: '/project/kwam-developer-platform/',
    routeLabel: 'View Case Study',
    tags: ['Go', 'Docker', 'GitHub Actions', 'Prometheus', 'OpenTofu', 'AWS'],
    description:
      'A working, local-first internal developer platform prototype that gives Go developers a standardized golden path for creating secure-by-default, observable services. It combines embedded service templates, automated quality and container-security gates, local Docker and Prometheus observability, and an opt-in AWS delivery reference architecture.',
    links: [
      { label: 'View Platform Source', url: 'https://github.com/kkassim1/kwam-developer-platform' },
    ],
  },
  {
    id: 'simon-says-assassin',
    title: 'Simon Says Assassin',
    tagline: 'Trust the command. Watch your back.',
    color: '#ef4444',
    cover: '/covers/simon-says-assassin-runtime.jpg',
    route: '/project/simon-says-assassin/',
    tags: ['Three.js', 'Socket.IO', 'Multiplayer'],
    description:
      'A realtime multiplayer browser game built around rooms, matchmaking, tasks, bots, and competitive scoring. The 3D client runs on Three.js while a Node and Socket.IO server keeps every player in sync.',
    links: [
      { label: 'Launch Game', url: 'https://simon-says-assassin.netlify.app/' },
    ],
  },
  {
    id: 'debate-app',
    title: 'DebateApp',
    tagline: 'Real conversations, structured turns.',
    color: '#5eead4',
    cover: '/covers/debate-app-runtime.jpg',
    route: '/project/debate-app/',
    tags: ['React', 'Go', 'WebSockets', 'MongoDB'],
    description:
      'A realtime debate-room platform with turn-based chat, live participant updates, image uploads, voice recording, and inline video. A Go backend and WebSockets power the live experience.',
    links: [
      { label: 'Open DebateApp', url: 'https://debate-app-kassimkorp.vercel.app/' },
    ],
  },
  {
    id: 'mshu',
    title: 'Unannounced Game',
    hoverLabel: 'Unannounced Game — Under Construction',
    tagline: 'Under construction — public preview coming soon.',
    color: '#f97316',
    cover: '/covers/project-signal-locked.svg',
    route: '/project/mshu/',
    tags: ['Game Development', 'Under Construction', 'Unannounced'],
    status: 'Public preview coming soon',
    description:
      'An original game is taking shape behind the scenes. The premise, mechanics, and world are staying off the public build until the project is ready for its reveal.',
    links: [],
  },
  {
    id: 'resume',
    title: 'Résumé',
    tagline: 'Experience, skills, and technical focus',
    color: '#f4d35e',
    tags: ['Experience', 'Skills', 'Education'],
    description:
      'A snapshot of my experience, technical skills, and education. Open the PDF to learn more about my work across software, infrastructure, and platform engineering.',
    links: [
      { label: 'View Résumé', url: '/resume/kwam-kassim-resume.pdf' },
    ],
  },
  {
    id: 'contact',
    title: 'About + Contact',
    tagline: 'Platform engineer, builder, and creative technologist.',
    color: '#f472b6',
    tags: ['About', 'Email', 'LinkedIn', 'GitHub'],
    description:
      'I’m Kwam, a platform engineer focused on developer tooling, reliable infrastructure, and making complex delivery systems easier to use. I also build realtime applications and games, combining technical systems work with creative product development.',
    links: [
      { label: 'Email Me', url: 'mailto:kassimkwam@gmail.com' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/kwam-kassim-660836164/' },
      { label: 'GitHub Profile', url: 'https://github.com/kkassim1' },
    ],
  },
];
