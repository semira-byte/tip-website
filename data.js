const TIP_DATA = {
  season3: {
    theme: "I'm learning to take care of myself.",
    episodes: [
      {
        number: 1,
        title: "NervousLiy; Stress and the Nervous System",
        description: "What stress is actually doing to your body and organs. The entry point, because everyone's been here.",
        tag: "Biology",
        status: "coming-soon",
        youtubeId: null,
        research: [],
      },
      {
        number: 2,
        title: "MentalLiy; Anxiety and Depression",
        description: "Lived experience, no filter. What it feels like day to day and what actually helps.",
        tag: "Mental Health",
        status: "coming-soon",
        youtubeId: null,
        research: [],
      },
      {
        number: 3,
        title: "CyclicaLiy; The Period Cycle",
        description: "Educational and empowering. Working with your cycle, not against it.",
        tag: "Biology",
        status: "coming-soon",
        youtubeId: null,
        research: [],
      },
      {
        number: 4,
        title: "ConfidentLiy; Finding Self Confidence",
        description: "The messy process of building it, after the inner work has already started.",
        tag: "Lifestyle",
        status: "coming-soon",
        youtubeId: null,
        research: [],
      },
      {
        number: 5,
        title: "PhysicaLiy; Working Out",
        description: "Movement as self care. Ends the season on something actionable and energizing.",
        tag: "Lifestyle",
        status: "coming-soon",
        youtubeId: null,
        research: [],
      },
    ],
  },

  previousEpisodes: [
    { title: "EmotionalLiy; Attachment Styles", youtubeId: "-fE6cG-c4OA", tag: "Lifestyle", season: 2 },
    { title: "HistoricalLiy; It's in Our Genes", youtubeId: "8nbvJ6JfxJI", tag: "Biology", season: 2 },
    { title: "FinancialLiy; Self Care or OverSpending? Between Treating Yourself and Staying Financially Healthy", youtubeId: "N8Bljt9PXPs", tag: "Lifestyle", season: 2 },
  ],

  resources: [
    {
      type: "Book",
      title: "My Grandmother's Hands",
      author: "Resmaa Menakem",
      description: "Racialized trauma and the pathway to mending our hearts and bodies: trauma healing that lives in the body, not just the mind.",
      url: "https://resmaa.com/about-resmaa-menakem/",
      relatedEpisode: 1,
    },
    {
      type: "Book",
      title: "The Unapologetic Guide to Black Mental Health",
      author: "Dr. Rheeda Walker",
      description: "Navigating an unequal system, spotting the signs, and building real tools for emotional wellness.",
      url: "https://www.newharbinger.com/9781684034147/the-unapologetic-guide-to-black-mental-health/",
      relatedEpisode: 2,
    },
    {
      type: "Book",
      title: "From Fibroids to Freedom",
      author: "Tanika Gray Valbrun",
      description: "The White Dress Project founder on fibroids, heavy and painful periods, and reclaiming your cycle.",
      url: "https://www.sheldonpress.co.uk/titles/tanika-gray-valbrun/from-fibroids-to-freedom/9781399817301/",
      relatedEpisode: 3,
    },
    {
      type: "Book",
      title: "Sisters of the Yam",
      author: "bell hooks",
      description: "Black women and self-recovery: how self-care and collective healing are also political acts.",
      url: "https://www.routledge.com/Sisters-of-the-Yam-Black-Women-and-Self-Recovery/hooks/p/book/9781138821682",
      relatedEpisode: 4,
    },
    {
      type: "Book",
      title: "Rest Is Resistance",
      author: "Tricia Hersey",
      description: "The Nap Ministry founder's manifesto on rest as reclamation, not a reward you earn after burning out.",
      url: "https://www.hachettebookgroup.com/titles/tricia-hersey/rest-is-resistance/9780316365536/",
      relatedEpisode: 5,
    },
    {
      type: "Book",
      title: "All About Love",
      author: "bell hooks",
      description: "New visions for what love actually requires: care, commitment, and accountability, not just feeling.",
      url: "https://www.harpercollins.ca/9780060959470/all-about-love/",
      relatedEpisode: null,
    },
    {
      type: "Book",
      title: "What Happened to You?",
      author: "Oprah Winfrey & Dr. Bruce Perry",
      description: "Conversations on trauma, resilience, and healing, reframing 'what's wrong with you' as 'what happened to you.'",
      url: "https://www.panmacmillan.com/authors/oprah-winfrey/what-happened-to-you/9781529068467",
      relatedEpisode: null,
    },
    {
      type: "Book",
      title: "The Body Keeps the Score",
      author: "Bessel van der Kolk",
      description: "How trauma reshapes the body and brain.",
      url: "https://www.besselvanderkolk.com/resources/the-body-keeps-the-score",
      relatedEpisode: null,
    },
  ],

  guides: [
    {
      id: "cycle-tracking",
      title: "A Guide to Tracking Your Cycle",
      tag: "Biology",
      relatedEpisode: 3,
      description: "The four phases of your cycle, what's actually happening in each one, and how to start tracking it yourself.",
      sections: [
        {
          heading: "Why bother tracking it",
          body: "Your cycle isn't just \"the week you bleed.\" It's a roughly month-long loop of hormonal shifts that affect your energy, mood, appetite, skin, sleep, and motivation, whether you're paying attention to it or not. Tracking it isn't about optimizing yourself into a perfect schedule. It's about noticing the pattern so the hard weeks stop feeling random.",
        },
        {
          heading: "Phase 1: Menstrual (roughly days 1 to 5)",
          body: "Day 1 is the first day of bleeding. Estrogen and progesterone are at their lowest, which is part of why energy tends to dip here. This is a normal low point, not a personal failing. Rest, gentler movement, and lower-key plans tend to fit this phase better than pushing hard.",
        },
        {
          heading: "Phase 2: Follicular (roughly days 1 to 13)",
          body: "Overlaps with the tail end of your period and runs until ovulation. Estrogen starts climbing, and for a lot of people energy, focus, and motivation climb with it. This is often a good window for starting new projects, harder workouts, or plans that take more social energy.",
        },
        {
          heading: "Phase 3: Ovulatory (roughly days 14 to 16)",
          body: "Estrogen peaks and an egg is released. Energy and confidence are often at their highest here. Cervical mucus typically becomes clearer and stretchier around this window, one of the more reliable physical cues if you're paying attention to your body's signals.",
        },
        {
          heading: "Phase 4: Luteal (roughly days 15 to 28)",
          body: "Progesterone rises then drops sharply if there's no pregnancy, which is what triggers your period. The first half of this phase can feel steady. The last few days (classic PMS territory) are when mood dips, cravings, bloating, and irritability tend to show up. Naming it as \"late luteal\" instead of \"something's wrong with me\" changes a lot.",
        },
        {
          heading: "How to actually start tracking",
          body: "You don't need anything fancy: <ul><li>Mark day 1 (first day of bleeding) every cycle. This is your anchor point.</li><li>Jot down energy, mood, and any symptoms daily, even in one word.</li><li>Note cycle length (day 1 to the next day 1) for a few months to find your personal average. \"28 days\" is a population average, not a rule.</li><li>Look back after 2 to 3 cycles for patterns, not after 2 to 3 days.</li></ul>",
        },
        {
          heading: "One honest note",
          body: "This is general education, not medical advice. Cycles vary a lot between people and that's normal. If your periods are irregular, extremely painful, or something feels off, that's worth an actual conversation with a doctor, not just a tracking app. <em>From Fibroids to Freedom</em> on the Resources page is a good next read if pain or heavy bleeding is part of your story.",
        },
      ],
    },
    {
      id: "panic-attacks",
      title: "A Guide to Getting Through a Panic Attack",
      tag: "Mental Health",
      relatedEpisode: 2,
      description: "What's actually happening in your body during a panic attack, how to tell it apart from an emergency, and what to do in the moment.",
      sections: [
        {
          heading: "What's actually happening",
          body: "A panic attack is your body's fight-or-flight response firing at full volume with no real threat to respond to. Your heart races, your breathing gets fast and shallow, adrenaline floods your system, and your brain reads all of that as \"something is very wrong,\" which makes the panic feel even more real. It's miserable, but it's not dangerous on its own. Most panic attacks peak within about 10 minutes and pass on their own even if you do nothing.",
        },
        {
          heading: "How to tell it apart from an emergency",
          body: "Common signs of a panic attack: racing heart, chest tightness, shortness of breath, dizziness, trembling, sweating, a feeling of unreality, and a sudden wave of fear or dread. That said, chest pain can also mean something else entirely. If this is your first one, if the chest pain is severe, or if something just feels different from your usual pattern, treat it like a medical emergency and get checked out. It's always okay to be wrong about that in the safe direction.",
        },
        {
          heading: "What actually helps in the moment",
          body: "You don't need to make the fear disappear. You need to ride it out. A few things that genuinely help: <ul><li><strong>Slow your exhale.</strong> Breathe in for 4 counts, hold for 4, out for 8. A longer exhale tells your nervous system it's safe to calm down.</li><li><strong>5-4-3-2-1 grounding.</strong> Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste. It pulls your brain out of the spiral and into the room you're actually in.</li><li><strong>Cold water or an ice cube.</strong> Splashing cold water on your face or holding ice triggers a reflex that can slow your heart rate down.</li><li><strong>Sour candy.</strong> An intensely sour taste is a sharp sensory jolt that can pull your brain out of the spiral, the same idea as the ice cube, just easier to keep in your bag.</li><li><strong>Say it out loud.</strong> \"I'm having a panic attack. It's not dangerous. It will pass.\" Naming it takes some of its power away.</li></ul>",
        },
        {
          heading: "Don't fight it",
          body: "The instinct is to panic about the panic, to fight the racing heart and the shortness of breath like they're the enemy. That fight is usually what stretches a 10-minute attack into a 30-minute one. Letting the sensations be there without adding a second layer of fear on top tends to shorten it, even though it feels backwards in the moment.",
        },
        {
          heading: "After it passes",
          body: "You're going to be tired, maybe a little shaky or foggy. That's normal, your body just ran a sprint it didn't need to run. Drink some water, rest if you can, and skip the instinct to immediately analyze what caused it. That conversation can happen later, when you're not still coming down from the adrenaline.",
        },
        {
          heading: "When to get more support",
          body: "One panic attack isn't a diagnosis. But if they're becoming frequent, if you're rearranging your life to avoid situations that might trigger one, or if the fear of the next one is its own constant presence, that's worth bringing to an actual professional. Therapy (especially CBT) and medication are both legitimate, common tools here, not a last resort.",
        },
        {
          heading: "One honest note",
          body: "This is general education, not medical advice. Everyone's experience of panic and anxiety looks a little different. <em>The Unapologetic Guide to Black Mental Health</em> on the Resources page is a good next read if you want to go deeper.",
        },
      ],
    },
    {
      id: "nervous-system",
      title: "A Guide to Calming Your Nervous System",
      tag: "Biology",
      relatedEpisode: 1,
      description: "Fight, flight, freeze, and fawn, why chronic stress feels different from a single scary moment, and a few techniques that actually shift your body out of it.",
      sections: [
        {
          heading: "The two modes your body runs on",
          body: "Your nervous system is basically split into two settings. Sympathetic is your gas pedal: fight, flight, alertness, adrenaline. Parasympathetic is your brake: rest, digest, repair. Neither one is good or bad. The problem isn't having a gas pedal, it's a system that's stuck pressing it long after the thing you were reacting to is gone.",
        },
        {
          heading: "Fight, flight, freeze, and fawn",
          body: "Fight and flight get most of the attention, but they're not the only stress responses. Freeze is shutting down, going numb, or feeling stuck when you're overwhelmed. Fawn is people-pleasing your way out of a threat, agreeing and appeasing to make the danger stop. If your stress response has never looked like yelling or running, that doesn't mean you don't have one. Freeze and fawn are just as real.",
        },
        {
          heading: "Acute stress vs chronic stress",
          body: "Acute stress is a single scary moment that resolves once the threat passes: your heart rate spikes, then comes back down. Chronic stress is your body staying in that activated state for weeks or months because the pressure (work, money, relationships, just existing) never fully lets up. That's the version that actually wears down your health over time, not the one-time scare.",
        },
        {
          heading: "What actually shifts you out of it",
          body: "A few things that genuinely help move you from sympathetic back to parasympathetic: <ul><li><strong>A long, slow exhale.</strong> Breathing out longer than you breathe in is one of the most direct signals to your body that it's safe to stand down.</li><li><strong>Humming, singing, or gargling.</strong> These all engage the vagus nerve through your vocal cords and throat, which helps trigger the calming response.</li><li><strong>Movement.</strong> Stress hormones are meant to be burned off by physical action. A walk, shaking out your hands, even pacing can help complete the stress cycle instead of leaving it stuck in your body.</li><li><strong>Safe touch or co-regulation.</strong> A hug, a hand on your chest, sitting near someone calm. Your nervous system reads other people's state as information about how safe the room is.</li></ul>",
        },
        {
          heading: "The goal isn't zero stress",
          body: "You're not trying to eliminate stress completely, that's not realistic or even healthy. The actual goal is building your capacity to recover from it: to move through activation and back to baseline instead of living permanently switched on.",
        },
        {
          heading: "One honest note",
          body: "This is general education, not medical advice. If you're dealing with chronic pain, panic, or a stress response that feels constant, that's worth bringing to an actual professional. <em>My Grandmother's Hands</em> on the Resources page is a good next read on how trauma lives in the body.",
        },
      ],
    },
    {
      id: "self-confidence",
      title: "A Guide to Building Real Self-Confidence",
      tag: "Lifestyle",
      relatedEpisode: 4,
      description: "Why confidence is built through small proof of competence over time, not felt first, and what to actually do instead of waiting to feel ready.",
      sections: [
        {
          heading: "Confidence is a byproduct, not a starting point",
          body: "Most people wait to feel confident before they act. It works the other way around. You act, even badly, and the evidence from that action is what actually builds confidence. Waiting to feel ready first is why so many people stay stuck.",
        },
        {
          heading: "The competence loop",
          body: "It looks like this: you take a small action, you get some kind of proof it went okay (or that you survived it not going perfectly), that proof makes you slightly more willing to try the next thing, and you repeat. Confidence is the compounding result of that loop, not something you can shortcut by thinking positively.",
        },
        {
          heading: "Comparison breaks the loop before it starts",
          body: "Comparing your beginning to someone else's middle (or someone's highlight reel) makes the first small action feel pointless before you've even taken it. Their proof isn't your proof. The loop only works if you're building your own evidence, at your own starting point.",
        },
        {
          heading: "Start absurdly small",
          body: "If the action you're avoiding feels big, you've picked the wrong size. Shrink it until it feels almost too easy to count. The point isn't the size of the action, it's giving yourself a fast, low-stakes win to build the next one on.",
        },
        {
          heading: "Self-compassion, not self-esteem",
          body: "Self-esteem says \"I'm good at this.\" Self-compassion says \"I'm allowed to be bad at this while I learn it.\" The second one is a much sturdier foundation, because it doesn't collapse the moment you have an off day.",
        },
        {
          heading: "One honest note",
          body: "This is general education, not a replacement for support if confidence and self-worth are tangled up with something deeper. <em>Sisters of the Yam</em> on the Resources page is a good next read on self-recovery as an ongoing practice, not a fixed destination.",
        },
      ],
    },
    {
      id: "exercise-habit",
      title: "A Guide to Making Exercise Actually Stick",
      tag: "Lifestyle",
      relatedEpisode: 5,
      description: "Movement as self care instead of punishment, why waiting for motivation backfires, and how to build a habit that survives a bad week.",
      sections: [
        {
          heading: "Stop waiting for motivation",
          body: "Motivation is unreliable by nature, it shows up after you start, not before. Waiting for it before you move is why so many habits die in the first two weeks. The people who stick with it aren't more motivated, they've just stopped requiring motivation as a precondition.",
        },
        {
          heading: "Movement as self-care, not penance",
          body: "If exercise only exists in your head as punishment for what you ate or a number you're trying to shrink, it's fighting an uphill battle against your own motivation every single time. Reframing it around how it makes you feel and function, more energy, better sleep, a clearer head, gives you a reason to come back that has nothing to do with punishment.",
        },
        {
          heading: "Habit stacking",
          body: "Attach the new habit to something you already do without thinking. \"After I pour my morning coffee, I put on my shoes.\" The existing habit becomes the reminder, so you're not relying on memory or willpower to start.",
        },
        {
          heading: "Make the minimum version stupidly easy",
          body: "Decide in advance what the smallest version of \"it still counts\" looks like: a 10 minute walk, five minutes of stretching, one set of push-ups. All-or-nothing thinking is what turns a missed hour-long workout into a missed week.",
        },
        {
          heading: "Plan for the bad week before it happens",
          body: "Life will interrupt this. Decide now, while you're thinking clearly, what restarting looks like after a missed day. Missing one day isn't failure. Not having a plan to pick back up is what actually ends the habit.",
        },
        {
          heading: "One honest note",
          body: "This is general education, not personal training or medical advice, check with a doctor before starting something new if you have any underlying conditions. <em>Rest Is Resistance</em> on the Resources page is a good counterbalance read, movement matters, but so does knowing when to stop pushing.",
        },
      ],
    },
    {
      id: "depression-symptoms",
      title: "A Guide to Depression's Quieter Symptoms",
      tag: "Mental Health",
      relatedEpisode: 2,
      description: "Depression doesn't always look like visible sadness. It often looks like low energy, numbness, or irritability instead, and recognizing that is the first step.",
      sections: [
        {
          heading: "It doesn't always look like crying",
          body: "The common picture of depression is someone visibly sad. In reality it often shows up as exhaustion, brain fog, flatness, or losing interest in things that used to matter to you (a symptom with an actual clinical name: anhedonia). None of that looks dramatic from the outside, which is part of why it gets missed, including by the person living it.",
        },
        {
          heading: "The energy tax on small things",
          body: "Showering, replying to a text, cooking a meal, tasks that used to take no thought at all suddenly feel disproportionately heavy. That's a real symptom of depression, not a character flaw or laziness. The effort required for basic things going up is data, not a moral failing.",
        },
        {
          heading: "Numbness counts too",
          body: "You don't have to feel sad for it to be depression. Feeling nothing, feeling disconnected from your own life, or watching yourself go through the motions without really being present are all part of the same picture.",
        },
        {
          heading: "Sometimes it looks like irritability",
          body: "For a lot of people, depression doesn't present as sadness at all, it shows up as a short temper, restlessness, or snapping at people over small things. If you've been told you seem \"angry\" more than \"sad,\" that's still worth paying attention to.",
        },
        {
          heading: "What an actual first step looks like",
          body: "It doesn't have to start with therapy. It can start with telling one person what's actually going on, seeing a doctor to rule out physical causes like thyroid issues, or picking one small routine anchor (a consistent wake time, one meal you actually sit down for) to hold onto while everything else feels harder than usual.",
        },
        {
          heading: "One honest note",
          body: "This isn't a diagnostic tool, and it's not a replacement for actual care. If this sounds like what you've been experiencing, that's worth bringing to a professional. <em>What Happened to You?</em> on the Resources page is a good next read on where a lot of this can come from in the first place.",
        },
      ],
    },
    {
      id: "boundaries",
      title: "A Guide to Setting Boundaries",
      tag: "Lifestyle",
      relatedEpisode: null,
      description: "What a boundary actually is versus an ultimatum, and how to hold one without over explaining or apologizing for it.",
      sections: [
        {
          heading: "A boundary is not a punishment",
          body: "A boundary is information about what you will do. It's not a demand about what someone else must do. \"I won't continue this conversation if you raise your voice\" is a boundary. It describes your own next move, not a requirement you're placing on the other person.",
        },
        {
          heading: "Boundary vs ultimatum",
          body: "\"You need to change or else\" is aimed at controlling someone else, that's an ultimatum. \"I'm going to leave the room if this continues\" is aimed at your own actions, that's a boundary. The difference is who the sentence is actually about.",
        },
        {
          heading: "You don't need a perfect explanation",
          body: "Over-explaining a boundary invites the other person to negotiate with your reasoning instead of respecting the boundary itself. A boundary doesn't require anyone's approval to be valid. \"That doesn't work for me\" is a complete sentence.",
        },
        {
          heading: "Expect pushback the first few times",
          body: "People who benefited from you having no boundaries will often test a new one, sometimes without even realizing they're doing it. That pushback is expected friction, not proof that the boundary was wrong or unreasonable.",
        },
        {
          heading: "Start with the low-stakes ones",
          body: "Practice on smaller boundaries, a coworker, a group chat, a casual acquaintance, before you take one to the highest-stakes relationship in your life. The skill is the same either way, and it's easier to build with less on the line.",
        },
        {
          heading: "One honest note",
          body: "This is general education, not a substitute for support if boundary-setting is tangled up with a genuinely unsafe relationship. <em>All About Love</em> on the Resources page is a good next read on what care actually requires.",
        },
      ],
    },
  ],
};
