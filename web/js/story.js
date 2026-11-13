/* story.js — ALL the words in the game: personas, levels, acts, thoughts, screens and endings.
   You can edit this file in any text editor. Nothing else needs to change.

   HOW IT IS ORGANISED
     STORY.personas   the three people you can play
     STORY.levels     two levels, each with four acts and an ending
     an act           one room: a title card, the objects you can use ("things"), and the way out
     a thing          one object: its label, whether it is required, and the steps that play when you press E

   STEPS (what happens when the player uses an object)
     { n: 'text' }                                  narration, no speaker
     { t: { david: '...', elena: '...' } }          the persona's thought. A persona with no line skips the step.
     { s: 'Associate', text: '...' }                someone else speaks
     { choice: { prompt, options: [{ label, then: [steps], set: { pick: 'shelf' } }] } }
     { screen: { kind: 'browser' | 'phone' | 'paper', ... } }   an overlay
     { fn: state => [steps] }                       steps that depend on what happened earlier

   Any text can be a plain string, an object keyed by persona ({ david: '...', elena: '...', _: 'anyone else' }),
   or a function of state. `state.pick` is what the player chose in the store.

   `stages` lines only record which journey stage an object stands for. They are never shown in the game.
   Keep lines short: a level should take about five minutes. After editing, run the checks (see README). */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------
     LEVEL 1 FACTS — real names and numbers from the team's research,
     checked on 22 Oct 2026. Re-check them before the installation and
     edit them here; every screen in Level 1 reads from this block.
     Three thoughts describe the gap in words and are NOT updated from here:
     "half the price", "$150 less" (twice) and "the Arc is the Highline".
     Search for them if the prices or names change.
     ------------------------------------------------------------------ */
  var FACTS = {
    checked: '22 Oct 2026',
    kohlerSite: { model: 'Highline', number: 'K-43999', price: '$343.57', reviews: '32' },
    homeDepot: { model: 'Highline Arc', number: 'K-78253-0', price: '$189', reviews: '14,800', stock: '5 in stock, pickup today', aisle: 'Aisle 25, Bay 006' },
    lowes: { model: 'Elliston', price: '$269' },
    findOnDisplay: "We're sorry, but this product is not available on display near you."
  };
  var K = FACTS.kohlerSite, HD = FACTS.homeDepot, LW = FACTS.lowes;
  /* The other brands are invented. No real competitor is named. */
  var CHEAP = { name: 'Tidewell', price: '$129', reviews: '9,200' };

  var STORY = {
    title: 'The Kohler Customer Journey',
    subtitle: 'Five minutes in a customer\'s shoes, buying for a bathroom the way it works today.',
    facts: FACTS,

    /* Interface words. */
    ui: {
      start: 'Press Enter to begin',
      chooseLevel: 'Choose a journey',
      choosePersona: 'Who are you today?',
      minutes: 'About {n} minutes',
      at: 'Nearest store: {store}',
      back: 'Esc: back',
      hint: 'Walk with WASD or the arrow keys. Press E at a gold marker.',
      exitLabel: 'Leave',
      locked: 'Not yet. Something else comes first.',
      notYet: 'Not yet.',
      close: 'Press E to close',
      paused: 'Paused',
      resume: 'Resume',
      restart: 'Restart level',
      mainMenu: 'Main menu',
      endPrompt: 'Press Enter to choose another journey'
    },

    personas: {
      maya: {
        name: 'Maya', age: 38, look: 'maya',
        role: 'Dual-income homeowner, one young child',
        tagline: '"I want it to feel like a spa, but I don\'t want to redo it in 15 years."',
        trigger: { project: 'She has outgrown her starter bathroom and has planned this renovation for a year.' }
      },
      david: {
        name: 'David', age: 52, look: 'david',
        role: 'Mid-career, a son in college, a mother in her late 70s',
        tagline: '"She\'d never admit she needs it. I just don\'t want her to feel like she\'s in a hospital."',
        trigger: { breaks: 'A scare in his mother\'s bathroom, twenty minutes from his own home.' }
      },
      elena: {
        name: 'Elena', age: 55, look: 'elena',
        role: 'Founder. Tracks her sleep, strength and bloodwork',
        tagline: '"If it helps me keep doing this on my own for 30 more years, I\'ll pay for it."',
        trigger: {
          breaks: 'Five days ago she slipped on a leaking bathroom floor and hurt her hip.',
          project: 'A milestone birthday, and a plan to be strong and independent at 85.'
        }
      }
    },

    levels: [

      /* ================================================================
         LEVEL 1 — WHEN IT BREAKS (David or Elena, Home Depot)
         ================================================================ */
      {
        id: 'breaks',
        name: 'When It Breaks',
        pitch: 'A fixture fails. You need it solved soon. Repair it, replace it, or call someone?',
        minutes: 5,
        personas: ['david', 'elena'],
        store: 'Home Depot',

        acts: [
          /* ---------- Act 1: Bathroom (old, leaking) ---------- */
          {
            room: 'bathroom', variant: 'old',
            chip: { david: 'Mom\'s bathroom', elena: 'Your bathroom' },
            card: { time: 'Tuesday, 6:48 AM', line: { david: 'Your mother\'s house, before work.', elena: 'Your bathroom. Day five of the leak.' } },
            stages: [],
            intro: [
              { t: { david: 'Mom said it was "a little damp". This is not a little damp.',
                     elena: 'Five days since I slipped in here. The bruise is fading. The leak is not.' } }
            ],
            things: {
              toilet: {
                label: 'Toilet', req: true, stages: ['Trigger'],
                steps: [
                  { n: 'The toilet rocks when you press on it. Water is pooling at the base.' },
                  { t: { david: 'She nearly went down right here. She would never tell me how close it was.',
                         elena: 'One wet floor, and I was on the ground. That is how fast it can go.' } }
                ]
              },
              toolbox: {
                label: 'Toolbox', req: true, after: ['toilet'], stages: ['Hesitation'],
                locked: 'Look at the toilet first.',
                steps: [
                  { n: 'You tighten both bolts. The rocking stops. A minute later, a slow drip is back.' },
                  { t: { david: 'Fix it or replace it? I have one free Saturday and no idea which is right.',
                         elena: 'Repair or replace. I want evidence, not a guess. I have neither.' } }
                ]
              },
              puddle: {
                label: 'Wet towels', stages: ['Trigger'],
                steps: [
                  { n: 'Soaked towels. The water has worked its way into the grout.' },
                  { t: { david: 'She has been mopping this up on her own. For how long?',
                         elena: 'I have stepped around this for five days. That is not a plan.' } }
                ]
              },
              vanity: {
                label: 'Sink', stages: ['Trigger'],
                steps: [
                  { n: 'A chipped basin. A faucet that drips to its own beat.' },
                  { t: { david: 'Everything in here is the same age. If one thing goes, the rest will follow.',
                         elena: 'All of it went in the same year. This will not be the last failure.' } }
                ]
              }
            },
            needs: ['toilet', 'toolbox'],
            exit: 'door',
            notYet: 'Not yet. Look at the toilet and try the toolbox.',
            leave: [
              { t: { david: 'I can\'t solve this before work. Tonight.', elena: 'Tonight I do the research.' } }
            ]
          },

          /* ---------- Act 2: Home ---------- */
          {
            room: 'home',
            chip: { david: 'Mom\'s living room', elena: 'Your living room' },
            card: { time: 'That evening', line: { david: 'Your mother\'s living room.', elena: 'Your living room.' } },
            stages: [],
            things: {
              laptop: {
                label: 'Laptop', req: true, stages: ['Inspiration', 'First Search', 'Compare Online'],
                steps: [
                  { screen: {
                    kind: 'browser',
                    tabs: ['toilet leaking at base', 'repair or replace toilet?', 'best toilets 2026', 'Kohler ' + K.model, 'wax ring sizes'],
                    query: 'toilet leaking at base fix or replace',
                    results: [
                      { tag: 'Sponsored', sponsored: true, site: 'homedepot.com', title: CHEAP.name + ' 2-Piece Toilet, Top Rated', line: 'Pickup today. ' + CHEAP.reviews + ' reviews.', price: CHEAP.price },
                      { tag: 'Video', site: 'youtube.com', title: 'Fix a leaking toilet base in 15 minutes', line: '"If the flange is cracked, stop here."' },
                      { tag: 'Sponsored', sponsored: true, site: 'A review site', title: 'The 7 best toilets of 2026, ranked', line: 'We may earn a commission from these links.' },
                      { site: 'amazon.com', title: 'Aldermere Elongated Toilet, Amazon\'s Choice', line: 'Arrives Thursday. A seller you have not heard of.', price: '$142' },
                      { tag: 'Forum', site: 'reddit.com', title: 'Leaking at the base. Wax ring or new toilet?', line: '43 replies. They do not agree.' },
                      { site: 'kohler.com', title: 'Kohler ' + K.model + ' toilet', line: K.reviews + ' reviews. About two weeks by truck, left at the curb. No installation offered.', price: K.price }
                    ]
                  } },
                  { t: { david: 'If I\'m replacing it anyway, I want the Kohler. Solid, a better height for her. It is also two weeks away.',
                         elena: 'If I replace it, I buy the one built to last. That is the Kohler: ' + K.reviews + ' reviews, two weeks by truck.' } },
                  { t: { david: 'Mom can\'t mop for two more weeks. Can I get that one nearby?',
                         elena: 'I am not stepping around a puddle for two more weeks. Is it in a store?' } }
                ]
              },
              phone: {
                label: 'Phone', req: true, after: ['laptop'], stages: ['Check Stock & Plan'],
                locked: 'You have not searched yet. Try the laptop.',
                steps: [
                  { screen: {
                    kind: 'phone', app: 'The Home Depot', head: 'Toilets near you',
                    rows: [
                      { title: 'Kohler ' + HD.model, line: HD.price + '. ' + HD.reviews + ' reviews. ' + HD.aisle + '.', badge: HD.stock, tone: 'ok' },
                      { title: CHEAP.name + ' 2-Piece', line: CHEAP.price + '. ' + CHEAP.reviews + ' reviews.', badge: 'In stock today', tone: 'ok' },
                      { title: 'Kohler ' + K.model, line: 'The one you saved from kohler.com.', badge: 'No results', tone: 'bad' }
                    ],
                    foot: 'Lowe\'s lists a Kohler "' + LW.model + '" at ' + LW.price + '. Kohler\'s Find on Display says: "' + FACTS.findOnDisplay + '"'
                  } },
                  { t: { david: K.model + '. ' + HD.model + '. ' + LW.model + '. Is that one toilet or three?',
                         elena: 'Three names, three prices. The same toilet? Nothing here tells me.' } }
                ]
              },
              fridge: {
                label: 'Card on the fridge', stages: ['Hesitation'],
                steps: [
                  { screen: { kind: 'paper', title: 'Harlan & Sons Plumbing', lines: ['Earliest visit: next Thursday.', 'Diagnostic fee: $95, before any work.', 'We supply and fit our own fixtures.'] } },
                  { choice: {
                    prompt: 'Call the plumber, or do it yourself?',
                    options: [
                      { label: 'Book the plumber for next Thursday', set: { plumber: true },
                        then: [{ t: { david: 'Nine more days of towels on her floor. And he fits whatever is on his truck.',
                                      elena: 'Nine more days, a fee to look at it, and he picks the brand.' } }] },
                      { label: 'Do it myself this weekend',
                        then: [{ t: { david: 'Saturday, then. I have watched exactly one video.',
                                      elena: 'I can lift it. Whether I should, with this hip, is another question.' } }] }
                    ]
                  } }
                ]
              },
              tablet: {
                label: 'Tablet', stages: ['Inspiration'],
                steps: [
                  { n: 'Saved photos of finished bathrooms. Some look calm. Some look like a clinic.' },
                  { t: { david: 'She would hate the ones that look like a clinic. So would I.',
                         elena: 'I want the first kind. The search results keep offering the second.' } }
                ]
              },
              mother: {
                label: 'Mom', only: 'david', stages: ['Hesitation'],
                steps: [
                  { s: 'Mom', text: 'It\'s just a toilet, David. Don\'t make a fuss.' },
                  { t: { david: 'She\'d never admit she needs it. I just don\'t want her to feel like she\'s in a hospital.' } }
                ]
              },
              training: {
                label: 'Training log', only: 'elena', stages: ['Hesitation'],
                steps: [
                  { n: 'Sleep score: 84. Deadlift: up five pounds this month.' },
                  { t: { elena: 'I track everything that protects my independence. Except this room.' } }
                ]
              }
            },
            needs: ['laptop', 'phone'],
            exit: 'door',
            notYet: 'You do not have an answer yet. Try the laptop, then the phone.',
            leave: [
              { t: { david: 'Home Depot is ten minutes from here. Saturday morning.',
                     elena: 'The big-box store is ten minutes away. Saturday.' } }
            ]
          },

          /* ---------- Act 3: Store (Home Depot) ---------- */
          {
            room: 'store',
            chip: 'Home Depot',
            card: { time: 'Saturday, 9:40 AM', line: 'Home Depot. ' + HD.aisle + '.' },
            stages: ['Go to the Store'],
            intro: [
              { n: 'Ten minutes from the door. The bath aisle is at the back of the store.' }
            ],
            things: {
              display: {
                label: 'Toilet display', req: true, stages: ['See Kohler on Display'],
                steps: [
                  { n: 'Eleven toilets. Five are still in boxes. None is plumbed in.' },
                  { t: { david: 'I can\'t sit on a box. Which one is easy for her to stand up from?',
                         elena: 'Height, flush, footprint. I cannot test one of them from here.' } }
                ]
              },
              kohler: {
                label: 'Kohler shelf', req: true, stages: ['See Kohler on Display'],
                steps: [
                  { n: 'One Kohler box: ' + HD.model + ', ' + HD.number + '. The one you saved says ' + K.model + ', ' + K.number + '.' },
                  { t: { david: 'A different name, a different number, half the price. The same toilet, or the cheap version?',
                         elena: 'A different model number, $150 less. A bargain or a lesser product. The box does not say.' } }
                ]
              },
              associate: {
                label: 'Associate', req: true, stages: ['Ask an Associate'],
                steps: [
                  { choice: {
                    prompt: 'What do you ask?',
                    options: [
                      { label: 'Is the ' + HD.model + ' the same as the ' + K.model + ' online?',
                        then: [{ s: 'Associate', text: 'Honestly? I\'m in lighting today. If it says Kohler on the box, it\'s a Kohler.' }] },
                      { label: 'Which of these is easiest to live with?',
                        then: [{ s: 'Associate', text: 'They all flush about the same. That one sells a lot.' }] }
                    ]
                  } },
                  { t: { david: 'He is being kind. He does not know.', elena: 'A polite non-answer. I am on my own.' } }
                ]
              },
              shopper: {
                label: 'Another shopper', stages: ['Decide'],
                steps: [
                  { s: 'Another shopper', text: 'Mine broke Thursday. I just grabbed whatever was in stock.' },
                  { t: { david: 'That is most of us, I suppose.', elena: 'That is how most of these get chosen.' } }
                ]
              },
              shelf: {
                label: 'Make a choice', req: true, after: ['display', 'kohler', 'associate'], stages: ['Decide', 'Buy & Arrange Install'],
                locked: 'You are not ready to choose. Look at the displays and ask someone.',
                steps: [
                  { choice: {
                    prompt: 'Three ways to end this.',
                    options: [
                      { label: 'Order the ' + K.model + ' from kohler.com. ' + K.price + ', about two weeks.', set: { pick: 'kohlercom' },
                        then: [
                          { n: 'Ordered on your phone, standing in the aisle. Delivery: curbside, in about two weeks.' },
                          { t: { david: 'Two more weeks of towels on Mom\'s floor.', elena: 'Two more weeks of stepping around it.' } }
                        ] },
                      { label: 'Take the ' + HD.model + ' off this shelf. ' + HD.price + ', today.', set: { pick: 'shelf' },
                        then: [
                          { n: 'The box is heavy and awkward. It only just fits in the cart.' },
                          { t: { david: 'It says Kohler. I hope that is enough.', elena: 'I am buying a name and a guess.' } }
                        ] },
                      { label: 'Take the ' + CHEAP.name + '. ' + CHEAP.price + ', today.', set: { pick: 'other' },
                        then: [
                          { n: 'The box goes in the cart. It weighs less than you expected.' },
                          { t: { david: 'It\'s fine. It\'s a toilet. It\'s fine.', elena: 'Cheapest and fastest. I did exactly what the search results wanted.' } }
                        ] }
                    ]
                  } }
                ]
              }
            },
            needs: ['display', 'kohler', 'associate', 'shelf'],
            exit: 'door',
            notYet: 'You came here to leave with an answer.',
            leave: [
              { n: 'You leave with an empty cart and a confirmation email. It says "curbside".', when: function (s) { return s.pick === 'kohlercom'; } },
              { n: 'At checkout, a sign: "Need this installed? Call us." A phone number, not a date.', when: function (s) { return s.pick !== 'kohlercom'; } }
            ]
          },

          /* ---------- Act 4: Bathroom (install) ---------- */
          {
            room: 'bathroom', variant: 'old', final: true,
            chip: { david: 'Mom\'s bathroom', elena: 'Your bathroom' },
            card: {
              time: function (s) { return s.pick === 'kohlercom' ? 'Two weeks later' : 'Sunday, 4:15 PM'; },
              line: { david: 'Your mother\'s bathroom.', elena: 'Your bathroom.' }
            },
            stages: [],
            intro: [
              { n: 'The truck left the box at the curb. Getting it up the steps was your job.', when: function (s) { return s.pick === 'kohlercom'; } }
            ],
            things: {
              box: {
                label: 'Box', req: true, stages: ['Buy & Arrange Install'],
                steps: [
                  { n: 'Inside: the toilet, two bolts and a 14-page manual. No wax ring.' },
                  { t: { david: 'Back to the store, then. For a part nobody mentioned.',
                         elena: 'A second trip for a three-dollar part nobody mentioned.' } }
                ]
              },
              valve: {
                label: 'Water valve', req: true, after: ['box'], stages: ['Install & Live With It'],
                locked: 'Open the box first.',
                steps: [
                  { n: 'Water off, tank drained. You lift the old toilet out and try not to think about your back.' },
                  { t: { david: 'If I crack the flange, this becomes a plumber and another week.',
                         elena: 'Sixty pounds, a bruised hip and no second pair of hands.' } }
                ]
              },
              toilet: {
                label: function (s) { return s.done.valve ? 'New toilet' : 'Old toilet'; },
                req: true, after: ['valve'], stages: ['Install & Live With It'],
                locked: 'The water is still on.',
                steps: [
                  { n: 'New ring, new toilet, bolts snug. You open the valve and flush. It holds.' },
                  { t: { david: 'A dry floor. Did I get her the right one, or just a new one?',
                         elena: 'It works. Whether it was the right one, I may never have the data.' } }
                ]
              },
              manual: {
                label: 'Manual', stages: ['Install & Live With It'],
                steps: [
                  { n: 'Care instructions in four languages. A QR code to register the product.' },
                  { t: { david: 'Nothing about whether it is easier for her to stand up from.',
                         elena: 'It wants my email before it tells me anything.' } }
                ]
              }
            },
            needs: ['box', 'valve', 'toilet'],
            exit: 'door',
            notYet: 'The old toilet is still leaking. Start with the box.',
            leave: []
          }
        ],

        /* Three lines: what it took, how it sits with them, and what the purchase left them wondering. */
        ending: function (s) {
          var waited = s.pick === 'kohlercom';
          if (s.personaId === 'david') {
            return [
              waited ? 'It works. It took two weeks, a box at the curb and one more trip for a wax ring.'
                     : 'It works. It took a weekend, a second guess and two trips to the store.',
              'Mom has not said a word about it. From her, that means it is fine.',
              { kohlercom: 'I got the one I wanted. She mopped that floor for two more weeks so I could.',
                shelf: 'I still do not know if the Arc is the Highline. Nobody could tell me.',
                other: 'I bought the one that was there. I will never know if the other was better for her.' }[s.pick]
            ];
          }
          return [
            waited ? 'It holds. It cost me two more weeks around a puddle and a box left at the curb.'
                   : 'It holds. It cost me a weekend and a second trip for a part nobody mentioned.',
            'I track my sleep, my strength and my bloodwork. I chose this on a guess.',
            { kohlercom: 'I paid the most and waited the longest for the one I trusted. Nothing on the way made that easy.',
              shelf: 'The same name, a different number, $150 less. I still cannot tell you what I bought.',
              other: 'I bought what was in stock. That is not how I decide anything else.' }[s.pick]
          ];
        }
      },

      /* ================================================================
         LEVEL 2 — THE BIG PROJECT (Maya or Elena, Lowe's)
         ================================================================ */
      {
        id: 'project',
        name: 'The Big Project',
        pitch: 'A renovation you have wanted for a long time. Where do you even start?',
        minutes: 5,
        personas: ['maya', 'elena'],
        store: 'Lowe\'s',

        acts: [
          /* ---------- Act 1: Bathroom (old, dated) ---------- */
          {
            room: 'bathroom', variant: 'old',
            chip: 'Your bathroom',
            card: { time: 'Year four in the same bathroom', line: { maya: 'The one room where you get ten minutes alone.', elena: 'A milestone birthday this month.' } },
            stages: [],
            intro: [
              { t: { maya: 'A year of saying "someday". I come in here to breathe, and it feels like a rental.',
                     elena: 'Fifty-five this month. What do I want this house to do for me at eighty?' } }
            ],
            things: {
              tub: {
                label: 'Tub', req: true, stages: ['Trigger'],
                steps: [
                  { n: 'An almond tub. Stained caulk. A curtain doing a door\'s job.' },
                  { t: { maya: 'I want to sink into warm water at the end of the day. Not stand in this.',
                         elena: 'A high tub wall is fine at fifty-five. I am planning for thirty years past that.' } }
                ]
              },
              vanity: {
                label: 'Vanity and mirror', req: true, stages: ['Trigger'],
                steps: [
                  { n: 'One small sink. A crowded counter. A light bar that forgives nothing.' },
                  { t: { maya: 'Morning light should be kind. This is an interrogation.',
                         elena: 'I cannot see my own face properly in this light. A small friction, every day.' } }
                ]
              },
              tile: {
                label: 'Cracked tile', req: true, stages: ['Trigger'],
                steps: [
                  { n: 'Cracked grout, and a corner that never quite dries.' },
                  { t: { maya: 'Is it finally time?', elena: 'A floor that stays damp is a risk I can measure. It is time.' } }
                ]
              },
              rack: {
                label: 'Towel rack', stages: ['Trigger'],
                steps: [
                  { n: 'Three towels, one bar. Nothing in here has a place.' },
                  { t: { maya: 'I would settle for one calm shelf.', elena: 'Clutter at floor level. One more thing to step around.' } }
                ]
              }
            },
            needs: ['tub', 'vanity', 'tile'],
            exit: 'door',
            notYet: 'Take a proper look first: the tub, the vanity, the tile.',
            leave: [
              { t: { maya: 'Tonight, after bedtime, I start for real.', elena: 'Tonight I scope it properly.' } }
            ]
          },

          /* ---------- Act 2: Home ---------- */
          {
            room: 'home',
            chip: 'Your living room',
            card: { time: 'That night', line: 'Your living room.' },
            stages: ['Check Stock & Plan'],
            things: {
              laptop: {
                label: 'Laptop', req: true, stages: ['Inspiration', 'First Search', 'Compare Online'],
                steps: [
                  { screen: {
                    kind: 'browser',
                    tabs: ['spa bathroom ideas', 'bathroom remodel cost', 'designer or contractor first?', 'Kohler collections', 'freestanding tub sizes'],
                    query: 'bathroom renovation where to start',
                    results: [
                      { tag: 'Board', site: 'pinterest.com', title: 'Spa bathroom ideas: 2,400 pins', line: 'No prices. No dimensions. No names for what is in the photos.' },
                      { tag: 'Guide', site: 'A remodeling site', title: 'What a bathroom remodel costs in 2026', line: 'It depends on size, finishes and your region.', price: '$6,500 to $48,000' },
                      { tag: 'Blog', site: 'A design blog', title: 'We redid our bathroom for $11,000', line: 'Not including labor, tile or the vanity.' },
                      { tag: 'Forum', site: 'reddit.com', title: 'Designer first or contractor first?', line: '212 replies. Half say designer. Half say contractor.' },
                      { tag: 'Sponsored', sponsored: true, site: 'lowes.com', title: 'Bathtubs: 1,136 results', line: 'Sold one at a time. Filter by width, drain side and material.' },
                      { site: 'kohler.com', title: 'Kohler bathroom collections', line: 'Beautiful rooms. Each product is priced and sold on its own page.' }
                    ]
                  } },
                  { t: { maya: 'It is all beautiful. Which of it fits a five-by-eight room and a real budget?',
                         elena: 'Plenty of inspiration. Not one number I can plan against.' } }
                ]
              },
              phone: {
                label: 'Phone', req: true, stages: ['First Search'],
                steps: [
                  { screen: {
                    kind: 'phone', app: 'Search', head: 'How much does a bathroom renovation cost?',
                    rows: [
                      { title: '$6,500', line: 'A national average, according to one site.' },
                      { title: '$15,000 to $25,000', line: 'A contractor directory.' },
                      { title: '$32,000', line: 'A magazine, for "mid-range".' },
                      { title: '"It depends"', line: 'An AI answer, four paragraphs long.' }
                    ],
                    foot: 'A designer\'s first consultation: $250, before any drawing.'
                  } },
                  { t: { maya: 'Four answers, and a fee to ask a fifth person.', elena: 'A fivefold spread is not an estimate. It is noise.' } }
                ]
              },
              notebook: {
                label: 'Budget notebook', req: true, stages: ['Hesitation'],
                steps: [
                  { screen: { kind: 'paper', title: 'Bathroom budget', lines: [{ struck: true, text: '$15,000' }, { struck: true, text: '$22,000' }, '$28,000?', 'Designer? Contractor? Both?'] } },
                  { choice: {
                    prompt: 'Do this now, or wait another year?',
                    options: [
                      { label: 'Go for the full renovation',
                        then: [{ t: { maya: 'Then I am committing to a number I cannot check.', elena: 'Then I am committing without a number I trust.' } }] },
                      { label: 'Wait another year', set: { waited: true },
                        then: [
                          { n: 'You close the notebook. The bathroom is still there in the morning.' },
                          { t: { maya: 'Another year of "someday" costs something too. No. I am doing this.',
                                 elena: 'Waiting makes me no younger and the floor no drier. I am doing this.' } }
                        ] }
                    ]
                  } }
                ]
              },
              moodboard: {
                label: 'Mood board', stages: ['Inspiration'],
                steps: [
                  { n: 'A year of tearsheets and paint chips.' },
                  { t: { maya: 'Warm stone, pale oak. I know how it should feel. I do not know what any of it is called.',
                         elena: 'Calm, not clinical. I can picture it. I cannot find it in a catalog.' } }
                ]
              },
              partner: {
                label: 'Your partner', only: 'maya', stages: ['Hesitation'],
                steps: [
                  { s: 'Your partner', text: 'It\'s a lot of money for a bathroom. Are we sure?' },
                  { t: { maya: 'I am sure about the room. I am not sure about anything it takes to get there.' } }
                ]
              },
              training: {
                label: 'Training log', only: 'elena', stages: ['Hesitation'],
                steps: [
                  { n: 'Sleep, strength, bloodwork. Every number is logged.' },
                  { t: { elena: 'I track everything that protects my independence. Except this room.' } }
                ]
              }
            },
            needs: ['laptop', 'phone', 'notebook'],
            exit: 'door',
            notYet: 'You are not ready to go anywhere. Try the laptop, the phone and the budget notebook.',
            leave: [
              { n: 'The Lowe\'s site says "available in store". It does not say whether the tub you saved is on display.' },
              { t: { maya: 'I want to see it in person before I decide. Lowe\'s is the closest.',
                     elena: 'I need to see and touch it before I spend this. The nearest store is Lowe\'s.' } }
            ]
          },

          /* ---------- Act 3: Store (Lowe's) ---------- */
          {
            room: 'store',
            chip: 'Lowe\'s',
            card: { time: 'Saturday, 11:10 AM', line: 'Lowe\'s. Bath is at the back of the store.' },
            stages: ['Go to the Store'],
            intro: [
              { n: 'No trip across town. The nearest store will have to show you enough.' }
            ],
            things: {
              display: {
                label: 'Tub and vanity display', req: true, stages: ['See Kohler on Display'],
                steps: [
                  { n: 'Tubs and vanities on a platform. Half are still boxed. None is in a room.' },
                  { t: { maya: 'I cannot feel a room from a row of fixtures under warehouse lights.',
                         elena: 'I cannot step into it or check a height. It is a lineup, not a bathroom.' } }
                ]
              },
              kohler: {
                label: 'Kohler display', req: true, stages: ['See Kohler on Display'],
                steps: [
                  { n: 'A Kohler tub and vanity between three other brands. The tub you saved is a tag: "Order online".' },
                  { t: { maya: 'The one I fell for is not here to touch.', elena: 'The one I shortlisted is a tag on a shelf.' } }
                ]
              },
              associate: {
                label: 'Associate', req: true, stages: ['Ask an Associate'],
                steps: [
                  { choice: {
                    prompt: 'What do you ask?',
                    options: [
                      { label: 'Will this tub fit my bathroom?',
                        then: [{ s: 'Associate', text: 'That\'s more of a pro question. I can look up specs, but I can\'t see your room.' }] },
                      { label: 'Do these pieces go together?',
                        then: [{ s: 'Associate', text: 'They\'re from different collections. I\'d check with whoever is doing your install.' }] }
                    ]
                  } },
                  { t: { maya: 'So who does know?', elena: 'Specs I can read for myself.' } }
                ]
              },
              contractor: {
                label: 'Contractor', req: true, stages: ['Ask an Associate'],
                steps: [
                  { s: 'Contractor', text: 'I can start in six weeks. You buy the fixtures, I install. Delivery is between you and the store.' },
                  { t: { maya: 'His calendar, the store\'s calendar, mine. Who holds them together?',
                         elena: 'Two quotes, two timelines, and I am the project manager.' } }
                ]
              },
              board: {
                label: 'Make a choice', req: true, after: ['display', 'kohler', 'associate', 'contractor'], stages: ['Decide', 'Buy & Arrange Install'],
                locked: 'You are not ready to choose. Look at the displays and talk to both people.',
                steps: [
                  { choice: {
                    prompt: 'How do you fill this room?',
                    options: [
                      { label: 'The Kohler suite. Special order, about three weeks.', set: { pick: 'suite' },
                        then: [
                          { n: 'Ordered at the desk. Three line items, three delivery estimates.' },
                          { t: { maya: 'It is the room I pictured. I hope it is the room I get.',
                                 elena: 'One maker, one standard. And a three-week gap I will have to manage.' } }
                        ] },
                      { label: 'A mix of brands that are in stock today.', set: { pick: 'mix' },
                        then: [
                          { n: 'Four boxes, three brands, one flatbed cart.' },
                          { t: { maya: 'It is all here. Will it look like one room, or four purchases?',
                                 elena: 'Available is not the same as right. I chose available.' } }
                        ] },
                      { label: 'The contractor\'s package. He picks, he orders.', set: { pick: 'pro' },
                        then: [
                          { n: 'You sign his estimate. The fixture list says "or equivalent".' },
                          { t: { maya: 'I just handed a year of tearsheets to someone else\'s supplier.',
                                 elena: 'I have handed off the decision. I do not know what is inside that quote.' } }
                        ] }
                    ]
                  } }
                ]
              }
            },
            needs: ['display', 'kohler', 'associate', 'contractor', 'board'],
            exit: 'door',
            notYet: 'You came here to decide. You have not yet.',
            leave: [
              { n: 'Receipt in hand. Delivery and installation are two different phone numbers.' }
            ]
          },

          /* ---------- Act 4: Bathroom (finished, new) ---------- */
          {
            room: 'bathroom', variant: 'new', final: true,
            chip: 'Your bathroom',
            card: { time: 'Eleven weeks later', line: 'The reveal.' },
            stages: [],
            things: {
              box: {
                label: 'Delivery boxes', req: true, stages: ['Buy & Arrange Install'],
                steps: [
                  { n: 'Delivery boxes, still taped. They arrived ten days before the contractor could start.' },
                  { t: { maya: 'They sat in the hallway for ten days. Nobody owned that gap but me.',
                         elena: 'Ten days of boxes in my hall. A trip hazard, delivered.' } }
                ]
              },
              phone: {
                label: 'Phone', req: true, stages: ['Buy & Arrange Install'],
                steps: [
                  { screen: {
                    kind: 'phone', app: 'Messages and calendar', head: 'This week',
                    rows: [
                      { title: '"Running two days behind. Sorry!"', line: 'Contractor, Tuesday 7:02 AM', badge: 'Unread', tone: 'warn' },
                      { title: 'Delivery window: Thursday 8 to 12', line: 'A text from the store' },
                      { title: 'Install visit: Thursday 9 AM', line: 'Your own calendar' }
                    ],
                    foot: 'Both need you at home. Neither knows about the other.'
                  } },
                  { t: { maya: 'Three calendars. I was the only one reading all of them.',
                         elena: 'Two systems that never spoke. I was the link between them.' } }
                ]
              },
              controls: {
                label: 'Shower controls', req: true, stages: ['Install & Live With It'],
                steps: [
                  { n: 'Two knobs, one lever, and a QR code where the manual should be.' },
                  { t: { maya: 'Which way is hot? I should not need my phone to take a shower.',
                         elena: 'It wants me to scan a code and make an account. To run my own shower.' } }
                ]
              },
              tub: {
                label: 'New tub', req: true, after: ['box', 'phone', 'controls'], stages: ['Install & Live With It'],
                locked: 'Not yet. There are still loose ends in this room.',
                steps: [
                  { n: 'First use. The water is warm. The room is quiet.' },
                  { t: { maya: 'It looks right. It feels right. Was it worth what it took to get here?',
                         elena: 'It looks right. Whether it does what I needed, I will learn by living with it.' } }
                ]
              }
            },
            needs: ['box', 'phone', 'controls', 'tub'],
            exit: 'door',
            notYet: 'The room is finished, but you have not taken it in yet.',
            leave: []
          }
        ],

        ending: function (s) {
          if (s.personaId === 'maya') {
            return [
              'The room is beautiful. I take my ten minutes in here every night.',
              'It also took eleven weeks, three calendars and a hundred small decisions.',
              { suite: 'I got the room I pictured. I had to carry it there myself, piece by piece.',
                mix: 'Up close, it is four purchases that mostly agree. I notice. I try not to.',
                pro: 'Some of it is his "or equivalent". It is lovely. It is not quite what I pinned.' }[s.pick]
            ];
          }
          return [
            'The room works. The floor is dry and the light is honest.',
            'It took eleven weeks, and I ran the project myself.',
            { suite: 'I chose one maker so it would last. Nobody showed me how the pieces fit until they were in my hall.',
              mix: 'I chose what was available. I cannot tell you it will serve me at eighty.',
              pro: 'I let him choose. I measure everything, and I cannot tell you what I bought.' }[s.pick]
          ];
        }
      }
    ]
  };

  root.STORY = STORY;
})(typeof window !== 'undefined' ? window : globalThis);
