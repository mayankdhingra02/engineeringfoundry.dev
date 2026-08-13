export const siteConfig = {
  name: "Engineering Foundry",
  tagline: "Prepare. Practice. Build. Grow.",
  description:
    "Structured engineering interview preparation, practice, and community—all in one place.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://engineeringfoundry.dev",
  discordUrl: process.env.NEXT_PUBLIC_DISCORD_URL ?? "https://discord.gg/example",
  nav: [
    { label: "DSA", href: "/dsa" },
    { label: "System Design", href: "/system-design" },
    { label: "ML Design", href: "/ml-design" },
    { label: "Behavioral", href: "/behavioral" },
    { label: "Mock Interviews", href: "/mock-interviews" },
    { label: "Referrals", href: "/referrals" },
    { label: "Resources", href: "/resources" },
    { label: "Community", href: "/community" },
  ],
  moreNav: [
    { label: "Interview Experiences", href: "/interview-experiences" },
    { label: "Company Guides", href: "/companies" },
    { label: "Challenges", href: "/challenges" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "About", href: "/about" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
  ],
} as const;

export const footerGroups = [
  { title: "Prepare", links: [["DSA", "/dsa"], ["System Design", "/system-design"], ["ML Design", "/ml-design"], ["Behavioral", "/behavioral"], ["Interview Tips", "/interview-tips"]] },
  { title: "Practice", links: [["Mock Interviews", "/mock-interviews"], ["Challenges", "/challenges"], ["Interview Experiences", "/interview-experiences"]] },
  { title: "Career", links: [["Referrals", "/referrals"], ["Company Guides", "/companies"]] },
  { title: "Community", links: [["Discord", siteConfig.discordUrl], ["Contributors", "/community#contributors"]] },
  { title: "Engineering Foundry", links: [["About", "/about"], ["FAQ", "/faq"], ["Contact", "/contact"]] },
  { title: "Legal", links: [["Privacy", "/privacy"], ["Terms", "/terms"]] },
] as const;
