export const siteConfig = {
  name: "Engineering Foundry",
  tagline: "Prepare. Practice. Build. Grow.",
  description:
    "Structured engineering interview preparation, practice, and community—all in one place.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://engineeringfoundry.dev",
  discordUrl: process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/cNgNq3AFGX",
  githubIssuesUrl: "https://github.com/mayankdhingra02/engineeringfoundry.dev/issues",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null,
  prepareNav: [
    { label: "DSA", href: "/dsa" },
    { label: "System Design", href: "/system-design" },
    { label: "ML Design", href: "/ml-design" },
    { label: "Behavioral", href: "/behavioral" },
    { label: "Interview Playbook", href: "/interview-tips" },
  ],
  practiceNav: [
    { label: "Mock Interviews", href: "/mock-interviews" },
    { label: "Challenges", href: "/challenges" },
  ],
  careerCommunityNav: [
    { label: "Referrals", href: "/referrals" },
    { label: "Interview Experiences", href: "/interview-experiences" },
    { label: "Resources", href: "/resources" },
    { label: "Companies", href: "/companies" },
    { label: "Community", href: "/community" },
  ],
  moreNav: [
    { label: "Recognition", href: "/leaderboard" },
    { label: "About", href: "/about" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
  ],
} as const;

export const footerGroups = [
  { title: "Prepare", links: [["DSA", "/dsa"], ["System Design", "/system-design"], ["ML Design", "/ml-design"], ["Behavioral", "/behavioral"], ["Interview Playbook", "/interview-tips"]] },
  { title: "Practice", links: [["Mock Interviews", "/mock-interviews"], ["Challenges", "/challenges"]] },
  { title: "Career", links: [["Referrals", "/referrals"], ["Interview Experiences", "/interview-experiences"], ["Resources", "/resources"], ["Company Guides", "/companies"]] },
  { title: "Community", links: [["Community Hub", "/community"], ["Recognition", "/leaderboard"], ["Discord", siteConfig.discordUrl]] },
  { title: "Engineering Foundry", links: [["About", "/about"], ["FAQ", "/faq"], ["Contact", "/contact"]] },
  { title: "Legal", links: [["Privacy", "/privacy"], ["Terms", "/terms"]] },
] as const;
