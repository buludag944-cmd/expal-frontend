/**
 * EXPal Help & FAQ — grouped by feature area.
 * Keep answers aligned with actual app routes and behaviour.
 */
export const FAQ_CATEGORIES = [
  {
    id: "getting-started",
    title: "Getting started",
    icon: "🚀",
    items: [
      {
        q: "What is EXPal?",
        a: "EXPal is a community app for expats — especially people settling in Ireland. It brings together housing, visa tracking, community forums, events, member messaging, local guides, and employment resources in one place.",
      },
      {
        q: "How do I sign up or log in?",
        a: "On the welcome screen you can Continue with Google (Firebase), or use Sign in / Create account with email and password. Google accounts must keep using Google — they do not have a separate password. Email signups may need to verify via the link we send before logging in.",
      },
      {
        q: "Why does Google sign-in fail on my phone?",
        a: "Common fixes: update the app from Google Play, update Google Play services, check Wi‑Fi or mobile data, and disable VPN. If you see a developer or SHA-1 error, install the latest Play Store build — older sideloaded builds may not be authorized. Still stuck? Profile → Contact founder.",
      },
      {
        q: "Is there a blog I can read without signing up?",
        a: "Yes. On the web site, open Blog from the top navigation or go to /blog. Articles are public — no login required. Sign in only when you want the full app (housing, journey, community).",
      },
      {
        q: "Do I need to complete onboarding?",
        a: "Yes, for the best experience. After your first login you are guided through destination, profession, visa type, dates, and concerns. This personalises your Home dashboard, visa checklist, and Explore suggestions. You can resume anytime from the banner on Home.",
      },
      {
        q: "Is EXPal free?",
        a: "Yes. EXPal is free to use. By signing in you agree to our Privacy Policy (linked on the login screen and under Profile → Privacy & data).",
      },
      {
        q: "Which countries does EXPal support?",
        a: "Onboarding includes Ireland, Germany, Netherlands, UK, France, Spain, and Other. Many features (community, housing, guides) are Ireland-focused today, but members from anywhere can join and contribute.",
      },
    ],
  },
  {
    id: "navigation",
    title: "Navigation & basics",
    icon: "🧭",
    items: [
      {
        q: "How do I move between main sections?",
        a: "On mobile, use the bottom tab bar: Home, Explore, Community, Housing, and Profile. On web, use the sidebar. You can also open shortcuts from Home tiles.",
      },
      {
        q: "What is edge swipe navigation?",
        a: "On Android, swiping from the left or right edge of the screen (about 28px in) can move between main tabs. Swiping in the middle of a scrollable page — for example while browsing Housing listings — does not change tabs.",
      },
      {
        q: "How do I replay the app tour?",
        a: "Profile → Support → Replay walkthrough, or Help & FAQs → Replay walkthrough. The tour walks you through Home, Housing, Community, Referrals, Visa, Messages, Notifications, Help, and Contact founder.",
      },
      {
        q: "How do I change light or dark mode?",
        a: "Profile → Appearance → Theme. Choose Auto (dark between 7pm and 7am local time), Light, or Dark. Your choice is saved on this device.",
      },
      {
        q: "Where is the web version?",
        a: "EXPal also runs at expalapp.netlify.app in a browser. The Android app bundles the same UI inside the install — you need internet for community data and sign-in, but the app shell loads from the bundle, not a remote website.",
      },
    ],
  },
  {
    id: "home-explore",
    title: "Home & Explore",
    icon: "🏠",
    items: [
      {
        q: "What does Home show?",
        a: "Home greets you by name, shows days in your destination, quick shortcuts (Housing, Community, Members, Messages, Visa, etc.), and alerts such as unread notifications or urgent visa tasks.",
      },
      {
        q: "What is Explore?",
        a: "Explore is a discovery hub for Events, Housing, Local Know-How, Expat Essentials, Referrals, and Visa & Permit. Suggestions reflect your relocation phase (relocation, integration, or establishment).",
      },
      {
        q: "How do I search the app?",
        a: "Use the search bar on Home (or open Search). You can find members by name, city, or industry, and community topics by title or content. Filter by All, Members, or Topics.",
      },
    ],
  },
  {
    id: "community",
    title: "Community",
    icon: "👥",
    items: [
      {
        q: "What can I do in Community?",
        a: "Community has three tabs: Events (workshops and meetups), Threads (forum discussions in spaces like App General), and Groups (browse forum spaces). Tap ＋ on Events or Threads to post when signed in.",
      },
      {
        q: "What is App General?",
        a: "App General is the forum space for questions about EXPal itself — bugs, feedback, how-to questions, and app updates. Prefer this over random threads when your question is about the app.",
      },
      {
        q: "How do I create or join an event?",
        a: "Community → Events tab → ＋. Add title, description, date, and location. Browse events and comment on any listing. On Android, Explore → Events also opens the Events tab.",
      },
      {
        q: "How do forum threads and replies work?",
        a: "Community → Threads or Groups → pick a space → open or create a thread. Inside a thread you can read replies, post your own, and use actions on your content.",
      },
      {
        q: "Can I edit or delete my posts?",
        a: "Yes. On your own forum threads, replies, events, essentials, know-how posts, housing listings, and comments, use Edit or Delete (or ⋯ menu on web). Admins can moderate content.",
      },
      {
        q: "What are Referrals?",
        a: "Referrals are community job and introduction posts. Open Referrals from Home or Explore, browse listings, comment, or tap ＋ to share a referral.",
      },
    ],
  },
  {
    id: "housing",
    title: "Housing",
    icon: "🏡",
    items: [
      {
        q: "How do I browse housing listings?",
        a: "Open Housing from the bottom tab or Home. Scroll listings, tap one for details, and use Enquire to contact the poster. Listings show location, price, and description where provided.",
      },
      {
        q: "How do I post a housing listing?",
        a: "Housing → ＋. Fill in title, area, rent, description, and contact preference, then publish. You must be signed in.",
      },
      {
        q: "Can I edit or remove my listing?",
        a: "Yes. Open your listing and use Edit or Delete if you are the owner (or an admin).",
      },
      {
        q: "Why does scrolling Housing jump to another tab?",
        a: "It should not. Only edge swipes or the bottom bar change main tabs. If you still see jumps, update to the latest app version — this was fixed in recent builds.",
      },
    ],
  },
  {
    id: "guides",
    title: "Expat Essentials & Know-How",
    icon: "📚",
    items: [
      {
        q: "What is Expat Essentials?",
        a: "Community-written guides on visa, tax, banking, health, and legal topics. Explore → Expat Essentials, or open /essentials. Filter by category, search, tap a guide to read, and comment.",
      },
      {
        q: "What is Local Know-How?",
        a: "Tips and questions about daily life — transport, food, neighbours, paperwork, and more. Explore → Local Know-How. Share shortcuts or ask the community with ＋.",
      },
      {
        q: "How do I add a guide or tip?",
        a: "Open Essentials or Know-How → ＋. Choose a category, write a title and body, then Publish. You must be signed in.",
      },
    ],
  },
  {
    id: "visa-journey",
    title: "Visa & Journey",
    icon: "🪪",
    items: [
      {
        q: "Where is Visa & Permit tracking?",
        a: "Home → Visa shortcut, Explore → Visa & Permit, or Profile → Permit & visa details. Track permit progress, deadlines, and your relocation checklist.",
      },
      {
        q: "How is my visa checklist built?",
        a: "It uses your onboarding answers — destination, visa type, arrival date, and concerns — to suggest tasks and timelines. Update Profile or onboarding fields if your situation changes.",
      },
      {
        q: "What visa types are supported?",
        a: "Ireland includes options such as Critical Skills Employment Permit, General Work Permit, and EU/EEA citizen. Other countries show Work Permit and EU citizen routes. Pick the closest match during onboarding.",
      },
    ],
  },
  {
    id: "members-messages",
    title: "Members & messages",
    icon: "💬",
    items: [
      {
        q: "How do I find other members?",
        a: "Home → Members (or Search). Browse profiles, see nationality, city, and bio. Tap a profile to view details and send a message.",
      },
      {
        q: "How do I message another member?",
        a: "Messages shows your inbox of existing conversations. For a new chat: Members → open a profile → Send message. You can also reach DMs from Notifications when someone contacts you.",
      },
      {
        q: "Where is my message inbox?",
        a: "Home → Messages, or the Messages shortcut. Each row shows name, preview, time, and an unread badge. Tap a row to open the full conversation.",
      },
      {
        q: "Do I need to find someone in Members to reply?",
        a: "No. If they already messaged you, open Messages or Notifications — you do not need to search their profile again.",
      },
      {
        q: "How do I edit my profile?",
        a: "Profile → Edit profile. Update photo (max 2 MB), nationality, city, company, industry, bio, and interests, then save.",
      },
    ],
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: "🔔",
    items: [
      {
        q: "Where do notifications appear?",
        a: "Tap the bell on Home or Profile → Notification inbox. Unread items are highlighted. Types include DMs, replies on your posts, and forum activity.",
      },
      {
        q: "How do I enable push alerts on my phone?",
        a: "Profile → Enable push alerts. Accept the permission prompt. Push uses Firebase Cloud Messaging so you get banners when the app is in the background.",
      },
      {
        q: "Why am I not getting push notifications?",
        a: "Check Profile → Enable push alerts, Android notification permissions for EXPal, and that battery saver is not blocking the app. You still receive in-app notifications in the inbox when push is off.",
      },
      {
        q: "Do notifications mark as read automatically?",
        a: "Opening a DM or related content from Notifications marks items read. The inbox polls for updates while you use the app.",
      },
    ],
  },
  {
    id: "employment-privacy",
    title: "Employment & privacy",
    icon: "⚖️",
    items: [
      {
        q: "Where are employment rights resources?",
        a: "Profile → Employment rights (or Home → Rights). Find links to official Irish resources, FLAC, Community Law & Mediation, and guidance on permits and redundancy — informational only, not legal advice.",
      },
      {
        q: "Where is the Privacy Policy?",
        a: "Profile → Privacy & data, or the link on the login screen. It explains what we store and how account data is used.",
      },
      {
        q: "How do I delete my account or data?",
        a: "Contact the founder via Profile → Contact founder and request deletion. We will process GDPR-style requests manually.",
      },
      {
        q: "Is my email visible to everyone?",
        a: "Your email is used for login and founder support messages. Other members see your profile name, photo, and fields you fill in — not your email by default on public profile views.",
      },
    ],
  },
  {
    id: "support-troubleshooting",
    title: "Support & troubleshooting",
    icon: "🛟",
    items: [
      {
        q: "How do I contact the founder?",
        a: "Profile → Contact founder. Write your message and send — your name and email are attached automatically so we know who wrote.",
      },
      {
        q: "What email can I use for support?",
        a: "expalappsupport@gmail.com, or Contact founder in the app for the fastest path with your account context.",
      },
      {
        q: "The app says it cannot reach the server",
        a: "EXPal needs internet for community data, messages, and login. On first load the backend may take a few seconds to wake up (Render free tier). Wait and retry. If Netlify times out in an old build, install the latest Play Store AAB — current builds bundle the UI locally.",
      },
      {
        q: "I see a blank screen or old Netlify URL",
        a: "Install the latest version from Google Play. Older test builds loaded the site from expalapp.netlify.app; production AABs bundle the app inside the install.",
      },
      {
        q: "How do I report a bug?",
        a: "Community → Groups → App General → new thread, or Profile → Contact founder with steps to reproduce and your device model.",
      },
      {
        q: "How do I log out?",
        a: "Profile → scroll down → Log out. Push registration is cleared on logout. Sign in again with Google or your email and password.",
      },
    ],
  },
];

/** Flat list for simple search indexing */
export function getAllFaqs() {
  return FAQ_CATEGORIES.flatMap((cat) =>
    cat.items.map((item) => ({ ...item, categoryId: cat.id, categoryTitle: cat.title }))
  );
}

export function filterFaqs(query) {
  const q = query.trim().toLowerCase();
  if (!q) return FAQ_CATEGORIES;
  return FAQ_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.q.toLowerCase().includes(q) ||
        item.a.toLowerCase().includes(q) ||
        cat.title.toLowerCase().includes(q)
    ),
  })).filter((cat) => cat.items.length > 0);
}
