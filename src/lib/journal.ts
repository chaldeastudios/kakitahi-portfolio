/**
 * Journal dataset — the six real entries from Isaiah's journal, sourced
 * from the chaldeastudios/kakitahi repo (src/data/content.js) and now
 * held in Odoo as blog.post records in the "Our blog" blog (id 1).
 *
 * Odoo is the source of truth; this file is the static fallback the pages
 * fall back to when a live fetch fails, exactly as src/lib/projects.ts is
 * for the case studies. It is kept byte-identical to what
 * src/lib/odoo/content.ts parses out of those records, so a reader cannot
 * tell which source rendered the page.
 *
 * The JournalPost type lives here rather than in the Odoo layer because
 * that layer imports "server-only"; keeping the shape here lets client
 * components and pages import it freely.
 */

export type JournalSection = {
  heading: string;
  body: string;
};

export type JournalPost = {
  slug: string;
  title: string;
  category: string;
  date: string;
  postedBy: string;
  intro: string;
  sections: JournalSection[];
};

const AUTHOR = "Isaiah Kakitahi";

/** Oldest first — the order the entries were written, and the order Odoo returns. */
export const JOURNAL: JournalPost[] = [
  {
    slug: "a-place-to-begin",
    title: "A Place to Begin",
    category: "Beginnings",
    date: "Nov 10, 2025",
    postedBy: AUTHOR,
    intro:
      "This site has been on my mind for a long time — a place that feels personal, honest, and alive.",
    sections: [
      {
        heading: "Why This Site",
        body: "This site has been on my mind for a long time — a place that feels personal, honest, and alive. I wanted somewhere to document not just what I make, but what I'm learning, what I'm curious about, and how my ideas evolve along the way.\n\nThis platform isn't meant to be just a portfolio or a showcase — it's more of a journal. A space to think out loud. Some entries might be about design, others about finance, or simply about the quiet in-between moments that shape everything else.",
      },
      {
        heading: "Not Chaldea Studios",
        body: "I've spent a lot of time working on Chaldea Studios, building projects that tell stories through design. But this site is different — it's about me, Isaiah, and the process behind everything I create and aspire to become.",
      },
      {
        heading: "Closing Thoughts",
        body: "I don't know exactly where this will lead, and that's the point. I want this space to grow naturally, just like the work itself — thoughtful, experimental, and real.\n\nSo here's to beginnings, and to the quiet courage of sharing them.",
      },
    ],
  },
  {
    slug: "the-myth-of-clarity",
    title: "The Myth of Clarity",
    category: "Reflections",
    date: "Nov 12, 2025",
    postedBy: AUTHOR,
    intro:
      "I've been thinking about how much pressure there is to know — where you're headed, what you want, how to get there.",
    sections: [
      {
        heading: "The Pressure to Know",
        body: "To know where you're headed. To know what you want. To know how to get there.\n\nIn school, the path feels drawn out — syllabuses, semesters, grades. There's always something or someone showing you where to go next. But when you start looking toward a career, the map suddenly disappears. The road isn't straight anymore; it bends, splits, loops, and sometimes fades altogether.",
      },
      {
        heading: "Structure Without Certainty",
        body: "I'm studying finance, and there's comfort in its structure — the logic that fits. But when I think about the real world of finance, the one beyond the classroom, it doesn't feel so exact. It feels uncertain, layered, full of social and professional nuances that I can never fully prepare for.\n\nAnd that uncertainty can be loud. It whispers that maybe you're behind, or maybe you've missed something everyone else seems to understand. I used to think clarity was something you reached — a moment when everything clicks and you just know. Now I'm starting to think it's something you build, slowly, through experience, mistakes, and quiet reflection.",
      },
      {
        heading: "Closing Thoughts",
        body: "Maybe clarity isn't a destination at all. Maybe it's a side effect of momentum — of showing up, trying, learning, and letting yourself be shaped by what doesn't go as planned.\n\nI still don't have everything figured out. I don't think anyone really does. But I'm learning to be okay with that. There's a strange kind of peace in uncertainty — a reminder that becoming isn't supposed to feel clear. It's supposed to feel real.",
      },
    ],
  },
  {
    slug: "when-inspiration-becomes-too-loud",
    title: "When Inspiration Becomes Too Loud",
    category: "On Creativity",
    date: "Nov 16, 2025",
    postedBy: AUTHOR,
    intro:
      "The internet is loud. Every moment, someone somewhere is uploading a masterpiece.",
    sections: [
      {
        heading: "The Internet Is Loud",
        body: "Every moment, someone somewhere is uploading a masterpiece — a painting that looks effortless, a film sequence that feels cinematic, a brand campaign polished until it gleams. With a single scroll, you can travel through a hundred creative worlds, each one more refined than the last.\n\nFor creatives, this should be beautiful. And sometimes, it is. But there's a quiet side we don't talk about often enough: the way this constant stream of brilliance can make your own work feel small before it has even taken its first breath.",
      },
      {
        heading: "Inspiration vs. Comparison",
        body: "We all start by borrowing — a color palette here, a mood there, a rhythm, a silhouette, a structure. Every creative lineage begins in imitation. It's not failure; it's apprenticeship. Inspiration is the first language we learn.\n\nBut comparison is different. Comparison is what happens when you hold your sketch up against someone else's finished painting, then punish yourself for the difference. It's what creeps in when you forget that every creator you admire has spent years, sometimes decades, finding the thing you're still searching for: their voice.",
      },
      {
        heading: "Voice Cannot Be Rushed",
        body: "It grows slowly, like something learning the shape of its own light. It forms in the quiet — when you're experimenting, failing, trying again, making things that don't look like anything you've seen before, unsure whether they're good but certain they're yours.\n\nThe danger of the internet is that it never pauses long enough for this silence to exist. You see everyone else's clarity before you've had time to explore your own.",
      },
      {
        heading: "Closing Thoughts",
        body: "Your voice isn't one moment of genius. It's a long conversation with yourself. So take inspiration generously — let it challenge you, guide you, fuel you. But give yourself permission to wander without comparing.\n\nYou already have a voice. It's just waiting for you to stop listening to everyone else long enough to hear it.",
      },
    ],
  },
  {
    slug: "this-journal-and-me",
    title: "This Journal, and Me",
    category: "About This Journal",
    date: "Nov 23, 2025",
    postedBy: AUTHOR,
    intro:
      "I've spent the last few entries talking about the creative world. But I haven't properly introduced myself to anyone arriving here for the first time.",
    sections: [
      {
        heading: "I'm Isaiah.",
        body: "I care about making things — websites, visuals, digital experiences, small ideas that turn into bigger projects. I've always been drawn to design, not because I was trained into it, but because it was the first space where trial-and-error felt natural. I learned by doing, by breaking things, by fixing them, by getting curious. Over time, that curiosity turned into a real craft.",
      },
      {
        heading: "Alongside that, I'm pursuing a career in finance.",
        body: "It's not tied to my creative work; it stands on its own. I'm studying at Strathmore University, exploring the field seriously and openly, even if the details of the path aren't fully clear yet. I'm comfortable with that uncertainty — it's part of the process.",
      },
      {
        heading: "Then there's Chaldea Studios.",
        body: "The creative space I'm building. It's early, still forming its identity, but it's where my design work lives with intention. I've begun mentoring a few creatives, slowly shaping a team that I hope will someday be known for producing thoughtful, high-quality work. There's a long road ahead, but the foundation is honest: to build something meaningful, something disciplined, something that gives talented creatives real opportunities.",
      },
      {
        heading: "The purpose of this journal.",
        body: "This space isn't here to present a polished version of me or to list accomplishments. I already have places online that flatten people into profiles — headings, bios, a line of skills, a handful of projects squeezed into rectangles. Useful, but incomplete.",
      },
      {
        heading: "I want this place to be different.",
        body: "I'm writing here to document my growth as it actually happens — the learning, the thinking, the decisions, the shifts in direction. I want this space to serve as a personal home on the internet, one that gives context to the work I do and the intentions behind it.",
      },
      {
        heading: "So if you're new here, welcome.",
        body: "You're joining at a stage where things are still forming. Where I'm still learning, still experimenting, still figuring out what my work — and my voice — will become. Nothing is final here. Nothing is overly polished. It's just an honest record of the journey.",
      },
    ],
  },
  {
    slug: "lessons-from-the-people-around-me",
    title: "Lessons From the People Around Me",
    category: "University",
    date: "Nov 24, 2025",
    postedBy: AUTHOR,
    intro:
      "Before I even stepped onto campus, I had a clear picture of what university would require: focus, discipline, and caution.",
    sections: [
      {
        heading: "Arriving Alone",
        body: "My parents had lived through challenges that showed the cost of influence, and their guidance stayed with me. I internalized it deeply. Their warnings weren't paranoia — they were lessons from experience — and I tried to take them seriously.\n\nEven in high school, I had been largely isolated. Connection didn't come naturally to me. I assumed I didn't have the personality for it, that friendships would either fail or pull me away from what mattered. So I entered university already carrying a habit of being alone.",
      },
      {
        heading: "The first semester didn't feel hard.",
        body: "The material wasn't impossible. I attended classes, took notes, studied. I thought I had understood everything perfectly. But when results came back, they were worse than I expected. That confusion spiralled into frustration and self-doubt.",
      },
      {
        heading: "At the same time, the quiet pressure of expectations weighed heavily.",
        body: "My parents had always guided me with care, but now I felt a new tension. They wanted me to be social, to build relationships, while also staying disciplined and focused. Every time I stumbled, it felt amplified — unbearably loud.",
      },
      {
        heading: "And then I met some people who helped me grow.",
        body: "They weren't flawless role models. They were social yet responsible, outgoing yet thoughtful, confident yet grounded. Being around them challenged the narrative I had built: that connection was dangerous, that friendships could pull me off track.\n\nFrom them, I learned to listen. I learned that influence can be positive. I learned that confidence and discipline can coexist.",
      },
      {
        heading: "I'm still learning.",
        body: "I'm still balancing focus with connection, discipline with flexibility. But I'm no longer confined by the assumptions I held when I arrived. Progress can be quiet, subtle, and guided by those who walk alongside you, not by walls built to keep the world out.",
      },
    ],
  },
  {
    slug: "everyone-is-a-supporting-character-genz",
    title: "“Everyone Is a Supporting Character” · GenZ",
    category: "Culture",
    date: "May 10, 2026",
    postedBy: AUTHOR,
    intro:
      "I watched a video the other day that I haven't been able to stop thinking about. This will be a long one :)",
    sections: [
      {
        heading: "The Quiet Ledger",
        body: "It was about Gen Z — about the ways we've slowly made a particular kind of cowardice feel like wisdom, dressed it up in the language of self-preservation, and then had the nerve to feel proud of ourselves for it. One thing it said that I genuinely could not shake was how transactional we've become with each other. Not obviously — quietly.\n\nThink about the last time a friend paid for something for you. What was your first feeling? Mine wasn't gratitude. It was a low-level mental note — a small unease that I now had something to settle. The pride is the tell. It means somewhere in me, I was keeping score too.",
      },
      {
        heading: "The Easy Version and the Hard One",
        body: "There's a version of transactional thinking that's easy to talk about — the friend who only calls when they need something. That version is easy to recognize and even easier to condemn.\n\nThe harder version lives in people who show up, who give, who genuinely think of themselves as caring friends. It shows up as discomfort when someone pays for you. As a quiet mental note when you do something kind. That's the version most of us are actually living, whether we're ready to say it out loud or not.",
      },
      {
        heading: "I-Thou, I-It, and the Main Character Problem",
        body: "In 1923, Martin Buber wrote about two fundamental ways of relating to other people: I-Thou and I-It. In an I-Thou relationship, you meet another person as a full human being. In an I-It relationship, the other person becomes an object in your story — not because you dislike them, but because your primary relationship is with what they represent to you.\n\n“In the beginning is the relation.” — Martin Buber, I and Thou\n\nWe have a name for it now: main character syndrome. We mostly say it as a joke, and we recognize it because most of us do it, to some degree, without fully admitting it.",
      },
      {
        heading: "Naming It Is Not the Same as Dealing With It",
        body: "Identifying and labeling our emotions is not the end point. It's a road map — the first stop, not the destination. You name the feeling, you find the people who understand it, you receive the validation, and then you remain unchanged — just no longer alone in it, which is comfortable enough that the need to actually move disappears.",
      },
      {
        heading: "What It Actually Looks Like",
        body: "So what does doing better actually look like — not in a TED Talk, but on a regular Tuesday? It looks like replying to the text you've been leaving on read. It looks like letting your friend pay for lunch and just saying thank you, genuinely, without calculating how you'll return it.\n\n“Without you, today's emotions would be the scurf of yesterday's.”\n\nSomeone else building something beautiful is not evidence that you can't. The moment you stop needing other people to be smaller so you can feel okay about your own size — that's when something actually shifts. Our hearts are only given to us once. It would be a real shame to spend them keeping score.",
      },
    ],
  },
];

export function getJournalEntry(slug: string): JournalPost | undefined {
  return JOURNAL.find((p) => p.slug === slug);
}

/** Wraps around, so the last entry points back at the first. */
export function getNextJournalEntry(slug: string): JournalPost {
  const i = JOURNAL.findIndex((p) => p.slug === slug);
  return JOURNAL[(i + 1) % JOURNAL.length];
}
