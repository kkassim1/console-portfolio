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
    cover: '/covers/developer-platform.png',
    route: '/project/kwam-developer-platform/',
    tags: ['OpenTofu', 'Go', 'GitHub Actions', 'Prometheus'],
    description:
      'A local-first internal developer platform demonstrating infrastructure as code and platform-as-a-product practices. It gives developers a self-service CLI, secure service templates, CI and security gates, observability, cost controls, and optional AWS infrastructure.',
    links: [
      { label: 'View Platform Source', url: 'https://github.com/kkassim1/kwam-developer-platform' },
    ],
  },
  {
    id: 'simon-says-assassin',
    title: 'Simon Says Assassin',
    tagline: 'Trust the command. Watch your back.',
    color: '#ef4444',
    cover: '/covers/simon-says-assassin.png',
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
    cover: '/covers/debate-app.png',
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
    title: 'Momma Said Hurry Up',
    tagline: 'In development — 3rd-person errand runner',
    color: '#f97316',
    cover: '/covers/mshu.png',
    route: '/project/mshu/',
    tags: ['Godot 4.5', 'Game', 'In Development'],
    description:
      'A third-person errand-running game where you race through a stylized world and finish every task before time runs out. This project is currently in development.',
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
    title: 'Contact',
    tagline: 'Let’s build something reliable.',
    color: '#f472b6',
    tags: ['Email', 'LinkedIn', 'GitHub'],
    description:
      'Get in touch about platform engineering, software projects, or collaboration. I’m always interested in thoughtful technical conversations and new opportunities.',
    links: [
      { label: 'Email Me', url: 'mailto:kassimkwam@gmail.com' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/kwam-kassim-660836164/' },
      { label: 'GitHub Profile', url: 'https://github.com/kkassim1' },
    ],
  },
];
