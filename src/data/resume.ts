export const resume = {
  profile:
    'Software engineer who designs and ships real-world applications across web and backend systems. Skilled in Go, JavaScript, React and Laravel, with experience in startup-paced environments and client-facing projects. Interested in building efficient systems and continuously improving how software is made.',
  // One-liners that read better on a resume than the site summary, keyed by project slug.
  lines: {
    'nocturne-network': 'Served as the bridge between frontend and backend development, coordinating integration and keeping functionality and code quality consistent across the project.',
    overworld: 'Built a mobile app that automatically plays user-selected music when connecting to specific WiFi networks or Bluetooth devices.',
    'go-byte': 'Built a CHIP-8 emulator in Go using SDL2 for graphics and input handling.',
    smobb: 'A text adventure about AI, released with a terminal and web version.',
  } as Record<string, string>,
  // TODO owner: dates for both entries
  involvement: [
    { title: 'StartUp Bahrain', org: 'Three editions' },
    { title: 'Build Hackathon', org: 'Reboot Coding Institute' },
  ],
};
