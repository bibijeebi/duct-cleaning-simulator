import React, { useState, useReducer, useEffect } from 'react';

// ============================================================================
// GAME DATA CONSTANTS
// ============================================================================

const SCENARIOS = {
  residential: {
    id: 'residential',
    name: 'Residential Attic Job',
    difficulty: 'Beginner',
    icon: '🏠',
    description: '2,400 sq ft ranch home with attic-mounted split system',
    systemType: 'split',
    estimatedTime: '3-4 hours',
    unlocked: true
  },
  commercial: {
    id: 'commercial',
    name: 'Commercial Strip Mall',
    difficulty: 'Intermediate',
    icon: '🏪',
    description: 'Retail space with rooftop RTU, long duct runs',
    systemType: 'rtu',
    estimatedTime: '5-6 hours',
    unlocked: true
  },
  courthouse: {
    id: 'courthouse',
    name: 'Institutional (Courthouse)',
    difficulty: 'Advanced',
    icon: '🏛️',
    description: 'Multi-floor building with PTAC/fan coil units throughout',
    systemType: 'ptac',
    estimatedTime: '2-3 days',
    unlocked: true
  }
};

const JOB_TICKETS = {
  residential: {
    address: '1847 Pinewood Lane, Cary NC 27513',
    customer: 'Johnson Family',
    contactName: 'Mike Johnson',
    phone: '(919) 555-0147',
    system: 'Split system - air handler in attic',
    sqft: '2,400',
    notes: 'Single story ranch, 2 returns, 9 supply registers. Dog on premises - will be secured in backyard.',
    estimatedTime: '3-4 hours',
    mapDistance: '12 miles',
    parking: 'Driveway - no restrictions',
    specialConsiderations: ['Attic access via pull-down stairs', 'All flex duct to supplies', 'Homeowner will be present']
  },
  commercial: {
    address: '4521 Capital Blvd, Suite 102, Raleigh NC 27604',
    customer: 'Triangle Dental Associates',
    contactName: 'Office Manager - Sarah Chen',
    phone: '(919) 555-0283',
    system: 'Rooftop Unit (RTU) - 7.5 ton Carrier',
    sqft: '3,800',
    notes: 'Dental office in strip mall. Work must be done after hours (6 PM - 6 AM). Roof access via exterior ladder. Security alarm code will be provided.',
    estimatedTime: '5-6 hours',
    mapDistance: '8 miles',
    parking: 'Rear lot - back in near roof ladder',
    specialConsiderations: ['After-hours work only', 'Roof access required', 'Long horizontal runs (60+ ft)', 'Rigid metal throughout', 'Alarm system - get code']
  },
  courthouse: {
    address: '201 E Main St, Durham NC 27701',
    customer: 'Durham County Facilities',
    contactName: 'Jeff Martinez - Facilities Manager',
    phone: '(919) 555-0391',
    system: 'PTAC/Fan Coil - 47 units across 3 floors',
    sqft: '45,000',
    notes: 'Historic courthouse building. Work in phases by floor. Coordinate with building security. Some offices occupied during work - minimize disruption. Church Street Garage for parking ($9/day).',
    estimatedTime: '2-3 days',
    mapDistance: '15 miles',
    parking: 'Church Street Garage - $9 daily, walking distance',
    specialConsiderations: ['Multi-day job', 'Security escort required', '47 individual units', 'Occupied building - noise concerns', 'Historic building - extra care required', 'Crew of 4-6 recommended']
  }
};

const EQUIPMENT_CATEGORIES = {
  primary: { name: 'Primary Equipment', items: ['Vacuum unit', 'Main hose (25ft)', 'Whip attachment', 'Brush kit'], penalty: 'critical', penaltyText: 'Job cannot proceed' },
  access: { name: 'Access Tools', items: ['Screwdriver set', 'Drill/driver', 'Access panel screws', 'Utility knife'], penalty: 'delay', penaltyText: 'Hardware store run required' },
  electrical: { name: 'Electrical', items: ['15A/20A adapters', 'Extension cord (50ft)', 'Power strip'], penalty: 'delay', penaltyText: 'Equipment won\'t run' },
  safety: { name: 'Safety', items: ['N95 masks', 'Safety glasses', 'Drop cloths', 'Corner guards'], penalty: 'violation', penaltyText: 'Safety violation' },
  documentation: { name: 'Documentation', items: ['Camera/phone', 'Invoice pad', 'Business cards'], penalty: 'minor', penaltyText: 'Unprofessional' }
};

const SCENARIO_EQUIPMENT = {
  residential: {},
  commercial: {
    roofAccess: { name: 'Roof Access', items: ['Safety harness', 'Roof anchor', 'Extension ladder'], penalty: 'critical', penaltyText: 'Cannot access RTU' },
    truckEquip: { name: 'Truck Equipment', items: ['Vacuum truck ready', 'Long hose (100ft)', 'Roof port adapter'], penalty: 'critical', penaltyText: 'Insufficient reach for RTU' }
  },
  courthouse: {
    multiUnit: { name: 'Multi-Unit Setup', items: ['PTAC cleaning kit', 'Coil cleaner', 'Drain pan tablets', 'Filter stock (various sizes)'], penalty: 'delay', penaltyText: 'Multiple hardware runs' },
    crew: { name: 'Crew Coordination', items: ['Radio set', 'Floor assignments', 'Master key/badge'], penalty: 'delay', penaltyText: 'Inefficient crew deployment' }
  }
};

const CUSTOMER_TYPES = {
  helpful: { name: 'Helpful Contact', avatar: '😊', color: '#22c55e', scenarios: ['residential'] },
  suspicious: { name: 'Suspicious Customer', avatar: '🤨', color: '#f59e0b', scenarios: ['residential', 'commercial'] },
  micromanager: { name: 'Micromanager', avatar: '🔍', color: '#8b5cf6', scenarios: ['residential', 'commercial'] },
  professional: { name: 'Professional Manager', avatar: '👔', color: '#3b82f6', scenarios: ['commercial', 'courthouse'] },
  security: { name: 'Building Security', avatar: '🛡️', color: '#6b7280', scenarios: ['courthouse'] },
  absent: { name: 'Absent Contact', avatar: '📱', color: '#ef4444', scenarios: ['commercial'] },
  facilities: { name: 'Facilities Director', avatar: '🔧', color: '#14b8a6', scenarios: ['courthouse'] }
};

// ============================================================================
// DIALOGUE TREES - Branching conversations for FirstContact phase
// ============================================================================

const DIALOGUE_TREES = {
  helpful: {
    start: 'greeting',
    nodes: {
      greeting: {
        speaker: 'customer',
        text: "Oh great, you're here! Let me show you where everything is. The air handler is in the attic - pull-down stairs are in the hallway. Want some coffee?",
        choices: [
          { text: "Thank you! Before I get set up, could you walk me through where all the vents are?", next: 'tour_offer', score: 5, reason: 'Professional thoroughness' },
          { text: "Coffee sounds great, thanks! I'll get my equipment situated after.", next: 'coffee', score: 2, reason: 'Building rapport' },
          { text: "Thanks, I'll find everything myself.", next: 'independent', score: 0, reason: null }
        ]
      },
      tour_offer: {
        speaker: 'customer',
        text: "Absolutely! There's 9 vents total - 2 in the living room, one in each bedroom... Oh, and heads up, the master bedroom vent makes a weird noise. That's actually why we called you!",
        choices: [
          { text: "Good to know about that noise - I'll pay extra attention there and let you know what I find.", next: null, score: 3, reason: 'Active listening' },
          { text: "Got it, thanks for the tour.", next: null, score: 0, reason: null }
        ]
      },
      coffee: {
        speaker: 'customer',
        text: "Here you go! Oh by the way, our dog Baxter is in the backyard. He's friendly but loud. Just don't open that back door!",
        choices: [
          { text: "Thanks for the heads up - I'll make sure all doors stay secure.", next: null, score: 2, reason: 'Attention to detail' },
          { text: "No problem, I'll be careful.", next: null, score: 0, reason: null }
        ]
      },
      independent: {
        speaker: 'customer',
        text: "Okay! I'll be in the kitchen if you need anything. Oh, the circuit breaker is in the garage if you need it.",
        choices: [
          { text: "Perfect, thanks. I'll let you know before I start any loud equipment.", next: null, score: 2, reason: 'Courteous communication' },
          { text: "Got it.", next: null, score: 0, reason: null }
        ]
      }
    }
  },

  suspicious: {
    start: 'greeting',
    nodes: {
      greeting: {
        speaker: 'customer',
        text: "You're from the duct cleaning company? Let me see some ID. I need to know exactly what you're going to do - I've read about scam duct cleaners online.",
        choices: [
          { text: "Absolutely. Here's my ID and business card. I completely understand - let me walk you through our entire process step by step.", next: 'reassured', score: 5, reason: 'Professional reassurance' },
          { text: "Here's my ID. We spoke on the phone about the appointment.", next: 'still_wary', score: 0, reason: null },
          { text: "Ma'am, we're a legitimate company. Can you just show me where the air handler is?", next: 'defensive', score: -5, reason: 'Dismissive of concerns' }
        ]
      },
      reassured: {
        speaker: 'customer',
        text: "Okay, that's... more professional than I expected. But what about damage? I just had these floors refinished. And I want before and after photos of everything.",
        choices: [
          { text: "I'll lay drop cloths on all walking paths and take photos before we start. I can text them to you too if you'd like a copy.", next: 'trust_built', score: 5, reason: 'Exceeding expectations' },
          { text: "We use drop cloths and I'll be careful.", next: null, score: 0, reason: null }
        ]
      },
      still_wary: {
        speaker: 'customer',
        text: "Fine. But I'm watching everything. If I see anything sketchy, I'm calling your office. And don't try to upsell me on anything.",
        choices: [
          { text: "Understood. I'll explain everything as I go, and I'll only recommend what I actually see in your ducts.", next: null, score: 2, reason: 'Setting clear expectations' },
          { text: "That's fine. Where's the thermostat?", next: null, score: -3, reason: 'Missed rapport opportunity' }
        ]
      },
      defensive: {
        speaker: 'customer',
        text: "Excuse me? I have every right to ask questions in my own home. Maybe I should call your office and talk to your supervisor.",
        choices: [
          { text: "You're absolutely right, I apologize. Let me start over - here's my ID, and I'm happy to answer any questions.", next: 'recovery', score: 0, reason: 'Recovered from poor start' },
          { text: "Go ahead and call. I'm just here to do my job.", next: null, score: -10, reason: 'Escalated conflict with customer' }
        ]
      },
      recovery: {
        speaker: 'customer',
        text: "*sighs* Fine. Just... be careful, okay? This is my home.",
        choices: [
          { text: "I understand completely. I'll treat it with respect.", next: null, score: 0, reason: null }
        ]
      },
      trust_built: {
        speaker: 'customer',
        text: "Alright, you seem like you know what you're doing. Let me show you where the attic access is. ...Sorry if I came on strong. We had a bad experience with a contractor last year.",
        choices: [
          { text: "No need to apologize - I appreciate customers who ask questions. Keeps us accountable.", next: null, score: 3, reason: 'Empathy and professionalism' }
        ]
      }
    }
  },

  micromanager: {
    start: 'greeting',
    nodes: {
      greeting: {
        speaker: 'customer',
        text: "Finally! I've been waiting all morning. I need to watch everything you do - I've seen videos online of duct cleaners just blowing air around and leaving. You ARE cleaning every single vent, right?",
        choices: [
          { text: "Every single one. In fact, would you like to see the process? I can show you before and after on each vent.", next: 'engaged', score: 5, reason: 'Turned concern into collaboration' },
          { text: "Yes, we clean everything thoroughly. It takes about 3-4 hours.", next: 'skeptical', score: 0, reason: null },
          { text: "We've been doing this for years. We know what we're doing.", next: 'confrontational', score: -5, reason: 'Dismissive of concerns' }
        ]
      },
      engaged: {
        speaker: 'customer',
        text: "Really? You'd let me watch? ...Most contractors get annoyed when I ask questions. What kind of equipment do you use? Is it the good kind?",
        choices: [
          { text: "Happy to explain! This is a truck-mounted vacuum - much more powerful than portable units. And this whip attachment agitates the debris loose.", next: 'ally', score: 5, reason: 'Educational approach' },
          { text: "It's professional-grade equipment, industry standard.", next: null, score: 0, reason: null }
        ]
      },
      skeptical: {
        speaker: 'customer',
        text: "3-4 hours? The last company was done in 45 minutes. That's actually why I called you guys for a second opinion.",
        choices: [
          { text: "45 minutes isn't enough time to do it right. Real duct cleaning takes time - I'd rather do it once and do it properly.", next: 'warming', score: 3, reason: 'Honest assessment' },
          { text: "We take our time to be thorough.", next: null, score: 0, reason: null }
        ]
      },
      confrontational: {
        speaker: 'customer',
        text: "Experience doesn't mean anything if you're cutting corners. I've done my research. I know what proper duct cleaning is supposed to look like.",
        choices: [
          { text: "You're right, and I respect that you've done homework. Would you like to observe our process and verify we're doing it correctly?", next: 'recovery', score: 2, reason: 'Recovered with humility' },
          { text: "Then you should know this takes a few hours. Can I get started?", next: null, score: -5, reason: 'Continued friction' }
        ]
      },
      warming: {
        speaker: 'customer',
        text: "That's... actually reassuring. Okay. I'll try not to hover too much. But can I check the before and after photos?",
        choices: [
          { text: "Absolutely - I'll show you each vent before and after. You can take photos yourself too if you want.", next: null, score: 2, reason: 'Transparency builds trust' }
        ]
      },
      ally: {
        speaker: 'customer',
        text: "Wow, that's actually really interesting! I had no idea there was that much to it. Okay, I'll let you work - but I might pop in to watch sometimes. Is that okay?",
        choices: [
          { text: "Anytime. If you have questions, just ask - I'd rather you understand what we're doing.", next: null, score: 3, reason: 'Customer became advocate' }
        ]
      },
      recovery: {
        speaker: 'customer',
        text: "...Fine. Show me what you're going to do.",
        choices: [
          { text: "Here's the plan: returns first, then each supply vent, finishing with the main trunk line.", next: null, score: 0, reason: null }
        ]
      }
    }
  },

  professional: {
    start: 'greeting',
    nodes: {
      greeting: {
        speaker: 'customer',
        text: "Good morning. I'm Sarah Chen, office manager. Here's your building access card and alarm code - please don't lose them. Roof hatch key is at reception. Any questions?",
        choices: [
          { text: "Thank you. Quick question - what time does the last person usually leave? I want to make sure I don't accidentally lock anyone in.", next: 'impressed', score: 5, reason: 'Proactive thinking' },
          { text: "Got it. Where's the breaker panel for the RTU?", next: 'business', score: 2, reason: 'Focused on task' },
          { text: "Nope, I'll figure it out.", next: 'cold', score: -3, reason: 'Unprofessional response' }
        ]
      },
      impressed: {
        speaker: 'customer',
        text: "Good question - Dr. Martinez sometimes works late, usually until 8. I'll text him you're here. The exam rooms have sensitive equipment, so please knock before entering.",
        choices: [
          { text: "Understood. I'll be mindful of the equipment and knock on any closed doors.", next: null, score: 3, reason: 'Attention to context' }
        ]
      },
      business: {
        speaker: 'customer',
        text: "Main panel is in the utility closet at end of hall. The RTU has its own disconnect on the roof. Here's a building layout.",
        choices: [
          { text: "Perfect, this helps. I'll text you before I start any loud equipment.", next: null, score: 2, reason: 'Communication plan' },
          { text: "Great, thanks.", next: null, score: 0, reason: null }
        ]
      },
      cold: {
        speaker: 'customer',
        text: "*raises eyebrow* Okay then. Call the main line if you have problems. Not my cell.",
        choices: [
          { text: "Actually, could I get that building layout? It would help.", next: null, score: 0, reason: null }
        ]
      }
    }
  },

  security: {
    start: 'greeting',
    nodes: {
      greeting: {
        speaker: 'customer',
        text: "Hold up. I need to see ID and your work order. You'll also need to sign the visitor log. Escort required to mechanical areas - no exceptions. Building policy.",
        choices: [
          { text: "No problem at all. Here's my ID and work order. I appreciate the security - happy to follow your protocols.", next: 'cooperative', score: 5, reason: 'Respecting authority' },
          { text: "Here's my ID. The facilities manager should have me on the list.", next: 'by_the_book', score: 0, reason: null },
          { text: "All this for duct cleaning? Seems like overkill.", next: 'pushback', score: -5, reason: 'Challenged security protocol' }
        ]
      },
      cooperative: {
        speaker: 'customer',
        text: "Good. Most contractors complain. Sign here. Your escort is Officer Davis - she knows the mechanical rooms. Courthouse closes at 5, so coordinate with her on timing.",
        choices: [
          { text: "Understood. What's the best way to reach her if we get separated?", next: null, score: 3, reason: 'Practical planning' },
          { text: "Got it. When can we get started?", next: null, score: 0, reason: null }
        ]
      },
      by_the_book: {
        speaker: 'customer',
        text: "*checks clipboard* ...Martinez. Yeah, you're on here. Escort will be ready in 10 minutes. Wait in the lobby.",
        choices: [
          { text: "I'll use the time to review the work order. Thanks.", next: null, score: 2, reason: 'Productive use of wait time' },
          { text: "Can we speed this up? I've got a lot of ground to cover.", next: null, score: -3, reason: 'Impatient with process' }
        ]
      },
      pushback: {
        speaker: 'customer',
        text: "*steps closer* Sir, this is a county courthouse. We've had threats. Everyone follows the same rules. ID. Now.",
        choices: [
          { text: "You're right, I apologize. Here's my ID and work order.", next: 'recovery', score: 0, reason: 'Backed down appropriately' },
          { text: "*hands over ID* Fine. Here.", next: null, score: -5, reason: 'Continued hostility' }
        ]
      },
      recovery: {
        speaker: 'customer',
        text: "*examines ID* Alright. Follow the rules and we won't have problems. Your escort will be ready in 10 minutes.",
        choices: [
          { text: "Understood. I appreciate what you do here.", next: null, score: 2, reason: 'Made amends' }
        ]
      }
    }
  },

  absent: {
    start: 'text_received',
    nodes: {
      text_received: {
        speaker: 'customer',
        text: "[Text message] 'Hey! Running late, stuck in traffic. Key is under the mat by the door. Alarm code is 1234. Make yourself at home - text me when you're done!'",
        choices: [
          { text: "[Reply] 'No problem! I'll take photos before entering and document everything. What's a good number if I have questions?'", next: 'responsible', score: 5, reason: 'Documentation protocol' },
          { text: "[Reply] 'Got it, thanks. I'll text when done.'", next: 'standard', score: 2, reason: 'Basic communication' },
          { text: "Let yourself in without replying.", next: 'silent', score: -3, reason: 'No communication' }
        ]
      },
      responsible: {
        speaker: 'customer',
        text: "[Reply] 'Smart thinking! This number works. Oh - the cat might be wandering around, his name is Chairman Meow. Please don't let him out! 😅'",
        choices: [
          { text: "[Reply] 'Ha! I'll keep Chairman Meow contained. Starting in 5 min.'", next: null, score: 2, reason: 'Personal connection' },
          { text: "[Take photo of key location, then enter]", next: null, score: 0, reason: null }
        ]
      },
      standard: {
        speaker: 'customer',
        text: "[Reply] '👍'",
        choices: [
          { text: "[Take photo of key location before entering]", next: null, score: 2, reason: 'CYA documentation' },
          { text: "[Enter and start working]", next: null, score: 0, reason: null }
        ]
      },
      silent: {
        speaker: 'system',
        text: "You enter the home without sending a confirmation text.",
        choices: [
          { text: "[Take entry photo anyway for documentation]", next: null, score: 2, reason: 'Late documentation better than none' },
          { text: "[Just start working]", next: null, score: -5, reason: 'No documentation trail' }
        ]
      }
    }
  },

  facilities: {
    start: 'greeting',
    nodes: {
      greeting: {
        speaker: 'customer',
        text: "Welcome to Durham County Courthouse. Jeff Martinez, Facilities. We've got 47 PTAC units across three floors - it's a big job. Security will escort you. We need to work around court schedules. Got your crew?",
        choices: [
          { text: "Yes, four of us today. Before we start, can we review the floor plan and court schedule together? I want to avoid any disruptions.", next: 'planning', score: 5, reason: 'Collaborative planning' },
          { text: "Crew's ready. Which floor should we start on?", next: 'direct', score: 2, reason: 'Ready to work' },
          { text: "We'll figure it out as we go. Just need building access.", next: 'cowboy', score: -5, reason: 'No coordination' }
        ]
      },
      planning: {
        speaker: 'customer',
        text: "Perfect - that's what I like to hear. Here's the layout. Floor 1 has Courtrooms A and B - Judge Patterson is in session until 3, but Judge Williams is out today. Floor 2 has been quieter.",
        choices: [
          { text: "Let's start Floor 2 then, and hit the Floor 1 courtrooms during lunch recess. What time is that usually?", next: null, score: 5, reason: 'Strategic scheduling' },
          { text: "We'll start wherever's open and work around the schedule.", next: null, score: 0, reason: null }
        ]
      },
      direct: {
        speaker: 'customer',
        text: "Second floor is probably best to start - most offices are empty this morning. Radio me when you're ready to move into the courtrooms.",
        choices: [
          { text: "Will do. What radio channel should we use?", next: null, score: 2, reason: 'Communication setup' },
          { text: "Got it, thanks.", next: null, score: 0, reason: null }
        ]
      },
      cowboy: {
        speaker: 'customer',
        text: "*frowns* This is a county courthouse, not a strip mall. We have active cases, judges, sensitive areas. You need to coordinate with me.",
        choices: [
          { text: "You're right, I apologize. Let's start over - what's the best approach for this building?", next: 'recovery', score: 0, reason: 'Course correction' },
          { text: "Fine, just tell us where we can work.", next: null, score: -3, reason: 'Continued friction' }
        ]
      },
      recovery: {
        speaker: 'customer',
        text: "*sighs* Second floor, east wing. I'll get you a radio. Next time, lead with the planning.",
        choices: [
          { text: "Understood. We'll check in before moving to each new area.", next: null, score: 2, reason: 'Made amends' }
        ]
      }
    }
  }
};

// ============================================================================
// COMPLETION DIALOGUES - Customer walkthrough at end of job
// ============================================================================

const COMPLETION_DIALOGUES = {
  helpful: {
    start: 'show_work',
    nodes: {
      show_work: {
        speaker: 'customer',
        text: "All done? Great! Let's see what you found in there.",
        choices: [
          { text: "Here are the before and after photos - you can see the buildup we removed from each vent.", next: 'impressed', score: 5, reason: 'Professional documentation', requiresPhotos: true },
          { text: "Everything's cleaned out. The airflow should be much better now.", next: 'satisfied', score: 2, reason: 'Basic explanation' },
          { text: "Yep, all done. Just need your signature.", next: 'rushed', score: -3, reason: 'Rushed walkthrough' }
        ]
      },
      impressed: {
        speaker: 'customer',
        text: "Wow, that's a lot of dust! I had no idea it was that bad. Thank you for showing me - I'll definitely share these photos with my husband.",
        choices: [
          { text: "Happy to help! I'd recommend cleaning again in 3-5 years, or sooner if you notice dust buildup on the vents.", next: 'signature', score: 3, reason: 'Helpful maintenance advice' },
          { text: "No problem! Here's the invoice whenever you're ready.", next: 'signature', score: 0, reason: null }
        ]
      },
      satisfied: {
        speaker: 'customer',
        text: "That's good to hear. The house did seem a bit dusty lately. Should I change my filter more often?",
        choices: [
          { text: "Monthly filter changes help a lot. I noticed yours was pretty loaded - that's normal after this much buildup.", next: 'signature', score: 2, reason: 'Practical advice' },
          { text: "Filters help, yeah. Ready to sign?", next: 'signature', score: 0, reason: null }
        ]
      },
      rushed: {
        speaker: 'customer',
        text: "Oh... okay. I was hoping to see what you did. Did you take any pictures?",
        choices: [
          { text: "I apologize - let me show you the vents and explain what we cleaned.", next: 'recovery', score: 2, reason: 'Recovered with walkthrough' },
          { text: "We cleaned everything, I promise. It's all good.", next: 'disappointed', score: -5, reason: 'No documentation shown' }
        ]
      },
      recovery: {
        speaker: 'customer',
        text: "That's better, thank you. I just like to know what I'm paying for, you know?",
        choices: [
          { text: "Completely understand. Here's the invoice - everything's itemized.", next: 'signature', score: 0, reason: null }
        ]
      },
      disappointed: {
        speaker: 'customer',
        text: "*sighs* Alright, I guess. Where do I sign?",
        choices: [
          { text: "[Get signature]", next: null, score: 0, reason: null }
        ]
      },
      signature: {
        speaker: 'customer',
        text: "This all looks great. Let me get my checkbook. Thanks again!",
        choices: [
          { text: "Thank you! Call us anytime if you have questions about your system.", next: null, score: 2, reason: 'Professional closing' },
          { text: "Thanks, have a great day!", next: null, score: 0, reason: null }
        ]
      }
    }
  },

  suspicious: {
    start: 'skeptical_review',
    nodes: {
      skeptical_review: {
        speaker: 'customer',
        text: "Okay, let's see it. I want to check every vent myself. And I want to see those before and after photos you promised.",
        choices: [
          { text: "Absolutely. Let's walk through each one - here are all the photos side by side.", next: 'checking_photos', score: 5, reason: 'Delivered on promise', requiresPhotos: true },
          { text: "Here are the photos. As you can see, there was significant buildup in the returns.", next: 'partial_check', score: 2, reason: 'Showed documentation', requiresPhotos: true },
          { text: "I cleaned everything thoroughly. You can trust the work.", next: 'no_photos', score: -5, reason: 'No proof provided' }
        ]
      },
      checking_photos: {
        speaker: 'customer',
        text: "*examines photos carefully* ...Okay, I can see the difference. That master bedroom vent really was clogged. What's this dark stuff?",
        choices: [
          { text: "That's a combination of dust, dead skin cells, pet dander, and some mold spores - all normal for a system this age. It's all cleared out now.", next: 'convinced', score: 5, reason: 'Knowledgeable explanation' },
          { text: "Just dust and debris that accumulated over time.", next: 'mostly_satisfied', score: 0, reason: null }
        ]
      },
      partial_check: {
        speaker: 'customer',
        text: "Hmm. These look okay. But how do I know you actually cleaned inside the ducts and not just the vents?",
        choices: [
          { text: "Great question. See this photo? That's 15 feet into your main trunk line - you can see the before and after of the interior walls.", next: 'convinced', score: 3, reason: 'Addressed concern directly' },
          { text: "We use a truck-mounted vacuum that pulls debris through the entire system. The vents are just the access points.", next: 'mostly_satisfied', score: 0, reason: null }
        ]
      },
      no_photos: {
        speaker: 'customer',
        text: "Trust you? You said you'd take photos! This is exactly what I was worried about. How do I know you did anything?",
        choices: [
          { text: "You're right, I should have documented better. Let me show you the vents directly - you can feel the difference in airflow.", next: 'damage_control', score: 0, reason: 'Attempted recovery' },
          { text: "Ma'am, I spent 4 hours cleaning your system. The work is done.", next: 'angry', score: -10, reason: 'Defensive without proof' }
        ]
      },
      convinced: {
        speaker: 'customer',
        text: "...Alright. I'm actually impressed. You clearly know what you're doing. Sorry I was so... intense about this.",
        choices: [
          { text: "No apology needed - I'd want the same documentation if someone was working in my home. It's smart to ask questions.", next: 'signature_good', score: 3, reason: 'Gracious response' },
          { text: "No problem. Ready to sign?", next: 'signature_neutral', score: 0, reason: null }
        ]
      },
      mostly_satisfied: {
        speaker: 'customer',
        text: "Okay. I guess it looks fine. I'll be watching to see if there's actually less dust over the next few weeks.",
        choices: [
          { text: "You should notice a difference within a week. If you have any concerns, call us - we stand behind our work.", next: 'signature_neutral', score: 2, reason: 'Confidence in work' },
          { text: "Here's the invoice.", next: 'signature_neutral', score: 0, reason: null }
        ]
      },
      damage_control: {
        speaker: 'customer',
        text: "*feels vent* ...The airflow does seem stronger. Fine. But I'm writing a note about the missing photos on this invoice.",
        choices: [
          { text: "That's fair. I apologize for not meeting expectations on documentation.", next: 'signature_cold', score: 0, reason: null }
        ]
      },
      angry: {
        speaker: 'customer',
        text: "I'm calling your office. This is unacceptable. Where's your supervisor's number?",
        choices: [
          { text: "[Provide supervisor contact and apologize]", next: null, score: -5, reason: 'Customer escalated to management' }
        ]
      },
      signature_good: {
        speaker: 'customer',
        text: "I might actually recommend you guys to my neighbor. She's been complaining about her allergies. Let me sign this.",
        choices: [
          { text: "That would be great! Here's a few business cards if she's interested.", next: null, score: 2, reason: 'Earned referral' }
        ]
      },
      signature_neutral: {
        speaker: 'customer',
        text: "Alright, let me sign. *signs invoice*",
        choices: [
          { text: "Thank you. Call us if you have any questions.", next: null, score: 0, reason: null }
        ]
      },
      signature_cold: {
        speaker: 'customer',
        text: "*signs invoice silently*",
        choices: [
          { text: "[Leave quietly]", next: null, score: 0, reason: null }
        ]
      }
    }
  },

  micromanager: {
    start: 'detailed_review',
    nodes: {
      detailed_review: {
        speaker: 'customer',
        text: "Before you go, I need to see everything. Every vent. Every photo. I want a full breakdown of what was in each duct.",
        choices: [
          { text: "I was hoping you'd ask! I documented each vent with before/after shots. Let me walk you through all nine.", next: 'vent_by_vent', score: 5, reason: 'Prepared for scrutiny', requiresPhotos: true },
          { text: "I have photos of the main areas. Let me show you the highlights.", next: 'highlights_only', score: 0, reason: null, requiresPhotos: true },
          { text: "I cleaned everything. The system is in great shape now.", next: 'no_detail', score: -5, reason: 'Insufficient detail for customer type' }
        ]
      },
      vent_by_vent: {
        speaker: 'customer',
        text: "*looks at each photo intently* What about this vent in bedroom 3? The after photo looks... is that still dirty?",
        choices: [
          { text: "Good eye - that's actually a shadow from the flash. But let me show you the actual vent... see? Completely clean.", next: 'thorough_check', score: 5, reason: 'Patient with detailed questions' },
          { text: "No, that's clean. It's just the lighting in the photo.", next: 'somewhat_satisfied', score: 0, reason: null }
        ]
      },
      highlights_only: {
        speaker: 'customer',
        text: "Just the highlights? I want to see ALL of them. You said you'd document everything.",
        choices: [
          { text: "You're right - let me pull up the full set. I have photos of each vent and the main trunk line.", next: 'vent_by_vent', score: 2, reason: 'Provided complete documentation' },
          { text: "These are the important ones. The others looked similar.", next: 'disappointed', score: -3, reason: 'Incomplete documentation' }
        ]
      },
      no_detail: {
        speaker: 'customer',
        text: "That's not what I asked. Did you even take photos? I specifically requested documentation of every vent.",
        choices: [
          { text: "I apologize - let me walk you through each vent physically and show you the condition.", next: 'physical_walkthrough', score: 0, reason: 'Recovered with walkthrough' },
          { text: "The work is done correctly. You'll see the difference in air quality.", next: 'very_disappointed', score: -8, reason: 'Dismissed customer requirements' }
        ]
      },
      thorough_check: {
        speaker: 'customer',
        text: "Okay... *checks a few more vents physically* ...Actually, this is really good work. I can tell you were thorough. The airflow is noticeably stronger.",
        choices: [
          { text: "Thanks for checking! I noticed the master bedroom had the most buildup - that's probably why you were getting the noise complaint.", next: 'impressed', score: 3, reason: 'Connected work to customer concern' },
          { text: "Glad you're satisfied. Ready for the invoice?", next: 'signature', score: 0, reason: null }
        ]
      },
      somewhat_satisfied: {
        speaker: 'customer',
        text: "Hmm. I'll take your word for it. What about the main trunk? That's where all the dust collects, right?",
        choices: [
          { text: "Exactly right. Here's the trunk line before and after - you can see we removed about 2 inches of buildup along the bottom.", next: 'impressed', score: 3, reason: 'Educated customer' },
          { text: "The trunk is clean too. All part of our standard service.", next: 'signature', score: 0, reason: null }
        ]
      },
      disappointed: {
        speaker: 'customer',
        text: "I'm not happy about this. I expected full documentation. I'm noting this on the invoice.",
        choices: [
          { text: "I understand. I should have been more thorough with the photos. The cleaning itself was complete, but I'll do better on documentation next time.", next: 'grudging_signature', score: 0, reason: null }
        ]
      },
      physical_walkthrough: {
        speaker: 'customer',
        text: "*walks to each vent and inspects* ...Okay, these do look clean. But I really wanted photos for my records.",
        choices: [
          { text: "I understand. Would you like to take photos now with your phone? I can show you each vent's condition.", next: 'grudging_signature', score: 2, reason: 'Offered solution' }
        ]
      },
      very_disappointed: {
        speaker: 'customer',
        text: "This is exactly what I was afraid of. I'm leaving a review about this. Where's the invoice?",
        choices: [
          { text: "[Provide invoice quietly]", next: null, score: -3, reason: 'Lost customer trust' }
        ]
      },
      impressed: {
        speaker: 'customer',
        text: "You know what? I was prepared to be critical, but you've actually exceeded my expectations. Most companies don't explain what they're doing.",
        choices: [
          { text: "I appreciate that! Understanding the system helps you maintain it. Here's my card if you ever have questions.", next: null, score: 5, reason: 'Converted skeptic to advocate' }
        ]
      },
      signature: {
        speaker: 'customer',
        text: "Alright, everything checks out. Let me sign this.",
        choices: [
          { text: "Thank you! Feel free to call if you notice any issues.", next: null, score: 0, reason: null }
        ]
      },
      grudging_signature: {
        speaker: 'customer',
        text: "*signs with a frown* I'll be checking on this over the next month.",
        choices: [
          { text: "Please do - and call us if you have any concerns.", next: null, score: 0, reason: null }
        ]
      }
    }
  },

  professional: {
    start: 'business_review',
    nodes: {
      business_review: {
        speaker: 'customer',
        text: "Finished? I need documentation for our files - photos, invoice, and any notes about the system condition.",
        choices: [
          { text: "All prepared. Here's the complete documentation package: before/after photos of each run, the signed work order, and my notes on the RTU condition.", next: 'impressed', score: 5, reason: 'Professional documentation', requiresPhotos: true },
          { text: "Here are the photos and invoice. Everything's been cleaned per the work order.", next: 'satisfied', score: 2, reason: 'Met requirements', requiresPhotos: true },
          { text: "Job's complete. Here's the invoice.", next: 'incomplete', score: -3, reason: 'Insufficient documentation' }
        ]
      },
      impressed: {
        speaker: 'customer',
        text: "This is exactly what I needed. The property manager will want copies of these. Any concerns about the system I should flag?",
        choices: [
          { text: "The RTU filters should be changed monthly - they were pretty loaded. Also, one of the return grilles has a broken louver that should be replaced.", next: 'valuable_feedback', score: 5, reason: 'Proactive maintenance notes' },
          { text: "System's in good shape. Just standard maintenance going forward.", next: 'signature', score: 0, reason: null }
        ]
      },
      satisfied: {
        speaker: 'customer',
        text: "Good. I'll add these to the maintenance file. Anything notable about the system?",
        choices: [
          { text: "One note - the disconnect on the roof should be tightened. It's working fine but a bit loose.", next: 'helpful', score: 3, reason: 'Helpful observation' },
          { text: "Nothing unusual. Standard buildup for a commercial system.", next: 'signature', score: 0, reason: null }
        ]
      },
      incomplete: {
        speaker: 'customer',
        text: "Just an invoice? I requested documentation. Do you have before and after photos?",
        choices: [
          { text: "I apologize - let me email you the complete photo documentation within the hour.", next: 'recovered', score: 0, reason: 'Promised follow-up' },
          { text: "We don't usually do photos for commercial jobs.", next: 'disappointed', score: -5, reason: 'Failed to meet business requirements' }
        ]
      },
      valuable_feedback: {
        speaker: 'customer',
        text: "That's helpful. I'll add the grille to our maintenance queue. *signs invoice* We use the same company for our other properties - I'll pass your name along.",
        choices: [
          { text: "I appreciate that. Here's my direct line if you need to schedule any of those.", next: null, score: 3, reason: 'Generated future business' }
        ]
      },
      helpful: {
        speaker: 'customer',
        text: "Good catch on the disconnect. I'll have our electrician look at it. *signs* Thanks for being thorough.",
        choices: [
          { text: "Happy to help. Call us for the next scheduled cleaning.", next: null, score: 2, reason: 'Professional closing' }
        ]
      },
      recovered: {
        speaker: 'customer',
        text: "Please do. I need those for our files. The property management company requires them.",
        choices: [
          { text: "[Make note to email photos immediately after leaving]", next: 'signature', score: 0, reason: null }
        ]
      },
      disappointed: {
        speaker: 'customer',
        text: "That's... not acceptable for a commercial account. I'll have to note that when we review vendors next quarter.",
        choices: [
          { text: "I understand. I apologize for the oversight.", next: null, score: -3, reason: 'Lost commercial credibility' }
        ]
      },
      signature: {
        speaker: 'customer',
        text: "Alright, sign here... *processes payment* We'll call when the next service is due.",
        choices: [
          { text: "Sounds good. Thanks for the business.", next: null, score: 0, reason: null }
        ]
      }
    }
  },

  security: {
    start: 'security_signoff',
    nodes: {
      security_signoff: {
        speaker: 'customer',
        text: "You're done? I need to escort you out and verify you haven't left any equipment behind. Standard procedure. Got your documentation for the facilities office?",
        choices: [
          { text: "All set - full photo documentation, signed work orders, and my badge and key are ready to return.", next: 'smooth_checkout', score: 5, reason: 'Prepared for security protocol', requiresPhotos: true },
          { text: "Here's the paperwork. Ready for the escort out.", next: 'standard_checkout', score: 2, reason: 'Followed procedure' },
          { text: "Yeah, we're done. Can I just leave through the main entrance?", next: 'protocol_violation', score: -5, reason: 'Attempted to bypass security' }
        ]
      },
      smooth_checkout: {
        speaker: 'customer',
        text: "*checks returned items* Badge, key, visitor log signed out... everything's in order. You're one of the easier contractors we've had.",
        choices: [
          { text: "Thanks for making the access smooth. Officer Davis was helpful getting us to the mechanical rooms.", next: 'positive_note', score: 3, reason: 'Acknowledged security help' },
          { text: "Just doing our job. Thanks for the escort.", next: 'signature', score: 0, reason: null }
        ]
      },
      standard_checkout: {
        speaker: 'customer',
        text: "*reviews paperwork* This goes to Martinez in Facilities. Sign the visitor log on your way out. I'll walk you to the exit.",
        choices: [
          { text: "Understood. Thanks for the assistance today.", next: 'signature', score: 0, reason: null }
        ]
      },
      protocol_violation: {
        speaker: 'customer',
        text: "*steps in front of you* No. Escort required for all contractors. And I need that badge back before you leave the building.",
        choices: [
          { text: "You're right, sorry. Here's the badge. Lead the way.", next: 'corrected', score: 0, reason: 'Corrected after reminder' },
          { text: "*sighs* Fine. Let's go.", next: 'noted', score: -3, reason: 'Attitude with security' }
        ]
      },
      positive_note: {
        speaker: 'customer',
        text: "I'll let her know. *makes note* You're cleared for future access - I'll update your contractor file. Makes check-in faster next time.",
        choices: [
          { text: "That's helpful, thank you. We'll be back in a few months for the other floors.", next: null, score: 2, reason: 'Established ongoing access' }
        ]
      },
      corrected: {
        speaker: 'customer',
        text: "*walks you to exit* Sign out here. We'll see you next time.",
        choices: [
          { text: "[Sign out and exit]", next: null, score: 0, reason: null }
        ]
      },
      noted: {
        speaker: 'customer',
        text: "*makes note on clipboard* ...Sign out. Your company will receive the invoice through Facilities.",
        choices: [
          { text: "[Sign out quietly]", next: null, score: 0, reason: null }
        ]
      },
      signature: {
        speaker: 'customer',
        text: "Visitor log signed. You're all set. Exit's this way.",
        choices: [
          { text: "Thanks. See you on the next phase of the project.", next: null, score: 0, reason: null }
        ]
      }
    }
  },

  absent: {
    start: 'text_completion',
    nodes: {
      text_completion: {
        speaker: 'customer',
        text: "[Your text: 'All done! Everything cleaned, took about 4 hours. Left invoice on the counter. Any questions, call me.']",
        choices: [
          { text: "[Send with before/after photos attached]", next: 'photo_response', score: 5, reason: 'Sent documentation', requiresPhotos: true },
          { text: "[Send text as written]", next: 'basic_response', score: 2, reason: 'Basic communication' },
          { text: "[Leave without texting - just leave invoice]", next: 'no_response', score: -5, reason: 'No completion communication' }
        ]
      },
      photo_response: {
        speaker: 'customer',
        text: "[Reply] 'Wow those before photos are gross! 😂 Glad it's clean now. Payment coming via Venmo. Thanks again!'",
        choices: [
          { text: "[Reply] 'Ha! Yeah it needed it. Payment received, you're all set. Call if you have any questions!'", next: null, score: 2, reason: 'Friendly professional closing' },
          { text: "[Confirm payment received and leave]", next: null, score: 0, reason: null }
        ]
      },
      basic_response: {
        speaker: 'customer',
        text: "[Reply] 'Thanks! Did you take any pics? Just want to see what was in there'",
        choices: [
          { text: "[Send photos now] 'Here you go - quite a bit of buildup in the returns!'", next: 'late_photos', score: 2, reason: 'Provided photos on request', requiresPhotos: true },
          { text: "[Reply] 'Sorry, didn't get photos this time. But everything's clean now.'", next: 'no_photos_response', score: -3, reason: 'No documentation available' }
        ]
      },
      no_response: {
        speaker: 'system',
        text: "You leave without confirming completion. An hour later, your phone rings - it's the customer.",
        choices: [
          { text: "[Answer] 'Hi, yes, everything's done. Sorry I didn't text - invoice is on the counter.'", next: 'annoyed_callback', score: 0, reason: null }
        ]
      },
      late_photos: {
        speaker: 'customer',
        text: "[Reply] 'Nasty! Glad that's gone. Payment sent. Thanks!'",
        choices: [
          { text: "[Confirm payment]", next: null, score: 0, reason: null }
        ]
      },
      no_photos_response: {
        speaker: 'customer',
        text: "[Reply] 'Oh... ok. I was hoping to see what was in there. Oh well. Payment sent anyway.'",
        choices: [
          { text: "[Confirm payment]", next: null, score: 0, reason: null }
        ]
      },
      annoyed_callback: {
        speaker: 'customer',
        text: "I've been waiting to hear from you. I didn't know if you were done or still there. Please text next time.",
        choices: [
          { text: "You're right, I apologize. Everything's complete - I should have confirmed before leaving.", next: null, score: -2, reason: 'Had to be prompted for communication' }
        ]
      }
    }
  },

  facilities: {
    start: 'facilities_debrief',
    nodes: {
      facilities_debrief: {
        speaker: 'customer',
        text: "Finished with Floor 2? Let's debrief before you pack up. I need the documentation for county records, and any issues you found.",
        choices: [
          { text: "Here's the full report: photos of each unit, work completed, and a few items to flag. The unit in Judge Williams' chambers has a noisy blower motor.", next: 'thorough_report', score: 5, reason: 'Comprehensive reporting', requiresPhotos: true },
          { text: "Floor 2 complete. Photos attached. One unit in the records room had heavy buildup - might indicate a filter issue.", next: 'good_report', score: 3, reason: 'Solid documentation', requiresPhotos: true },
          { text: "All done. Here's the paperwork.", next: 'minimal_report', score: -3, reason: 'Insufficient reporting for institutional client' }
        ]
      },
      thorough_report: {
        speaker: 'customer',
        text: "The blower motor - is that urgent or can it wait? I've got limited maintenance budget this quarter.",
        choices: [
          { text: "It can wait a month or two, but I'd get it looked at. It's not failing, just worn. Here's the model number if you want to get a quote.", next: 'impressed', score: 5, reason: 'Helpful prioritization' },
          { text: "Not urgent, but should be on your radar.", next: 'satisfied', score: 2, reason: 'Adequate guidance' }
        ]
      },
      good_report: {
        speaker: 'customer',
        text: "Filter issue? Our maintenance guy should be changing those monthly. I'll check on that. Anything else?",
        choices: [
          { text: "Just that one observation. The rest of the units on Floor 2 are in good shape. We're scheduled for Floor 3 tomorrow?", next: 'confirmed', score: 2, reason: 'Clear communication' },
          { text: "That's it. See you tomorrow for Floor 3.", next: 'confirmed', score: 0, reason: null }
        ]
      },
      minimal_report: {
        speaker: 'customer',
        text: "That's it? I need more than that for county records. What about the photos? Condition of each unit? Any maintenance flags?",
        choices: [
          { text: "You're right - let me pull up the full documentation. I have photos of each unit and notes on condition.", next: 'recovered', score: 0, reason: 'Provided documentation when pressed' },
          { text: "It's all clean. Nothing unusual to report.", next: 'disappointed', score: -5, reason: 'Failed to meet institutional requirements' }
        ]
      },
      impressed: {
        speaker: 'customer',
        text: "That's exactly what I need. *takes notes* I'll get a quote this week. You guys are thorough - that's refreshing. Same time tomorrow for Floor 3?",
        choices: [
          { text: "We'll be here at 7. Thanks for the coordination today - made everything run smooth.", next: null, score: 3, reason: 'Secured ongoing work relationship' }
        ]
      },
      satisfied: {
        speaker: 'customer',
        text: "Alright, I'll add it to the list. See you tomorrow at 7 for Floor 3. Security will have your badges ready.",
        choices: [
          { text: "Sounds good. We'll check in with you first thing.", next: null, score: 0, reason: null }
        ]
      },
      confirmed: {
        speaker: 'customer',
        text: "Yep, Floor 3 tomorrow. Same start time. Courtroom C should be clear in the morning, but we'll need to work around the afternoon session.",
        choices: [
          { text: "We'll hit Courtroom C first thing. Any other scheduling constraints I should know about?", next: null, score: 2, reason: 'Proactive scheduling' },
          { text: "Got it. See you then.", next: null, score: 0, reason: null }
        ]
      },
      recovered: {
        speaker: 'customer',
        text: "*reviews documentation* Okay, this is what I needed. Please lead with this next time - county auditors want everything documented.",
        choices: [
          { text: "Understood. I'll have the Floor 3 report ready as soon as we finish tomorrow.", next: null, score: 0, reason: null }
        ]
      },
      disappointed: {
        speaker: 'customer',
        text: "I need documentation for a county building. 'It's clean' doesn't work. I'll need you to send photos before I can process payment.",
        choices: [
          { text: "I'll email the complete documentation tonight. My apologies for the oversight.", next: null, score: -3, reason: 'Documentation failure on institutional job' }
        ]
      }
    }
  }
};

const DUCT_MATERIALS = {
  rigid: { name: 'Rigid Metal', allowedTools: ['aggressive_whip', 'rotating_brush', 'air_wash'], color: '#64748b', warning: 'Watch for sharp seam edges' },
  flex: { name: 'Flex Duct', allowedTools: ['gentle_whip', 'air_wash'], color: '#fbbf24', warning: 'Aggressive whip = collapse/tear' },
  ductboard: { name: 'Ductboard', allowedTools: ['air_wash'], color: '#a78bfa', warning: 'NO contact tools - fiber release hazard' },
  lined: { name: 'Lined Metal', allowedTools: ['air_wash', 'gentle_whip'], color: '#34d399', warning: 'Don\'t tear the liner' }
};

const SCENARIO_DUCTS = {
  residential: [
    { id: 'return1', name: 'Return 1 (Living Room)', material: 'rigid', length: '15ft', type: 'return' },
    { id: 'return2', name: 'Return 2 (Hallway)', material: 'rigid', length: '8ft', type: 'return' },
    { id: 'supply1', name: 'Supply 1 (Master)', material: 'flex', length: '20ft', type: 'supply' },
    { id: 'supply2', name: 'Supply 2 (Bed 2)', material: 'flex', length: '18ft', type: 'supply' },
    { id: 'supply3', name: 'Supply 3 (Bed 3)', material: 'flex', length: '15ft', type: 'supply' },
    { id: 'supply4', name: 'Supply 4 (Living)', material: 'flex', length: '12ft', type: 'supply' },
    { id: 'supply5', name: 'Supply 5 (Kitchen)', material: 'flex', length: '16ft', type: 'supply' },
    { id: 'supply6', name: 'Supply 6 (Dining)', material: 'flex', length: '14ft', type: 'supply' },
    { id: 'maintrunk', name: 'Main Trunk Line', material: 'rigid', length: '25ft', type: 'trunk' }
  ],
  commercial: [
    { id: 'main_supply', name: 'Main Supply Trunk', material: 'rigid', length: '65ft', type: 'trunk' },
    { id: 'main_return', name: 'Main Return Trunk', material: 'rigid', length: '60ft', type: 'return' },
    { id: 'branch1', name: 'Branch 1 (Reception)', material: 'rigid', length: '25ft', type: 'supply' },
    { id: 'branch2', name: 'Branch 2 (Exam 1)', material: 'rigid', length: '30ft', type: 'supply' },
    { id: 'branch3', name: 'Branch 3 (Exam 2)', material: 'rigid', length: '30ft', type: 'supply' },
    { id: 'branch4', name: 'Branch 4 (Exam 3)', material: 'rigid', length: '28ft', type: 'supply' },
    { id: 'branch5', name: 'Branch 5 (Office)', material: 'lined', length: '20ft', type: 'supply' },
    { id: 'branch6', name: 'Branch 6 (Lab)', material: 'rigid', length: '22ft', type: 'supply' },
    { id: 'branch7', name: 'Branch 7 (Break Room)', material: 'rigid', length: '18ft', type: 'supply' },
    { id: 'rtu_plenum', name: 'RTU Supply Plenum', material: 'lined', length: '8ft', type: 'plenum' },
    { id: 'rtu_return', name: 'RTU Return Plenum', material: 'lined', length: '8ft', type: 'plenum' }
  ],
  courthouse: [
    { id: 'floor1_main', name: 'Floor 1 - Main Corridor', material: 'rigid', length: '120ft', type: 'trunk' },
    { id: 'floor1_court1', name: 'Floor 1 - Courtroom A', material: 'lined', length: '45ft', type: 'supply' },
    { id: 'floor1_court2', name: 'Floor 1 - Courtroom B', material: 'lined', length: '45ft', type: 'supply' },
    { id: 'floor1_offices', name: 'Floor 1 - Clerk Offices', material: 'rigid', length: '60ft', type: 'supply' },
    { id: 'floor2_main', name: 'Floor 2 - Main Corridor', material: 'rigid', length: '120ft', type: 'trunk' },
    { id: 'floor2_court3', name: 'Floor 2 - Courtroom C', material: 'lined', length: '50ft', type: 'supply' },
    { id: 'floor2_judges', name: 'Floor 2 - Judge Chambers', material: 'ductboard', length: '80ft', type: 'supply' },
    { id: 'floor3_main', name: 'Floor 3 - Main Corridor', material: 'rigid', length: '110ft', type: 'trunk' },
    { id: 'floor3_admin', name: 'Floor 3 - Admin Offices', material: 'rigid', length: '90ft', type: 'supply' },
    { id: 'floor3_records', name: 'Floor 3 - Records Room', material: 'ductboard', length: '40ft', type: 'supply' },
    { id: 'ptac_units', name: 'PTAC Units (47 total)', material: 'rigid', length: 'Various', type: 'unit' }
  ]
};

// ============================================================================
// VEHICLE INSPECTION DATA
// ============================================================================

const VEHICLE_EVENTS = {
  low_fuel: {
    id: 'low_fuel',
    name: 'Low Fuel',
    icon: '⛽',
    description: 'Tank is nearly empty - less than 1/8 remaining',
    severity: 'moderate',
    detectableBy: ['fuel'],
    resolutions: [
      { 
        id: 'fuel_now', 
        text: 'Stop at gas station on the way (+15 min)', 
        timePenalty: 15, 
        scorePenalty: 0, 
        risk: 0,
        outcome: 'Fueled up. Arrive slightly late but no issues.'
      },
      { 
        id: 'fuel_later', 
        text: 'Risk it - fuel up after the job', 
        timePenalty: 0, 
        scorePenalty: 0, 
        risk: 40,
        riskOutcome: 'ran_out_of_fuel',
        outcome: 'Made it to the job site.'
      }
    ]
  },
  check_engine: {
    id: 'check_engine',
    name: 'Check Engine Light',
    icon: '🔧',
    description: 'Check engine light is illuminated on dashboard',
    severity: 'variable',
    detectableBy: ['lights'],
    resolutions: [
      { 
        id: 'diagnose', 
        text: 'Pull codes with OBD scanner (+10 min)', 
        timePenalty: 10, 
        scorePenalty: 0, 
        risk: 0,
        outcome: 'Code P0420 - catalytic converter efficiency. Safe to drive, schedule service later.',
        followUp: 'notify_dispatch'
      },
      { 
        id: 'ignore', 
        text: 'Ignore it - probably nothing', 
        timePenalty: 0, 
        scorePenalty: 0, 
        risk: 25,
        riskOutcome: 'vehicle_breakdown',
        outcome: 'Light stays on. Fingers crossed.'
      },
      { 
        id: 'call_dispatch', 
        text: 'Call dispatch before departing', 
        timePenalty: 5, 
        scorePenalty: 0, 
        risk: 0,
        outcome: 'Dispatch confirms: drive it, we\'ll get it looked at tonight. Good call documenting it.',
        bonus: 2
      }
    ]
  },
  tire_issue: {
    id: 'tire_issue',
    name: 'Tire Problem',
    icon: '🛞',
    description: 'Right rear tire looks low - possible slow leak or damage',
    severity: 'high',
    detectableBy: ['tires'],
    resolutions: [
      { 
        id: 'check_pressure', 
        text: 'Check pressure and add air (+10 min)', 
        timePenalty: 10, 
        scorePenalty: 0, 
        risk: 15,
        riskOutcome: 'tire_blowout',
        outcome: 'Tire at 22 PSI - topped to 35. Monitor during drive.'
      },
      { 
        id: 'swap_spare', 
        text: 'Swap to spare tire now (+25 min)', 
        timePenalty: 25, 
        scorePenalty: 0, 
        risk: 0,
        outcome: 'Spare installed. Safe but running late.',
        bonus: 3
      },
      { 
        id: 'send_it', 
        text: 'Looks fine - send it', 
        timePenalty: 0, 
        scorePenalty: 0, 
        risk: 60,
        riskOutcome: 'tire_blowout',
        outcome: 'Drove off without checking.'
      }
    ]
  },
  unsecured_equipment: {
    id: 'unsecured_equipment',
    name: 'Unsecured Equipment',
    icon: '📦',
    description: 'Equipment shifted during previous drive - items loose in back',
    severity: 'moderate',
    detectableBy: ['equipment'],
    resolutions: [
      { 
        id: 'resecure', 
        text: 'Re-secure all equipment properly (+8 min)', 
        timePenalty: 8, 
        scorePenalty: 0, 
        risk: 0,
        outcome: 'Everything strapped down. Good to go.',
        bonus: 2
      },
      { 
        id: 'quick_check', 
        text: 'Quick visual - looks okay', 
        timePenalty: 2, 
        scorePenalty: 0, 
        risk: 30,
        riskOutcome: 'equipment_damage',
        outcome: 'Gave it a once-over. Should be fine.'
      },
      { 
        id: 'ignore_gear', 
        text: 'Just drive carefully', 
        timePenalty: 0, 
        scorePenalty: 0, 
        risk: 50,
        riskOutcome: 'equipment_damage',
        outcome: 'Hope nothing breaks on the way.'
      }
    ]
  }
};

const VEHICLE_RISK_OUTCOMES = {
  ran_out_of_fuel: {
    name: 'Ran Out of Fuel',
    description: 'Van sputtered to a stop 3 miles from job site. Call dispatch for rescue.',
    timePenalty: 45,
    scorePenalty: 15,
    phase: 'travel'
  },
  vehicle_breakdown: {
    name: 'Vehicle Breakdown',
    description: 'Engine started knocking on I-40. Had to pull over. Tow truck en route.',
    timePenalty: 120,
    scorePenalty: 20,
    phase: 'travel',
    critical: true
  },
  tire_blowout: {
    name: 'The "Will Scenario"',
    description: 'BANG! Right rear tire blew on the highway. Third van this month. Roadside tire change incoming.',
    timePenalty: 45,
    scorePenalty: 12,
    phase: 'travel'
  },
  equipment_damage: {
    name: 'Equipment Damaged',
    description: 'Vacuum hose got kinked under shifted equipment. Brush kit scattered. 15 minutes reorganizing at job site.',
    timePenalty: 15,
    scorePenalty: 8,
    phase: 'arrival'
  }
};

// Random mid-job events triggered by skipping inspection entirely
const SKIPPED_INSPECTION_EVENTS = [
  { ...VEHICLE_RISK_OUTCOMES.tire_blowout, probability: 0.3 },
  { ...VEHICLE_RISK_OUTCOMES.ran_out_of_fuel, probability: 0.25 },
  { ...VEHICLE_RISK_OUTCOMES.equipment_damage, probability: 0.35 },
  { ...VEHICLE_RISK_OUTCOMES.vehicle_breakdown, probability: 0.1 }
];

// ============================================================================
// REGISTER REMOVAL DATA
// ============================================================================

const REGISTER_CONDITIONS = {
  normal: { id: 'normal', name: 'Normal', weight: 60, icon: '🔲', description: 'Standard register with accessible screws', correctApproach: 'standard' },
  painted: { id: 'painted', name: 'Painted-Over Screws', weight: 15, icon: '🎨', description: 'Screws covered with multiple layers of paint', correctApproach: 'score_paint' },
  stripped: { id: 'stripped', name: 'Stripped Screw', weight: 10, icon: '⚙️', description: 'Screw head is stripped/damaged', correctApproach: 'extraction' },
  caulked: { id: 'caulked', name: 'Caulked to Wall', weight: 10, icon: '🔒', description: 'Register sealed with caulk around edges', correctApproach: 'knife_work' },
  brittle: { id: 'brittle', name: 'Brittle/Cracked', weight: 5, icon: '💔', description: 'Old plastic/metal is fragile and may break', correctApproach: 'document_skip' }
};

const REGISTER_APPROACHES = {
  standard: { id: 'standard', name: 'Standard Removal', icon: '🔧', description: 'Normal screwdriver removal' },
  score_paint: { id: 'score_paint', name: 'Score Paint First', icon: '🔪', description: 'Cut paint around screws before turning' },
  extraction: { id: 'extraction', name: 'Use Extraction Bit', icon: '🔩', description: 'Drill out or use screw extractor' },
  knife_work: { id: 'knife_work', name: 'Careful Knife Work', icon: '✂️', description: 'Cut caulk carefully to minimize wall damage' },
  document_skip: { id: 'document_skip', name: 'Document & Skip', icon: '📝', description: 'Photo condition, clean in place, note on invoice' }
};

const APPROACH_RESULTS = {
  normal: {
    standard: { success: true, message: 'Removed cleanly.', timePenalty: 0, damagePenalty: 0 },
    score_paint: { success: true, message: 'Unnecessary but no harm done.', timePenalty: 2, damagePenalty: 0 },
    extraction: { success: true, message: 'Overkill - damaged screw heads needlessly.', timePenalty: 3, damagePenalty: 5 },
    knife_work: { success: true, message: 'No caulk to cut - wasted time.', timePenalty: 2, damagePenalty: 0 },
    document_skip: { success: false, message: 'Skipped a normal register - unprofessional.', timePenalty: 0, damagePenalty: 8 }
  },
  painted: {
    standard: { success: false, message: 'Paint stripped, screw heads damaged. Should have scored first.', timePenalty: 5, damagePenalty: 8 },
    score_paint: { success: true, message: 'Paint scored cleanly, screws came out without damage.', timePenalty: 0, damagePenalty: 0 },
    extraction: { success: true, message: 'Worked but more aggressive than needed.', timePenalty: 3, damagePenalty: 3 },
    knife_work: { success: false, message: 'Wrong problem - these are painted screws, not caulk.', timePenalty: 3, damagePenalty: 5 },
    document_skip: { success: false, message: 'Painted screws are removable - just need scoring.', timePenalty: 0, damagePenalty: 8 }
  },
  stripped: {
    standard: { success: false, message: 'Screwdriver just spins. Screw is stripped.', timePenalty: 3, damagePenalty: 5 },
    score_paint: { success: false, message: 'No paint problem here - screw head is stripped.', timePenalty: 3, damagePenalty: 5 },
    extraction: { success: true, message: 'Extraction bit gripped and removed stripped screw.', timePenalty: 0, damagePenalty: 0 },
    knife_work: { success: false, message: 'Knife won\'t help a stripped screw.', timePenalty: 3, damagePenalty: 5 },
    document_skip: { success: true, message: 'Documented, left in place. Customer notified.', timePenalty: 0, damagePenalty: 2 }
  },
  caulked: {
    standard: { success: false, message: 'Can\'t get screwdriver in - caulk is blocking access.', timePenalty: 3, damagePenalty: 5 },
    score_paint: { success: false, message: 'This isn\'t paint, it\'s caulk sealing the whole register.', timePenalty: 3, damagePenalty: 5 },
    extraction: { success: false, message: 'Can\'t even reach the screws through the caulk.', timePenalty: 3, damagePenalty: 5 },
    knife_work: { success: true, message: 'Carefully cut caulk seal, register came free cleanly.', timePenalty: 0, damagePenalty: 0 },
    document_skip: { success: true, message: 'Noted caulked condition, cleaned through register grille.', timePenalty: 0, damagePenalty: 3 }
  },
  brittle: {
    standard: { success: false, message: 'Register cracked during removal!', timePenalty: 5, damagePenalty: 15 },
    score_paint: { success: false, message: 'Material too fragile - cracked when handled.', timePenalty: 5, damagePenalty: 15 },
    extraction: { success: false, message: 'Vibration from drill cracked the brittle material.', timePenalty: 5, damagePenalty: 15 },
    knife_work: { success: false, message: 'Even gentle prying caused cracks.', timePenalty: 3, damagePenalty: 10 },
    document_skip: { success: true, message: 'Smart call - photographed fragile condition, cleaned in place, noted on invoice.', timePenalty: 0, damagePenalty: 0 }
  }
};

function generateRegisterCondition() {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const [key, condition] of Object.entries(REGISTER_CONDITIONS)) {
    cumulative += condition.weight;
    if (roll < cumulative) return key;
  }
  return 'normal';
}

function generateRegistersForScenario(scenario) {
  const ducts = SCENARIO_DUCTS[scenario] || [];
  const registers = ducts
    .filter(d => d.type === 'supply' || d.type === 'return')
    .map(duct => ({
      id: `reg_${duct.id}`,
      ductId: duct.id,
      name: duct.name.replace('Supply', 'Register').replace('Return', 'Return Grille'),
      condition: generateRegisterCondition(),
      removed: false,
      damaged: false,
      screwCount: duct.type === 'return' ? 4 : 2,
      screwsRecovered: 0,
      skipped: false
    }));
  return registers;
}

const PROBLEM_SCENARIOS = {
  common: [
    { id: 'painted_screws', name: 'Painted-Over Screws', description: 'Register screws are painted over', solution: 'Score paint around screws before turning', phase: 'execution' },
    { id: 'stripped_screw', name: 'Stripped Screw', description: 'Screw head is stripped', solution: 'Use extraction bit or drill out', phase: 'execution' },
    { id: 'low_suction', name: 'Low Suction', description: 'Vacuum gauge shows below normal', solution: 'Check filter, inspect for hose leak or blockage', phase: 'execution' },
    { id: 'customer_complaint', name: 'Noise Complaint', description: '"It\'s too loud! How much longer?"', solution: 'De-escalate, provide timeline, offer ear protection', phase: 'execution' }
  ],
  residential: [
    { id: 'breaker_trip', name: 'Breaker Trip', description: 'Circuit breaker trips when equipment starts', solution: 'Find dedicated circuit or reduce load', phase: 'setup' },
    { id: 'flex_collapse', name: 'Flex Duct Collapse', description: 'Over-aggressive whipping collapsed the flex', solution: 'Document damage, notify customer - now a repair job', phase: 'execution', critical: true },
    { id: 'dog_escaped', name: 'Dog Got Out', description: 'Customer\'s dog escaped from backyard', solution: 'Stop work, help secure animal, verify containment before resuming', phase: 'execution' }
  ],
  commercial: [
    { id: 'roof_access_locked', name: 'Roof Hatch Locked', description: 'Roof access hatch is padlocked', solution: 'Call property manager for key or use exterior ladder', phase: 'setup' },
    { id: 'alarm_triggered', name: 'Alarm Triggered', description: 'Motion sensor set off building alarm', solution: 'Enter code immediately, call monitoring company if needed', phase: 'arrival' },
    { id: 'fire_damper', name: 'Fire Damper Blockage', description: 'Equipment cannot pass through fire damper', solution: 'Clean from both sides of damper', phase: 'execution' },
    { id: 'long_run_suction', name: 'Long Run Suction Loss', description: '60ft run causing significant suction drop', solution: 'Seal all other openings, consider secondary vacuum point', phase: 'execution' }
  ],
  courthouse: [
    { id: 'security_clearance', name: 'Security Clearance Hold', description: 'Security won\'t grant access to restricted floor', solution: 'Contact facilities manager, provide credentials, wait for escort', phase: 'arrival' },
    { id: 'court_in_session', name: 'Court In Session', description: 'Cannot work near active courtroom', solution: 'Work other areas, return during recess or after hours', phase: 'execution' },
    { id: 'historic_register', name: 'Historic Register Damage', description: 'Ornate brass register is fragile/irreplaceable', solution: 'Document condition first, clean in place if possible, photograph any concerns', phase: 'execution' },
    { id: 'asbestos_discovery', name: 'Suspected Asbestos', description: 'White putty at joints, building is pre-1980', solution: 'STOP WORK immediately, do not disturb, document and report', phase: 'execution', critical: true },
    { id: 'crew_coordination', name: 'Crew Miscommunication', description: 'Team member started wrong floor', solution: 'Radio to redirect, verify floor assignments, re-sync', phase: 'execution' }
  ]
};

const HAZARDS = [
  { id: 'mold', name: 'Visible Mold', description: 'Dark growth visible on duct surface', action: 'STOP WORK', protocol: 'Do not disturb. Document. Notify customer. Exit area.' },
  { id: 'asbestos', name: 'Asbestos-Suspect Material', description: 'White putty at joints, fibrous material', action: 'STOP WORK', protocol: 'Same as mold. Building likely pre-1980s.' },
  { id: 'dead_animal', name: 'Dead Animal', description: 'Decomposing remains in ductwork', action: 'PPE UPGRADE', protocol: 'Full PPE, careful removal, sanitization required.' }
];

const TOOLS = [
  { id: 'aggressive_whip', name: 'Aggressive Whip', icon: '🌀', desc: 'High-power for rigid metal' },
  { id: 'gentle_whip', name: 'Gentle Whip', icon: '💫', desc: 'Low-power for flex/lined' },
  { id: 'rotating_brush', name: 'Rotating Brush', icon: '🔄', desc: 'Deep clean rigid metal' },
  { id: 'air_wash', name: 'Air Wash Only', icon: '💨', desc: 'Non-contact, all types' }
];

// ============================================================================
// INITIAL STATE & REDUCER
// ============================================================================

const initialState = {
  phase: 0,
  subPhase: 0,
  scenario: null,
  score: 100,
  penalties: [],
  bonuses: [],
  equipment: {},
  checkedVehicle: false,
  vehicleInspectionComplete: false,
  vehicleEvent: null,
  vehicleEventResolved: false,
  vehicleRiskOutcome: null,
  skippedInspection: false,
  pendingRoadEvent: null,
  routePlanned: false,
  customerType: null,
  identifiedSystem: false,
  hazardsChecked: false,
  foundHazard: null,
  powerConnected: false,
  vacuumGauge: 'normal',
  ductsClean: {},
  ductsAirflowCorrect: {},
  problemsEncountered: [],
  problemsSolved: [],
  photosDocumented: false,
  customerWalkthrough: false,
  currentDialogue: null,
  dialogueHistory: [],
  currentDay: 1,
  totalDays: 1,
  crewAssigned: false,
  securityCleared: false,
  registers: [],
  screwInventory: 0,
  screwsNeeded: 0,
  registersRemoved: {},
  registerDamages: [],
  timeDelay: 0
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SELECT_SCENARIO':
      return { ...state, scenario: action.scenario };
    case 'START_GAME': {
      const customerPool = Object.entries(CUSTOMER_TYPES).filter(([k, v]) => v.scenarios.includes(state.scenario)).map(([k]) => k);
      const totalDays = state.scenario === 'courthouse' ? 3 : 1;
      const registers = generateRegistersForScenario(state.scenario);
      const screwsNeeded = registers.reduce((sum, r) => sum + r.screwCount, 0);
      return { 
        ...initialState, 
        phase: 1, 
        subPhase: 0, 
        scenario: state.scenario, 
        customerType: customerPool[Math.floor(Math.random() * customerPool.length)], 
        totalDays,
        registers,
        screwsNeeded,
        screwInventory: 0
      };
    }
    case 'SET_PHASE':
      return { ...state, phase: action.phase, subPhase: 0 };
    case 'SET_SUBPHASE':
      return { ...state, subPhase: action.subPhase };
    case 'TOGGLE_EQUIPMENT':
      return { ...state, equipment: { ...state.equipment, [action.item]: !state.equipment[action.item] } };
    case 'CHECK_VEHICLE':
      return { ...state, checkedVehicle: true };
    case 'SET_VEHICLE_EVENT':
      return { ...state, vehicleEvent: action.event };
    case 'RESOLVE_VEHICLE_EVENT':
      return { 
        ...state, 
        vehicleEventResolved: true,
        timeDelay: state.timeDelay + (action.timePenalty || 0)
      };
    case 'SET_VEHICLE_RISK_OUTCOME':
      return { 
        ...state, 
        vehicleRiskOutcome: action.outcome,
        timeDelay: state.timeDelay + (action.outcome?.timePenalty || 0)
      };
    case 'COMPLETE_VEHICLE_INSPECTION':
      return { ...state, vehicleInspectionComplete: true };
    case 'SKIP_INSPECTION':
      return { ...state, skippedInspection: true, vehicleInspectionComplete: true };
    case 'SET_PENDING_ROAD_EVENT':
      return { ...state, pendingRoadEvent: action.event };
    case 'CLEAR_ROAD_EVENT':
      return { ...state, pendingRoadEvent: null };
    case 'PLAN_ROUTE':
      return { ...state, routePlanned: true };
    case 'ADD_PENALTY':
      return { ...state, score: Math.max(0, state.score - action.points), penalties: [...state.penalties, { reason: action.reason, points: action.points }] };
    case 'ADD_BONUS':
      return { ...state, score: Math.min(100, state.score + action.points), bonuses: [...state.bonuses, { reason: action.reason, points: action.points }] };
    case 'ADD_TIME_DELAY':
      return { ...state, timeDelay: state.timeDelay + action.minutes };
    case 'IDENTIFY_SYSTEM':
      return { ...state, identifiedSystem: true };
    case 'CHECK_HAZARDS':
      return { ...state, hazardsChecked: true };
    case 'SET_FOUND_HAZARD':
      return { ...state, foundHazard: action.hazard };
    case 'CONNECT_POWER':
      return { ...state, powerConnected: true };
    case 'SET_VACUUM_GAUGE':
      return { ...state, vacuumGauge: action.reading };
    case 'SELECT_TOOL':
      return { ...state, currentTool: action.tool };
    case 'CLEAN_DUCT':
      return { ...state, ductsClean: { ...state.ductsClean, [action.duct]: action.quality } };
    case 'SET_AIRFLOW_CORRECT':
      return { ...state, ductsAirflowCorrect: { ...state.ductsAirflowCorrect, [action.duct]: action.correct } };
    case 'ENCOUNTER_PROBLEM':
      return { ...state, problemsEncountered: [...state.problemsEncountered, action.problem] };
    case 'SOLVE_PROBLEM':
      return { ...state, problemsSolved: [...state.problemsSolved, action.problem] };
    case 'DOCUMENT_PHOTOS':
      return { ...state, photosDocumented: true };
    case 'COMPLETE_WALKTHROUGH':
      return { ...state, customerWalkthrough: true };
    case 'SET_DIALOGUE':
      return { ...state, currentDialogue: action.dialogue };
    case 'CLEAR_SECURITY':
      return { ...state, securityCleared: true };
    case 'ASSIGN_CREW':
      return { ...state, crewAssigned: true };
    case 'NEXT_DAY':
      return { ...state, currentDay: state.currentDay + 1 };
    case 'COMPLETE_JOB':
      return { ...state, phase: 7 };
    case 'REMOVE_REGISTER': {
      const { registerId, screwsRecovered, damaged, skipped } = action;
      const updatedRegisters = state.registers.map(r => 
        r.id === registerId ? { ...r, removed: !skipped, damaged, skipped, screwsRecovered } : r
      );
      return {
        ...state,
        registers: updatedRegisters,
        registersRemoved: { ...state.registersRemoved, [registerId]: true },
        screwInventory: state.screwInventory + screwsRecovered,
        registerDamages: damaged ? [...state.registerDamages, registerId] : state.registerDamages
      };
    }
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

function DialogueBox({ dialogue, onChoice, customerType }) {
  if (!dialogue) return null;
  const customer = CUSTOMER_TYPES[customerType];
  return (
    <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-4">
      <div className="w-full max-w-3xl bg-zinc-900 border-2 border-yellow-500/50 rounded-lg overflow-hidden">
        {dialogue.speaker && (
          <div className="flex items-center gap-3 px-4 py-2 bg-zinc-800 border-b border-yellow-500/30">
            <span className="text-2xl">{dialogue.speaker === 'customer' ? customer?.avatar : '👷'}</span>
            <span className="font-bold text-yellow-400">{dialogue.speaker === 'customer' ? customer?.name : 'You'}</span>
          </div>
        )}
        <div className="p-4">
          <p className="text-lg text-zinc-100 mb-4 leading-relaxed">{dialogue.text}</p>
          {dialogue.choices ? (
            <div className="space-y-2">
              {dialogue.choices.map((choice, i) => (
                <button key={i} onClick={() => onChoice(choice)} className="w-full text-left px-4 py-3 bg-zinc-800 hover:bg-yellow-500/20 border border-zinc-700 hover:border-yellow-500 rounded transition-all text-zinc-200">
                  <span className="text-yellow-500 mr-2">{i + 1}.</span> {choice.text}
                </button>
              ))}
            </div>
          ) : (
            <button onClick={() => onChoice({ next: dialogue.next })} className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-bold rounded">
              Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PhaseHeader({ phase, scenario, currentDay, totalDays }) {
  const phases = [
    { num: 1, name: 'Pre-Job', icon: '📋' },
    { num: 2, name: 'Arrival', icon: '🏠' },
    { num: 3, name: 'Setup', icon: '🔌' },
    { num: 4, name: 'Execution', icon: '🔧' },
    { num: 5, name: 'Completion', icon: '✅' },
    { num: 6, name: 'Results', icon: '🎯' }
  ];
  return (
    <div className="mb-6">
      <div className="flex items-center justify-center gap-1 flex-wrap">
        {phases.map((p, i) => (
          <React.Fragment key={p.num}>
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${phase === p.num || (phase === 7 && p.num === 6) ? 'bg-yellow-500 text-zinc-900 font-bold' : phase > p.num ? 'bg-green-900/50 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
              <span>{p.icon}</span>
              <span className="hidden sm:inline">{p.name}</span>
            </div>
            {i < phases.length - 1 && <span className="text-zinc-600">→</span>}
          </React.Fragment>
        ))}
      </div>
      {totalDays > 1 && (
        <div className="text-center mt-2 text-sm text-zinc-400">
          Day {currentDay} of {totalDays} • {SCENARIOS[scenario]?.name}
        </div>
      )}
    </div>
  );
}

function ScoreBar({ state, dispatch }) {
  if (state.phase === 0 || state.phase === 7) return null;
  return (
    <div className="fixed top-0 left-0 right-0 bg-zinc-900 border-b border-yellow-500/30 px-4 py-2 z-40">
      <div className="max-w-5xl mx-auto flex justify-between items-center text-sm">
        <div className="flex items-center gap-3">
          <span className="text-yellow-400 font-bold">CQA TRAINING</span>
          <span className="text-zinc-500">|</span>
          <span className="text-zinc-400">{SCENARIOS[state.scenario]?.icon} {SCENARIOS[state.scenario]?.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-zinc-400">Score: <span className={state.score >= 80 ? 'text-green-400' : state.score >= 60 ? 'text-yellow-400' : 'text-red-400'}>{state.score}</span>/100</span>
          {state.timeDelay > 0 && (
            <span className="text-orange-400">⏱️ +{state.timeDelay}min</span>
          )}
          {state.phase === 3 && state.subPhase === 1 && (
            <span className="text-zinc-500">🔩 Screws: {state.screwInventory}</span>
          )}
          <button onClick={() => dispatch({ type: 'RESET' })} className="text-zinc-500 hover:text-red-400">✕ Exit</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PHASE 1: PRE-JOB PREPARATION
// ============================================================================

function JobBriefing({ state, dispatch }) {
  const job = JOB_TICKETS[state.scenario];
  const [reviewed, setReviewed] = useState({ ticket: false, notes: false, special: false });
  const allReviewed = Object.values(reviewed).every(v => v);
  
  return (
    <div className="space-y-4">
      <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
        <h3 className="text-yellow-400 font-bold mb-4">📋 Job Ticket Review</h3>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="bg-zinc-900 rounded p-3 border border-zinc-700">
            <p className="text-zinc-400 text-xs mb-1">Customer</p>
            <p className="text-zinc-100 font-bold">{job.customer}</p>
            <p className="text-zinc-400 text-sm">{job.contactName}</p>
            <p className="text-zinc-500 text-sm">{job.phone}</p>
          </div>
          <div className="bg-zinc-900 rounded p-3 border border-zinc-700">
            <p className="text-zinc-400 text-xs mb-1">Address</p>
            <p className="text-zinc-100">{job.address}</p>
            <p className="text-zinc-500 text-sm mt-1">{job.mapDistance} away</p>
          </div>
          <div className="bg-zinc-900 rounded p-3 border border-zinc-700">
            <p className="text-zinc-400 text-xs mb-1">System</p>
            <p className="text-zinc-100">{job.system}</p>
            <p className="text-zinc-500 text-sm">{job.sqft} sq ft</p>
          </div>
          <div className="bg-zinc-900 rounded p-3 border border-zinc-700">
            <p className="text-zinc-400 text-xs mb-1">Time Estimate</p>
            <p className="text-zinc-100">{job.estimatedTime}</p>
          </div>
        </div>
        <div className="space-y-3">
          <button onClick={() => setReviewed(r => ({ ...r, ticket: true }))} className={`w-full p-3 rounded border text-left ${reviewed.ticket ? 'bg-green-900/30 border-green-500' : 'bg-zinc-900 border-zinc-700 hover:border-yellow-500'}`}>
            <span className={reviewed.ticket ? 'text-green-400' : 'text-zinc-300'}>📄 Basic Info</span>
            {reviewed.ticket && <span className="text-green-400 float-right">✓</span>}
          </button>
          <button onClick={() => setReviewed(r => ({ ...r, notes: true }))} className={`w-full p-3 rounded border text-left ${reviewed.notes ? 'bg-green-900/30 border-green-500' : 'bg-zinc-900 border-zinc-700 hover:border-yellow-500'}`}>
            <span className={reviewed.notes ? 'text-green-400' : 'text-zinc-300'}>📝 Notes: {job.notes}</span>
            {reviewed.notes && <span className="text-green-400 float-right">✓</span>}
          </button>
          <button onClick={() => setReviewed(r => ({ ...r, special: true }))} className={`w-full p-3 rounded border text-left ${reviewed.special ? 'bg-green-900/30 border-green-500' : 'bg-zinc-900 border-zinc-700 hover:border-yellow-500'}`}>
            <div className={reviewed.special ? 'text-green-400' : 'text-zinc-300'}>
              ⚠️ Special Considerations:
              <ul className="mt-1 ml-4 text-sm list-disc">
                {job.specialConsiderations.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
            {reviewed.special && <span className="text-green-400 float-right">✓</span>}
          </button>
        </div>
      </div>
      <button onClick={() => { if (allReviewed) { dispatch({ type: 'ADD_BONUS', reason: 'Thorough job review', points: 2 }); } dispatch({ type: 'SET_SUBPHASE', subPhase: 1 }); }} className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-bold rounded">
        {allReviewed ? 'Continue to Equipment →' : 'Skip Review (Not Recommended) →'}
      </button>
    </div>
  );
}

function EquipmentLoadout({ state, dispatch }) {
  const baseCategories = EQUIPMENT_CATEGORIES;
  const scenarioCategories = SCENARIO_EQUIPMENT[state.scenario] || {};
  const allCategories = { ...baseCategories, ...scenarioCategories };
  
  const checkLoadout = () => {
    let criticalMissing = false;
    Object.entries(allCategories).forEach(([catKey, cat]) => {
      const missing = cat.items.filter(item => !state.equipment[item]);
      if (missing.length > 0) {
        if (cat.penalty === 'critical') criticalMissing = true;
        dispatch({ type: 'ADD_PENALTY', reason: `Missing ${cat.name}: ${missing.join(', ')}`, points: cat.penalty === 'critical' ? 20 : cat.penalty === 'delay' ? 10 : cat.penalty === 'violation' ? 8 : 3 });
      }
    });
    if (!criticalMissing) {
      dispatch({ type: 'ADD_BONUS', reason: 'Complete equipment loadout', points: 5 });
    }
    dispatch({ type: 'SET_SUBPHASE', subPhase: 2 });
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
        <h3 className="text-yellow-400 font-bold mb-2">🧰 Equipment Load-Out</h3>
        <p className="text-zinc-400 text-sm mb-4">Select all equipment needed for this job. Missing critical items will prevent job completion.</p>
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(allCategories).map(([catKey, cat]) => (
            <div key={catKey} className="bg-zinc-900 rounded p-3 border border-zinc-700">
              <h4 className="text-zinc-300 font-bold text-sm mb-2">{cat.name}</h4>
              <div className="space-y-1">
                {cat.items.map(item => (
                  <label key={item} className="flex items-center gap-2 cursor-pointer hover:bg-zinc-800 p-1 rounded">
                    <input type="checkbox" checked={state.equipment[item] || false} onChange={() => dispatch({ type: 'TOGGLE_EQUIPMENT', item })} className="rounded" />
                    <span className={`text-sm ${state.equipment[item] ? 'text-green-400' : 'text-zinc-400'}`}>{item}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-zinc-500 mt-2 italic">Missing = {cat.penaltyText}</p>
            </div>
          ))}
        </div>
      </div>
      <button onClick={checkLoadout} className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-bold rounded">
        Lock In Equipment →
      </button>
    </div>
  );
}

// ============================================================================
// VEHICLE CHECK - EXPANDED WITH RANDOM EVENTS
// ============================================================================

function VehicleCheck({ state, dispatch }) {
  const [inspectionState, setInspectionState] = useState('initial'); // initial, inspecting, event_found, resolved, skipped
  const [checksPerformed, setChecksPerformed] = useState({ fuel: false, tires: false, equipment: false, lights: false });
  const [currentEvent, setCurrentEvent] = useState(null);
  const [selectedResolution, setSelectedResolution] = useState(null);
  const [resolutionOutcome, setResolutionOutcome] = useState(null);
  const [riskTriggered, setRiskTriggered] = useState(false);

  const checkItems = [
    { key: 'fuel', label: '⛽ Fuel Level', desc: 'Check gauge - tank above 1/4?' },
    { key: 'tires', label: '🛞 Tire Condition', desc: 'Walk around - pressure & tread OK?' },
    { key: 'equipment', label: '📦 Equipment Secured', desc: 'Open back - nothing loose?' },
    { key: 'lights', label: '💡 Lights & Signals', desc: 'Start engine - dashboard clear?' }
  ];

  const performCheck = (checkKey) => {
    if (checksPerformed[checkKey]) return;
    
    const newChecks = { ...checksPerformed, [checkKey]: true };
    setChecksPerformed(newChecks);
    
    // 30% chance of finding an issue when checking the relevant item
    const roll = Math.random();
    if (roll < 0.30) {
      // Find an event detectable by this check
      const applicableEvents = Object.values(VEHICLE_EVENTS).filter(e => 
        e.detectableBy.includes(checkKey)
      );
      if (applicableEvents.length > 0 && !currentEvent) {
        const event = applicableEvents[Math.floor(Math.random() * applicableEvents.length)];
        setCurrentEvent(event);
        setInspectionState('event_found');
        dispatch({ type: 'SET_VEHICLE_EVENT', event: event.id });
      }
    }
  };

  const handleResolution = (resolution) => {
    setSelectedResolution(resolution);
    
    // Check if risk triggers
    if (resolution.risk > 0) {
      const riskRoll = Math.random() * 100;
      if (riskRoll < resolution.risk) {
        // Risk triggered - bad outcome will happen during travel
        const outcome = VEHICLE_RISK_OUTCOMES[resolution.riskOutcome];
        setRiskTriggered(true);
        dispatch({ type: 'SET_PENDING_ROAD_EVENT', event: outcome });
        setResolutionOutcome({
          text: resolution.outcome,
          delayed: true,
          delayedOutcome: outcome
        });
      } else {
        setResolutionOutcome({ text: resolution.outcome, delayed: false });
      }
    } else {
      setResolutionOutcome({ text: resolution.outcome, delayed: false });
    }

    // Apply immediate effects
    if (resolution.timePenalty > 0) {
      dispatch({ type: 'ADD_TIME_DELAY', minutes: resolution.timePenalty });
    }
    if (resolution.scorePenalty > 0) {
      dispatch({ type: 'ADD_PENALTY', reason: 'Vehicle issue handling', points: resolution.scorePenalty });
    }
    if (resolution.bonus) {
      dispatch({ type: 'ADD_BONUS', reason: 'Proactive vehicle maintenance', points: resolution.bonus });
    }

    dispatch({ type: 'RESOLVE_VEHICLE_EVENT', timePenalty: resolution.timePenalty });
    setInspectionState('resolved');
  };

  const handleSkipInspection = () => {
    dispatch({ type: 'ADD_PENALTY', reason: 'Skipped vehicle inspection', points: 5 });
    dispatch({ type: 'SKIP_INSPECTION' });
    
    // Guaranteed bad event during travel
    const totalProb = SKIPPED_INSPECTION_EVENTS.reduce((sum, e) => sum + e.probability, 0);
    let roll = Math.random() * totalProb;
    let selectedEvent = SKIPPED_INSPECTION_EVENTS[0];
    for (const event of SKIPPED_INSPECTION_EVENTS) {
      roll -= event.probability;
      if (roll <= 0) {
        selectedEvent = event;
        break;
      }
    }
    dispatch({ type: 'SET_PENDING_ROAD_EVENT', event: selectedEvent });
    setInspectionState('skipped');
  };

  const handleComplete = () => {
    if (!currentEvent) {
      // No issues found - all clear
      dispatch({ type: 'ADD_BONUS', reason: 'Complete pre-trip inspection', points: 3 });
    }
    dispatch({ type: 'COMPLETE_VEHICLE_INSPECTION' });
    dispatch({ type: 'CHECK_VEHICLE' });
    dispatch({ type: 'SET_SUBPHASE', subPhase: 3 });
  };

  const handleContinueAfterResolution = () => {
    dispatch({ type: 'COMPLETE_VEHICLE_INSPECTION' });
    dispatch({ type: 'CHECK_VEHICLE' });
    dispatch({ type: 'SET_SUBPHASE', subPhase: 3 });
  };

  const handleContinueAfterSkip = () => {
    dispatch({ type: 'SET_SUBPHASE', subPhase: 3 });
  };

  const allChecked = Object.values(checksPerformed).every(v => v);
  const someChecked = Object.values(checksPerformed).some(v => v);

  // Render: Event found - show resolution options
  if (inspectionState === 'event_found' && currentEvent) {
    return (
      <div className="space-y-4">
        <div className="bg-red-900/30 border-2 border-red-500 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">{currentEvent.icon}</span>
            <div>
              <h3 className="text-red-400 font-bold text-lg">{currentEvent.name}</h3>
              <p className="text-zinc-300">{currentEvent.description}</p>
            </div>
          </div>
          
          <div className="bg-zinc-900/50 rounded p-3 mb-4">
            <p className="text-zinc-400 text-sm">
              <span className="text-yellow-400 font-bold">Severity:</span>{' '}
              <span className={currentEvent.severity === 'high' ? 'text-red-400' : currentEvent.severity === 'moderate' ? 'text-orange-400' : 'text-yellow-400'}>
                {currentEvent.severity.toUpperCase()}
              </span>
            </p>
          </div>

          <h4 className="text-yellow-400 font-bold mb-3">How do you handle this?</h4>
          <div className="space-y-2">
            {currentEvent.resolutions.map((resolution) => (
              <button
                key={resolution.id}
                onClick={() => handleResolution(resolution)}
                className="w-full p-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 hover:border-yellow-500 rounded-lg text-left transition-all"
              >
                <p className="text-zinc-100 font-medium">{resolution.text}</p>
                <div className="flex gap-4 mt-2 text-xs">
                  {resolution.timePenalty > 0 && (
                    <span className="text-orange-400">⏱️ +{resolution.timePenalty} min</span>
                  )}
                  {resolution.risk > 0 && (
                    <span className="text-red-400">⚠️ {resolution.risk}% risk</span>
                  )}
                  {resolution.bonus && (
                    <span className="text-green-400">✨ +{resolution.bonus} pts</span>
                  )}
                  {resolution.risk === 0 && !resolution.timePenalty && !resolution.bonus && (
                    <span className="text-zinc-500">Safe choice</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render: Resolution outcome
  if (inspectionState === 'resolved' && resolutionOutcome) {
    return (
      <div className="space-y-4">
        <div className={`border-2 rounded-lg p-4 ${riskTriggered ? 'bg-orange-900/30 border-orange-500' : 'bg-green-900/30 border-green-500'}`}>
          <h3 className={`font-bold text-lg mb-3 ${riskTriggered ? 'text-orange-400' : 'text-green-400'}`}>
            {riskTriggered ? '⚠️ Resolution Applied' : '✅ Issue Handled'}
          </h3>
          <p className="text-zinc-200 mb-4">{resolutionOutcome.text}</p>
          
          {riskTriggered && resolutionOutcome.delayedOutcome && (
            <div className="bg-red-900/40 border border-red-500/50 rounded p-3 mt-3">
              <p className="text-red-300 text-sm">
                <span className="font-bold">⚠️ Warning:</span> Your choice carries risk. 
                Something might happen on the road...
              </p>
            </div>
          )}

          {selectedResolution?.timePenalty > 0 && (
            <p className="text-orange-400 text-sm">⏱️ Added {selectedResolution.timePenalty} minutes to travel time</p>
          )}
          {selectedResolution?.bonus && (
            <p className="text-green-400 text-sm">✨ Earned {selectedResolution.bonus} bonus points</p>
          )}
        </div>
        
        <button 
          onClick={handleContinueAfterResolution}
          className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-bold rounded"
        >
          Continue to Route Planning →
        </button>
      </div>
    );
  }

  // Render: Skipped inspection warning
  if (inspectionState === 'skipped') {
    return (
      <div className="space-y-4">
        <div className="bg-red-900/30 border-2 border-red-500 rounded-lg p-4">
          <h3 className="text-red-400 font-bold text-lg mb-3">⚠️ Inspection Skipped</h3>
          <p className="text-zinc-300 mb-4">
            You skipped the pre-trip inspection. Any existing issues will go undetected until they become problems on the road.
          </p>
          <div className="bg-zinc-900/50 rounded p-3">
            <p className="text-red-300 text-sm">
              <span className="font-bold">Penalty:</span> -5 points<br/>
              <span className="font-bold">Risk:</span> Increased chance of roadside emergency
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleContinueAfterSkip}
          className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-bold rounded"
        >
          Continue to Route Planning →
        </button>
      </div>
    );
  }

  // Render: Main inspection interface
  return (
    <div className="space-y-4">
      <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
        <h3 className="text-yellow-400 font-bold mb-2">🚚 Pre-Trip Vehicle Inspection</h3>
        <p className="text-zinc-400 text-sm mb-4">
          Walk around the vehicle and check each item. Issues may be discovered during inspection.
          <span className="text-orange-400 ml-1">Skipping entirely guarantees problems on the road.</span>
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {checkItems.map(check => (
            <button
              key={check.key}
              onClick={() => performCheck(check.key)}
              disabled={checksPerformed[check.key]}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                checksPerformed[check.key] 
                  ? 'bg-green-900/30 border-green-500 cursor-default' 
                  : 'bg-zinc-900 border-zinc-700 hover:border-yellow-500 hover:bg-zinc-800'
              }`}
            >
              <p className="font-bold text-zinc-200">{check.label}</p>
              <p className="text-xs text-zinc-500 mt-1">{check.desc}</p>
              {checksPerformed[check.key] && (
                <p className="text-green-400 text-sm mt-2">✓ Inspected - OK</p>
              )}
            </button>
          ))}
        </div>

        {someChecked && !allChecked && (
          <div className="mt-4 bg-blue-900/20 border border-blue-500/30 rounded p-3">
            <p className="text-blue-300 text-sm">
              💡 {Object.values(checksPerformed).filter(v => v).length}/4 items checked. 
              Continue inspecting or proceed with partial check.
            </p>
          </div>
        )}

        {allChecked && !currentEvent && (
          <div className="mt-4 bg-green-900/20 border border-green-500/30 rounded p-3">
            <p className="text-green-300 text-sm">
              ✅ Full inspection complete. No issues found. Vehicle ready.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={handleSkipInspection}
          className="py-3 bg-red-900/50 hover:bg-red-800/50 border border-red-500/50 text-red-300 font-bold rounded"
        >
          Skip Inspection ⚠️
        </button>
        <button 
          onClick={handleComplete}
          disabled={!someChecked}
          className={`py-3 font-bold rounded transition-all ${
            allChecked 
              ? 'bg-green-600 hover:bg-green-500 text-white' 
              : someChecked 
                ? 'bg-yellow-500 hover:bg-yellow-400 text-zinc-900'
                : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
          }`}
        >
          {allChecked ? '✓ All Clear - Continue →' : someChecked ? 'Continue (Partial) →' : 'Inspect First'}
        </button>
      </div>
    </div>
  );
}

function RoutePlanning({ state, dispatch }) {
  const job = JOB_TICKETS[state.scenario];
  const [planned, setPlanned] = useState(false);
  const [showRoadEvent, setShowRoadEvent] = useState(false);
  const [roadEventAcknowledged, setRoadEventAcknowledged] = useState(false);

  const handleDepart = () => {
    if (state.pendingRoadEvent && !roadEventAcknowledged) {
      setShowRoadEvent(true);
      dispatch({ type: 'ADD_PENALTY', reason: state.pendingRoadEvent.name, points: state.pendingRoadEvent.scorePenalty });
      dispatch({ type: 'ADD_TIME_DELAY', minutes: state.pendingRoadEvent.timePenalty });
    } else {
      dispatch({ type: 'SET_PHASE', phase: 2 });
    }
  };

  const acknowledgeRoadEvent = () => {
    setRoadEventAcknowledged(true);
    setShowRoadEvent(false);
    dispatch({ type: 'CLEAR_ROAD_EVENT' });
    dispatch({ type: 'SET_PHASE', phase: 2 });
  };

  // Show road event modal
  if (showRoadEvent && state.pendingRoadEvent) {
    const event = state.pendingRoadEvent;
    return (
      <div className="space-y-4">
        <div className="bg-red-900/40 border-2 border-red-500 rounded-lg p-6">
          <div className="text-center mb-4">
            <span className="text-6xl">🚨</span>
          </div>
          <h3 className="text-red-400 font-bold text-xl text-center mb-3">{event.name}</h3>
          <p className="text-zinc-200 text-center mb-6">{event.description}</p>
          
          <div className="bg-zinc-900/50 rounded p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-zinc-500 text-sm">Time Lost</p>
                <p className="text-orange-400 font-bold text-xl">+{event.timePenalty} min</p>
              </div>
              <div>
                <p className="text-zinc-500 text-sm">Score Penalty</p>
                <p className="text-red-400 font-bold text-xl">-{event.scorePenalty} pts</p>
              </div>
            </div>
          </div>

          {state.skippedInspection && (
            <div className="bg-orange-900/30 border border-orange-500/50 rounded p-3 mb-4">
              <p className="text-orange-300 text-sm text-center">
                ⚠️ This could have been prevented with a proper pre-trip inspection.
              </p>
            </div>
          )}

          <button 
            onClick={acknowledgeRoadEvent}
            className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-bold rounded"
          >
            Deal With It & Continue →
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
        <h3 className="text-yellow-400 font-bold mb-4">🗺️ Route Planning</h3>
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-zinc-400">Distance:</span>
            <span className="text-zinc-200 font-mono">{job.mapDistance}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-zinc-400">Estimated Time:</span>
            <span className="text-zinc-200 font-mono">{job.estimatedTime}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Parking:</span>
            <span className="text-zinc-200 text-sm">{job.parking}</span>
          </div>
          {state.timeDelay > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-700">
              <div className="flex items-center justify-between">
                <span className="text-orange-400">Delay Accumulated:</span>
                <span className="text-orange-400 font-mono">+{state.timeDelay} min</span>
              </div>
            </div>
          )}
        </div>
        {state.scenario === 'courthouse' && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3 mb-4">
            <p className="text-blue-300 text-sm"><span className="font-bold">💡 Pro Tip:</span> Church Street Garage is $9/day. Account for walking distance to building entrance.</p>
          </div>
        )}
        {state.pendingRoadEvent && (
          <div className="bg-red-900/20 border border-red-500/30 rounded p-3 mb-4">
            <p className="text-red-300 text-sm">
              <span className="font-bold">⚠️ Warning:</span> There may be trouble ahead on the road...
            </p>
          </div>
        )}
        <button onClick={() => { setPlanned(true); dispatch({ type: 'PLAN_ROUTE' }); }} className={`w-full py-3 rounded font-bold transition-all ${planned ? 'bg-green-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'}`}>
          {planned ? '✓ Route Confirmed' : '📍 Confirm Route'}
        </button>
      </div>
      <button onClick={handleDepart} disabled={!planned} className={`w-full py-3 font-bold rounded transition-all ${planned ? 'bg-yellow-500 hover:bg-yellow-400 text-zinc-900' : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'}`}>
        Depart for Job Site →
      </button>
    </div>
  );
}

// ============================================================================
// PHASE 2: ARRIVAL & ASSESSMENT
// ============================================================================

function FirstContact({ state, dispatch }) {
  const customer = CUSTOMER_TYPES[state.customerType];
  const dialogueTree = DIALOGUE_TREES[state.customerType];

  const [currentNodeId, setCurrentNodeId] = useState(dialogueTree?.start || 'greeting');
  const [scoreHistory, setScoreHistory] = useState([]);
  const [showingFeedback, setShowingFeedback] = useState(false);
  const [lastChoice, setLastChoice] = useState(null);
  const [dialogueComplete, setDialogueComplete] = useState(false);

  const currentNode = dialogueTree?.nodes[currentNodeId];

  const handleChoice = (choice) => {
    // Record this choice for feedback
    setLastChoice(choice);
    setShowingFeedback(true);

    // Apply score immediately
    if (choice.score > 0) {
      dispatch({ type: 'ADD_BONUS', reason: choice.reason || 'Good customer interaction', points: choice.score });
    } else if (choice.score < 0) {
      dispatch({ type: 'ADD_PENALTY', reason: choice.reason || 'Poor customer interaction', points: Math.abs(choice.score) });
    }

    // Track score history for summary
    if (choice.score !== 0) {
      setScoreHistory(prev => [...prev, { score: choice.score, reason: choice.reason }]);
    }
  };

  const handleContinue = () => {
    setShowingFeedback(false);

    if (lastChoice.next) {
      // Navigate to next node
      setCurrentNodeId(lastChoice.next);
      setLastChoice(null);
    } else {
      // Dialogue complete - show summary then transition
      setDialogueComplete(true);
    }
  };

  const handleFinish = () => {
    dispatch({ type: 'SET_SUBPHASE', subPhase: 1 });
  };

  // Calculate total score impact
  const totalScore = scoreHistory.reduce((sum, item) => sum + item.score, 0);

  // Dialogue complete - show summary
  if (dialogueComplete) {
    return (
      <div className="space-y-4">
        <div className={`border-2 rounded-lg p-6 ${totalScore >= 5 ? 'bg-green-900/30 border-green-500' : totalScore >= 0 ? 'bg-zinc-800/50 border-yellow-500/50' : 'bg-red-900/30 border-red-500'}`}>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl">{customer.avatar}</span>
            <div>
              <h3 className={`font-bold text-xl ${totalScore >= 5 ? 'text-green-400' : totalScore >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                First Contact Complete
              </h3>
              <p className="text-zinc-400">{customer.name}</p>
            </div>
          </div>

          {scoreHistory.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-zinc-500 text-sm font-bold uppercase">Conversation Impact:</p>
              {scoreHistory.map((item, i) => (
                <div key={i} className={`flex justify-between text-sm px-3 py-1 rounded ${item.score > 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                  <span>{item.reason}</span>
                  <span className="font-bold">{item.score > 0 ? '+' : ''}{item.score}</span>
                </div>
              ))}
            </div>
          )}

          <div className={`text-center py-3 rounded ${totalScore >= 5 ? 'bg-green-900/50' : totalScore >= 0 ? 'bg-zinc-900' : 'bg-red-900/50'}`}>
            <p className="text-zinc-400 text-sm">Rapport Score</p>
            <p className={`text-2xl font-bold ${totalScore >= 5 ? 'text-green-400' : totalScore >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
              {totalScore >= 5 ? 'Excellent' : totalScore >= 2 ? 'Good' : totalScore >= 0 ? 'Neutral' : totalScore >= -5 ? 'Strained' : 'Poor'}
            </p>
            <p className={`text-sm ${totalScore >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalScore > 0 ? '+' : ''}{totalScore} points
            </p>
          </div>
        </div>
        <button onClick={handleFinish} className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-bold rounded">
          Continue to Site Survey →
        </button>
      </div>
    );
  }

  // Showing feedback after a choice
  if (showingFeedback && lastChoice) {
    return (
      <div className="space-y-4">
        <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">👷</span>
            <div className="flex-1">
              <p className="text-zinc-500 text-xs uppercase">Your Response</p>
              <p className="text-zinc-200">{lastChoice.text}</p>
            </div>
          </div>

          {lastChoice.score !== 0 && (
            <div className={`p-3 rounded-lg ${lastChoice.score > 0 ? 'bg-green-900/30 border border-green-500/50' : 'bg-red-900/30 border border-red-500/50'}`}>
              <div className="flex justify-between items-center">
                <span className={lastChoice.score > 0 ? 'text-green-400' : 'text-red-400'}>
                  {lastChoice.score > 0 ? '✓' : '✗'} {lastChoice.reason}
                </span>
                <span className={`font-bold ${lastChoice.score > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {lastChoice.score > 0 ? '+' : ''}{lastChoice.score}
                </span>
              </div>
            </div>
          )}

          <button onClick={handleContinue} className="w-full mt-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-bold rounded">
            {lastChoice.next ? 'Continue Conversation →' : 'Finish Conversation →'}
          </button>
        </div>
      </div>
    );
  }

  // Show current dialogue node
  if (!currentNode) return null;

  return (
    <div className="space-y-4">
      <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
        <h3 className="text-yellow-400 font-bold mb-4">🤝 First Contact</h3>

        {/* Customer info */}
        <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded border border-zinc-700 mb-4">
          <span className="text-3xl">{customer.avatar}</span>
          <div>
            <p className="text-zinc-200 font-bold">{customer.name}</p>
            <p className="text-zinc-500 text-sm">{SCENARIOS[state.scenario]?.name}</p>
          </div>
        </div>

        {/* Dialogue bubble */}
        <div className="bg-zinc-900 rounded-lg p-4 border-l-4 border-yellow-500 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{currentNode.speaker === 'customer' ? customer.avatar : currentNode.speaker === 'system' ? '📱' : '👷'}</span>
            <span className="text-zinc-400 text-sm font-bold">
              {currentNode.speaker === 'customer' ? customer.name : currentNode.speaker === 'system' ? 'System' : 'You'}
            </span>
          </div>
          <p className="text-zinc-100 leading-relaxed">{currentNode.text}</p>
        </div>

        {/* Response choices */}
        <div className="space-y-2">
          <p className="text-zinc-500 text-sm">Choose your response:</p>
          {currentNode.choices.map((choice, i) => (
            <button
              key={i}
              onClick={() => handleChoice(choice)}
              className="w-full p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-yellow-500 rounded-lg text-left transition-all group"
            >
              <div className="flex items-start gap-3">
                <span className="text-yellow-500 font-bold">{i + 1}.</span>
                <span className="text-zinc-200 group-hover:text-zinc-100">{choice.text}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Score tracker */}
      {scoreHistory.length > 0 && (
        <div className="bg-zinc-900 rounded p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Conversation Progress</span>
            <span className={totalScore >= 0 ? 'text-green-400' : 'text-red-400'}>
              {totalScore > 0 ? '+' : ''}{totalScore} pts
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function SiteSurvey({ state, dispatch }) {
  const [identified, setIdentified] = useState(false);
  const systems = [
    { id: 'split', name: 'Residential Split System', desc: 'Air handler + outdoor condenser', icon: '🏠' },
    { id: 'rtu', name: 'Rooftop Unit (RTU)', desc: 'Packaged unit on roof', icon: '🏢' },
    { id: 'ptac', name: 'PTAC/Fan Coil', desc: 'Individual wall units', icon: '🏛️' },
    { id: 'vav', name: 'VAV System', desc: 'Variable air volume with boxes', icon: '🏗️' }
  ];
  const correctSystem = SCENARIOS[state.scenario]?.systemType;
  
  const handleIdentify = (systemId) => {
    if (systemId === correctSystem) {
      dispatch({ type: 'ADD_BONUS', reason: 'Correct system identification', points: 5 });
      dispatch({ type: 'IDENTIFY_SYSTEM' });
    } else {
      dispatch({ type: 'ADD_PENALTY', reason: 'Misidentified system type', points: 5 });
    }
    setIdentified(true);
    setTimeout(() => dispatch({ type: 'SET_SUBPHASE', subPhase: 2 }), 1500);
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
        <h3 className="text-yellow-400 font-bold mb-4">🔍 System Identification</h3>
        <p className="text-zinc-400 text-sm mb-4">Based on your site survey, identify the HVAC system type:</p>
        <div className="grid grid-cols-2 gap-3">
          {systems.map(sys => (
            <button key={sys.id} onClick={() => !identified && handleIdentify(sys.id)} disabled={identified} className={`p-4 rounded-lg border-2 text-center transition-all ${identified && sys.id === correctSystem ? 'bg-green-900/30 border-green-500' : identified && sys.id !== correctSystem ? 'opacity-50 border-zinc-700' : 'bg-zinc-900 border-zinc-700 hover:border-yellow-500'}`}>
              <span className="text-3xl">{sys.icon}</span>
              <p className="text-zinc-200 font-bold mt-2">{sys.name}</p>
              <p className="text-xs text-zinc-500">{sys.desc}</p>
            </button>
          ))}
        </div>
        {identified && (
          <div className={`mt-4 p-3 rounded ${state.identifiedSystem ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
            {state.identifiedSystem ? '✓ Correct! Proceeding to hazard check...' : '✗ Incorrect identification. Proceeding anyway...'}
          </div>
        )}
      </div>
    </div>
  );
}

function HazardCheck({ state, dispatch }) {
  const [checked, setChecked] = useState({ visual: false, age: false, material: false });
  const [hazardFound, setHazardFound] = useState(false);
  const allChecked = Object.values(checked).every(v => v);
  
  // 10% chance of finding a hazard
  const checkForHazard = () => {
    if (Math.random() < 0.10) {
      const hazard = HAZARDS[Math.floor(Math.random() * HAZARDS.length)];
      dispatch({ type: 'SET_FOUND_HAZARD', hazard });
      setHazardFound(true);
    }
  };
  
  const handleCheck = (checkType) => {
    setChecked(c => ({ ...c, [checkType]: true }));
    if (checkType === 'visual') checkForHazard();
  };
  
  const handleContinue = () => {
    dispatch({ type: 'CHECK_HAZARDS' });
    if (allChecked) {
      dispatch({ type: 'ADD_BONUS', reason: 'Thorough hazard assessment', points: 3 });
    }
    dispatch({ type: 'SET_PHASE', phase: 3 });
  };
  
  if (hazardFound && state.foundHazard) {
    return (
      <div className="space-y-4">
        <div className="bg-red-900/30 border-2 border-red-500 rounded-lg p-6 text-center">
          <span className="text-5xl">🛑</span>
          <h3 className="text-red-400 font-bold text-xl mt-4">{state.foundHazard.name}</h3>
          <p className="text-zinc-300 mt-2">{state.foundHazard.description}</p>
          <div className="bg-zinc-900 rounded p-4 mt-4">
            <p className="text-yellow-400 font-bold">Required Action: {state.foundHazard.action}</p>
            <p className="text-zinc-400 text-sm mt-2">{state.foundHazard.protocol}</p>
          </div>
          <button onClick={() => { dispatch({ type: 'ADD_BONUS', reason: 'Correct hazard response', points: 10 }); dispatch({ type: 'COMPLETE_JOB' }); }} className="mt-4 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded">
            Stop Work & Document →
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
        <h3 className="text-yellow-400 font-bold mb-4">⚠️ Hazard Assessment</h3>
        <p className="text-zinc-400 text-sm mb-4">Check for stop-work conditions before proceeding:</p>
        <div className="space-y-3">
          {[{ key: 'visual', label: '👁️ Visual Inspection', desc: 'Look for mold, discoloration, unusual growth' }, { key: 'age', label: '📅 Building Age Check', desc: 'Pre-1980 = asbestos risk' }, { key: 'material', label: '🔬 Material Assessment', desc: 'Fibrous insulation, white putty at joints' }].map(check => (
            <button key={check.key} onClick={() => handleCheck(check.key)} disabled={checked[check.key]} className={`w-full p-4 rounded-lg border-2 text-left transition-all ${checked[check.key] ? 'bg-green-900/30 border-green-500' : 'bg-zinc-900 border-zinc-700 hover:border-yellow-500'}`}>
              <p className="text-zinc-200 font-bold">{check.label}</p>
              <p className="text-xs text-zinc-500">{check.desc}</p>
              {checked[check.key] && <p className="text-green-400 text-sm mt-1">✓ Clear</p>}
            </button>
          ))}
        </div>
      </div>
      <button onClick={handleContinue} disabled={!allChecked} className={`w-full py-3 font-bold rounded transition-all ${allChecked ? 'bg-yellow-500 hover:bg-yellow-400 text-zinc-900' : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'}`}>
        {allChecked ? 'All Clear - Proceed to Setup →' : 'Complete All Checks First'}
      </button>
    </div>
  );
}

// ============================================================================
// PHASE 3: SETUP
// ============================================================================

function PowerSetup({ state, dispatch }) {
  const [scenario, setScenario] = useState(null);
  const [resolved, setResolved] = useState(false);
  
  const scenarios = [
    { id: 'normal', text: '20A outlet available near work area', solution: null },
    { id: 'adapter', text: 'Only 15A outlets available, equipment needs 20A', solution: 'Use 15A to 20A adapter or find 20A circuit' },
    { id: 'distance', text: 'Nearest outlet is 80ft from work area', solution: 'Use heavy gauge extension or find closer outlet' },
    { id: 'tripped', text: 'Breaker trips when equipment starts', solution: 'Find dedicated circuit or split load' }
  ];
  
  useEffect(() => {
    const roll = Math.random();
    if (roll < 0.6) setScenario(scenarios[0]);
    else if (roll < 0.8) setScenario(scenarios[1]);
    else if (roll < 0.9) setScenario(scenarios[2]);
    else setScenario(scenarios[3]);
  }, []);
  
  const handleResolve = (correct) => {
    if (correct) {
      dispatch({ type: 'ADD_BONUS', reason: 'Correct power solution', points: 3 });
    } else {
      dispatch({ type: 'ADD_PENALTY', reason: 'Suboptimal power connection', points: 5 });
    }
    dispatch({ type: 'CONNECT_POWER' });
    setResolved(true);
    setTimeout(() => dispatch({ type: 'SET_SUBPHASE', subPhase: 1 }), 1500);
  };
  
  if (!scenario) return null;
  
  return (
    <div className="space-y-4">
      <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
        <h3 className="text-yellow-400 font-bold mb-4">🔌 Power Connection</h3>
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700 mb-4">
          <p className="text-zinc-300">{scenario.text}</p>
        </div>
        {scenario.solution ? (
          <div className="space-y-2">
            <p className="text-zinc-400 text-sm mb-3">How do you proceed?</p>
            <button onClick={() => !resolved && handleResolve(true)} disabled={resolved} className="w-full p-3 bg-zinc-900 border border-zinc-700 hover:border-green-500 rounded text-left text-zinc-200">
              ✓ {scenario.solution}
            </button>
            <button onClick={() => !resolved && handleResolve(false)} disabled={resolved} className="w-full p-3 bg-zinc-900 border border-zinc-700 hover:border-red-500 rounded text-left text-zinc-200">
              ✗ Force it and hope for the best
            </button>
          </div>
        ) : (
          <button onClick={() => handleResolve(true)} disabled={resolved} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded">
            ✓ Connect Power
          </button>
        )}
        {resolved && (
          <div className="mt-4 p-3 rounded bg-green-900/30 text-green-400">
            Power connected. Proceeding to register removal...
          </div>
        )}
      </div>
    </div>
  );
}

function RegisterRemoval({ state, dispatch }) {
  const [currentRegisterIndex, setCurrentRegisterIndex] = useState(0);
  const [selectedApproach, setSelectedApproach] = useState(null);
  const [result, setResult] = useState(null);
  const [showingResult, setShowingResult] = useState(false);
  
  const registers = state.registers;
  const currentRegister = registers[currentRegisterIndex];
  
  if (!currentRegister || currentRegisterIndex >= registers.length) {
    return (
      <div className="space-y-4">
        <div className="bg-green-900/30 border-2 border-green-500 rounded-lg p-6 text-center">
          <span className="text-5xl">✅</span>
          <h3 className="text-green-400 font-bold text-xl mt-4">All Registers Processed</h3>
          <p className="text-zinc-300 mt-2">
            {registers.filter(r => r.removed && !r.damaged).length} removed cleanly, 
            {registers.filter(r => r.skipped).length} skipped/cleaned in place,
            {registers.filter(r => r.damaged).length} damaged
          </p>
          <p className="text-zinc-400 mt-2">Screws recovered: {state.screwInventory} of {state.screwsNeeded}</p>
        </div>
        <button onClick={() => dispatch({ type: 'SET_PHASE', phase: 4 })} className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-bold rounded">
          Proceed to Duct Cleaning →
        </button>
      </div>
    );
  }
  
  const condition = REGISTER_CONDITIONS[currentRegister.condition];
  
  const handleApproach = (approachId) => {
    setSelectedApproach(approachId);
    const approachResult = APPROACH_RESULTS[currentRegister.condition][approachId];
    setResult(approachResult);
    setShowingResult(true);
    
    if (approachResult.damagePenalty > 0) {
      dispatch({ type: 'ADD_PENALTY', reason: `Register damage: ${approachResult.message}`, points: approachResult.damagePenalty });
    }
    if (approachResult.timePenalty > 0) {
      dispatch({ type: 'ADD_TIME_DELAY', minutes: approachResult.timePenalty });
    }
    
    const screwsRecovered = approachResult.success && approachId !== 'document_skip' 
      ? currentRegister.screwCount 
      : approachId === 'document_skip' ? 0 : Math.floor(currentRegister.screwCount * 0.5);
    
    dispatch({ 
      type: 'REMOVE_REGISTER', 
      registerId: currentRegister.id,
      screwsRecovered,
      damaged: approachResult.damagePenalty > 5,
      skipped: approachId === 'document_skip'
    });
  };
  
  const nextRegister = () => {
    setCurrentRegisterIndex(i => i + 1);
    setSelectedApproach(null);
    setResult(null);
    setShowingResult(false);
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-yellow-400 font-bold">🔩 Register Removal</h3>
          <span className="text-zinc-500 text-sm">{currentRegisterIndex + 1} of {registers.length}</span>
        </div>
        
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{condition.icon}</span>
            <div>
              <p className="text-zinc-200 font-bold">{currentRegister.name}</p>
              <p className="text-zinc-500 text-sm">{condition.name}</p>
            </div>
          </div>
          <p className="text-zinc-400 text-sm">{condition.description}</p>
          <p className="text-zinc-500 text-xs mt-2">Screws: {currentRegister.screwCount}</p>
        </div>
        
        {!showingResult ? (
          <div className="space-y-2">
            <p className="text-zinc-400 text-sm mb-3">Select your approach:</p>
            {Object.entries(REGISTER_APPROACHES).map(([id, approach]) => (
              <button key={id} onClick={() => handleApproach(id)} className="w-full p-3 bg-zinc-900 border border-zinc-700 hover:border-yellow-500 rounded text-left transition-all">
                <span className="text-xl mr-2">{approach.icon}</span>
                <span className="text-zinc-200 font-medium">{approach.name}</span>
                <p className="text-xs text-zinc-500 ml-8">{approach.description}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className={`p-4 rounded-lg border-2 ${result.success ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'}`}>
            <p className={`font-bold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
              {result.success ? '✓ Success' : '✗ Problem'}
            </p>
            <p className="text-zinc-300 mt-2">{result.message}</p>
            {result.timePenalty > 0 && <p className="text-orange-400 text-sm mt-1">+{result.timePenalty} min delay</p>}
            <button onClick={nextRegister} className="mt-4 w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-bold rounded">
              Next Register →
            </button>
          </div>
        )}
      </div>
      
      <div className="bg-zinc-900 rounded p-3">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Progress</span>
          <span className="text-zinc-400">{Math.round((currentRegisterIndex / registers.length) * 100)}%</span>
        </div>
        <div className="w-full bg-zinc-700 rounded-full h-2 mt-2">
          <div className="bg-yellow-500 h-2 rounded-full transition-all" style={{ width: `${(currentRegisterIndex / registers.length) * 100}%` }}></div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PHASE 4: EXECUTION
// ============================================================================

function DuctCleaning({ state, dispatch }) {
  const [selectedTool, setSelectedTool] = useState(null);
  const [currentDuctIndex, setCurrentDuctIndex] = useState(0);
  const [cleaningInProgress, setCleaningInProgress] = useState(false);
  const [airflowDirection, setAirflowDirection] = useState(null);
  const [showProblem, setShowProblem] = useState(false);
  const [currentProblem, setCurrentProblem] = useState(null);
  
  const ducts = SCENARIO_DUCTS[state.scenario] || [];
  const currentDuct = ducts[currentDuctIndex];
  
  const triggerRandomProblem = () => {
    if (Math.random() < 0.15) {
      const problems = [...PROBLEM_SCENARIOS.common, ...(PROBLEM_SCENARIOS[state.scenario] || [])];
      const problem = problems[Math.floor(Math.random() * problems.length)];
      setCurrentProblem(problem);
      setShowProblem(true);
      dispatch({ type: 'ENCOUNTER_PROBLEM', problem: problem.id });
    }
  };
  
  if (!currentDuct || currentDuctIndex >= ducts.length) {
    return (
      <div className="space-y-4">
        <div className="bg-green-900/30 border-2 border-green-500 rounded-lg p-6 text-center">
          <span className="text-5xl">🎉</span>
          <h3 className="text-green-400 font-bold text-xl mt-4">All Ducts Cleaned!</h3>
          <p className="text-zinc-300 mt-2">
            {Object.values(state.ductsClean).filter(q => q === 'excellent').length} excellent,
            {Object.values(state.ductsClean).filter(q => q === 'good').length} good,
            {Object.values(state.ductsClean).filter(q => q === 'poor').length} poor
          </p>
        </div>
        <button onClick={() => dispatch({ type: 'SET_PHASE', phase: 5 })} className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-bold rounded">
          Proceed to Completion →
        </button>
      </div>
    );
  }
  
  const material = DUCT_MATERIALS[currentDuct.material];
  
  const handleClean = () => {
    if (!selectedTool || !airflowDirection) return;
    
    setCleaningInProgress(true);
    
    const toolAllowed = material.allowedTools.includes(selectedTool);
    const correctDirection = airflowDirection === 'upstream';
    
    let quality = 'poor';
    if (toolAllowed && correctDirection) quality = 'excellent';
    else if (toolAllowed || correctDirection) quality = 'good';
    
    if (!toolAllowed) {
      dispatch({ type: 'ADD_PENALTY', reason: `Wrong tool for ${material.name}`, points: 5 });
    }
    if (!correctDirection) {
      dispatch({ type: 'ADD_PENALTY', reason: 'Wrong cleaning direction', points: 3 });
    }
    if (quality === 'excellent') {
      dispatch({ type: 'ADD_BONUS', reason: 'Perfect technique', points: 2 });
    }
    
    dispatch({ type: 'CLEAN_DUCT', duct: currentDuct.id, quality });
    dispatch({ type: 'SET_AIRFLOW_CORRECT', duct: currentDuct.id, correct: correctDirection });
    
    setTimeout(() => {
      setCleaningInProgress(false);
      triggerRandomProblem();
      if (!showProblem) {
        setCurrentDuctIndex(i => i + 1);
        setSelectedTool(null);
        setAirflowDirection(null);
      }
    }, 1500);
  };
  
  const handleProblemResolution = (correct) => {
    if (correct) {
      dispatch({ type: 'SOLVE_PROBLEM', problem: currentProblem.id });
      dispatch({ type: 'ADD_BONUS', reason: 'Correct problem resolution', points: 5 });
    } else {
      dispatch({ type: 'ADD_PENALTY', reason: 'Poor problem handling', points: 8 });
    }
    setShowProblem(false);
    setCurrentProblem(null);
    setCurrentDuctIndex(i => i + 1);
    setSelectedTool(null);
    setAirflowDirection(null);
  };
  
  if (showProblem && currentProblem) {
    return (
      <div className="space-y-4">
        <div className="bg-orange-900/30 border-2 border-orange-500 rounded-lg p-4">
          <h3 className="text-orange-400 font-bold text-lg mb-2">⚠️ Problem Encountered</h3>
          <p className="text-zinc-200 font-bold">{currentProblem.name}</p>
          <p className="text-zinc-400 mt-2">{currentProblem.description}</p>
          <div className="mt-4 space-y-2">
            <button onClick={() => handleProblemResolution(true)} className="w-full p-3 bg-zinc-900 border border-green-500 hover:bg-green-900/30 rounded text-left text-zinc-200">
              ✓ {currentProblem.solution}
            </button>
            <button onClick={() => handleProblemResolution(false)} className="w-full p-3 bg-zinc-900 border border-red-500 hover:bg-red-900/30 rounded text-left text-zinc-200">
              ✗ Ignore and continue
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-yellow-400 font-bold">🔧 Duct Cleaning</h3>
        <span className="text-zinc-500 text-sm">{currentDuctIndex + 1} of {ducts.length}</span>
      </div>
      
      <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: material.color }}></div>
          <div>
            <p className="text-zinc-200 font-bold">{currentDuct.name}</p>
            <p className="text-zinc-500 text-sm">{material.name} • {currentDuct.length}</p>
          </div>
        </div>
        
        <div className="bg-orange-900/20 border border-orange-500/30 rounded p-2 mb-4">
          <p className="text-orange-400 text-sm">⚠️ {material.warning}</p>
        </div>
        
        <div className="mb-4">
          <p className="text-zinc-400 text-sm mb-2">Select Tool:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {TOOLS.map(tool => (
              <button key={tool.id} onClick={() => setSelectedTool(tool.id)} className={`p-3 rounded border-2 text-center transition-all ${selectedTool === tool.id ? 'bg-yellow-500/20 border-yellow-500' : 'bg-zinc-900 border-zinc-700 hover:border-zinc-500'}`}>
                <span className="text-2xl">{tool.icon}</span>
                <p className="text-xs text-zinc-400 mt-1">{tool.name}</p>
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-zinc-400 text-sm mb-2">Cleaning Direction:</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setAirflowDirection('upstream')} className={`p-3 rounded border-2 ${airflowDirection === 'upstream' ? 'bg-green-500/20 border-green-500' : 'bg-zinc-900 border-zinc-700 hover:border-zinc-500'}`}>
              <p className="text-zinc-200">↑ Upstream</p>
              <p className="text-xs text-zinc-500">Into the airflow</p>
            </button>
            <button onClick={() => setAirflowDirection('downstream')} className={`p-3 rounded border-2 ${airflowDirection === 'downstream' ? 'bg-red-500/20 border-red-500' : 'bg-zinc-900 border-zinc-700 hover:border-zinc-500'}`}>
              <p className="text-zinc-200">↓ Downstream</p>
              <p className="text-xs text-zinc-500">With the airflow</p>
            </button>
          </div>
        </div>
        
        {cleaningInProgress ? (
          <div className="text-center py-4">
            <div className="animate-spin text-4xl">🌀</div>
            <p className="text-yellow-400 mt-2">Cleaning in progress...</p>
          </div>
        ) : (
          <button onClick={handleClean} disabled={!selectedTool || !airflowDirection} className={`w-full py-3 font-bold rounded transition-all ${selectedTool && airflowDirection ? 'bg-yellow-500 hover:bg-yellow-400 text-zinc-900' : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'}`}>
            Start Cleaning →
          </button>
        )}
      </div>
      
      <div className="bg-zinc-900 rounded p-3">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Progress</span>
          <span className="text-zinc-400">{Math.round((currentDuctIndex / ducts.length) * 100)}%</span>
        </div>
        <div className="w-full bg-zinc-700 rounded-full h-2 mt-2">
          <div className="bg-yellow-500 h-2 rounded-full transition-all" style={{ width: `${(currentDuctIndex / ducts.length) * 100}%` }}></div>
        </div>
      </div>
      
      <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3">
        <p className="text-blue-300 text-sm"><span className="font-bold">💡 Remember:</span> Whip upstream, vacuum downstream. Debris flows with the vacuum pull.</p>
      </div>
    </div>
  );
}

// ============================================================================
// PHASE 5: COMPLETION
// ============================================================================

function CustomerWalkthrough({ state, dispatch, onComplete }) {
  const customer = CUSTOMER_TYPES[state.customerType];
  const dialogueTree = COMPLETION_DIALOGUES[state.customerType];
  const hasPhotos = state.photosDocumented;

  const [currentNodeId, setCurrentNodeId] = useState(dialogueTree?.start);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [showingFeedback, setShowingFeedback] = useState(false);
  const [lastChoice, setLastChoice] = useState(null);
  const [dialogueComplete, setDialogueComplete] = useState(false);
  const [noPhotosPenaltyApplied, setNoPhotosPenaltyApplied] = useState(false);

  const currentNode = dialogueTree?.nodes[currentNodeId];

  // Filter choices based on photo availability
  const getAvailableChoices = (choices) => {
    return choices.map(choice => {
      if (choice.requiresPhotos && !hasPhotos) {
        return {
          ...choice,
          disabled: true,
          text: choice.text + " [No photos taken]",
          originalScore: choice.score,
          score: -5,
          reason: 'Promised photos but have none'
        };
      }
      return choice;
    });
  };

  const handleChoice = (choice) => {
    setLastChoice(choice);
    setShowingFeedback(true);

    // Check if trying to use photos without having them
    if (choice.requiresPhotos && !hasPhotos && !noPhotosPenaltyApplied) {
      dispatch({ type: 'ADD_PENALTY', reason: 'No documentation to show customer', points: 5 });
      setNoPhotosPenaltyApplied(true);
      setScoreHistory(prev => [...prev, { score: -5, reason: 'No documentation to show customer' }]);
    } else if (choice.score > 0) {
      dispatch({ type: 'ADD_BONUS', reason: choice.reason || 'Good walkthrough interaction', points: choice.score });
      setScoreHistory(prev => [...prev, { score: choice.score, reason: choice.reason }]);
    } else if (choice.score < 0) {
      dispatch({ type: 'ADD_PENALTY', reason: choice.reason || 'Poor walkthrough interaction', points: Math.abs(choice.score) });
      setScoreHistory(prev => [...prev, { score: choice.score, reason: choice.reason }]);
    }
  };

  const handleContinue = () => {
    setShowingFeedback(false);

    if (lastChoice.next) {
      setCurrentNodeId(lastChoice.next);
      setLastChoice(null);
    } else {
      setDialogueComplete(true);
    }
  };

  const handleFinish = () => {
    dispatch({ type: 'COMPLETE_WALKTHROUGH' });
    onComplete();
  };

  const totalScore = scoreHistory.reduce((sum, item) => sum + item.score, 0);

  // Dialogue complete - show summary
  if (dialogueComplete) {
    return (
      <div className="space-y-4">
        <div className={`border-2 rounded-lg p-6 ${totalScore >= 5 ? 'bg-green-900/30 border-green-500' : totalScore >= 0 ? 'bg-zinc-800/50 border-yellow-500/50' : 'bg-red-900/30 border-red-500'}`}>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl">{customer.avatar}</span>
            <div>
              <h3 className={`font-bold text-xl ${totalScore >= 5 ? 'text-green-400' : totalScore >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                Walkthrough Complete
              </h3>
              <p className="text-zinc-400">{customer.name}</p>
            </div>
          </div>

          {scoreHistory.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-zinc-500 text-sm font-bold uppercase">Customer Interaction:</p>
              {scoreHistory.map((item, i) => (
                <div key={i} className={`flex justify-between text-sm px-3 py-1 rounded ${item.score > 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                  <span>{item.reason}</span>
                  <span className="font-bold">{item.score > 0 ? '+' : ''}{item.score}</span>
                </div>
              ))}
            </div>
          )}

          <div className={`text-center py-3 rounded ${totalScore >= 5 ? 'bg-green-900/50' : totalScore >= 0 ? 'bg-zinc-900' : 'bg-red-900/50'}`}>
            <p className="text-zinc-400 text-sm">Customer Satisfaction</p>
            <p className={`text-2xl font-bold ${totalScore >= 5 ? 'text-green-400' : totalScore >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
              {totalScore >= 8 ? 'Impressed' : totalScore >= 5 ? 'Satisfied' : totalScore >= 0 ? 'Neutral' : totalScore >= -5 ? 'Disappointed' : 'Unhappy'}
            </p>
          </div>
        </div>
        <button onClick={handleFinish} className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-bold rounded">
          Finish Walkthrough →
        </button>
      </div>
    );
  }

  // Showing feedback after a choice
  if (showingFeedback && lastChoice) {
    const effectiveScore = (lastChoice.requiresPhotos && !hasPhotos) ? -5 : lastChoice.score;
    const effectiveReason = (lastChoice.requiresPhotos && !hasPhotos) ? 'No documentation to show customer' : lastChoice.reason;

    return (
      <div className="space-y-4">
        <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">👷</span>
            <div className="flex-1">
              <p className="text-zinc-500 text-xs uppercase">Your Response</p>
              <p className="text-zinc-200">{lastChoice.text.replace(' [No photos taken]', '')}</p>
            </div>
          </div>

          {lastChoice.requiresPhotos && !hasPhotos && (
            <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/50 mb-3">
              <p className="text-red-400">
                <span className="font-bold">⚠️ Problem:</span> You mentioned photos but didn't take any during the job!
              </p>
            </div>
          )}

          {effectiveScore !== 0 && (
            <div className={`p-3 rounded-lg ${effectiveScore > 0 ? 'bg-green-900/30 border border-green-500/50' : 'bg-red-900/30 border border-red-500/50'}`}>
              <div className="flex justify-between items-center">
                <span className={effectiveScore > 0 ? 'text-green-400' : 'text-red-400'}>
                  {effectiveScore > 0 ? '✓' : '✗'} {effectiveReason}
                </span>
                <span className={`font-bold ${effectiveScore > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {effectiveScore > 0 ? '+' : ''}{effectiveScore}
                </span>
              </div>
            </div>
          )}

          <button onClick={handleContinue} className="w-full mt-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-bold rounded">
            {lastChoice.next ? 'Continue →' : 'Finish →'}
          </button>
        </div>
      </div>
    );
  }

  // Show current dialogue node
  if (!currentNode) return null;

  const availableChoices = getAvailableChoices(currentNode.choices);

  return (
    <div className="space-y-4">
      <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
        <h3 className="text-yellow-400 font-bold mb-4">🤝 Customer Walkthrough</h3>

        {/* Photo status warning */}
        {!hasPhotos && (
          <div className="bg-orange-900/30 border border-orange-500/50 rounded p-3 mb-4">
            <p className="text-orange-400 text-sm">
              <span className="font-bold">⚠️ Warning:</span> You didn't document photos. Some options may have penalties.
            </p>
          </div>
        )}

        {/* Customer info */}
        <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded border border-zinc-700 mb-4">
          <span className="text-3xl">{customer.avatar}</span>
          <div>
            <p className="text-zinc-200 font-bold">{customer.name}</p>
            <p className="text-zinc-500 text-sm">Reviewing completed work</p>
          </div>
        </div>

        {/* Dialogue bubble */}
        <div className="bg-zinc-900 rounded-lg p-4 border-l-4 border-yellow-500 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{currentNode.speaker === 'customer' ? customer.avatar : currentNode.speaker === 'system' ? '📱' : '👷'}</span>
            <span className="text-zinc-400 text-sm font-bold">
              {currentNode.speaker === 'customer' ? customer.name : currentNode.speaker === 'system' ? 'System' : 'You'}
            </span>
          </div>
          <p className="text-zinc-100 leading-relaxed">{currentNode.text}</p>
        </div>

        {/* Response choices */}
        <div className="space-y-2">
          <p className="text-zinc-500 text-sm">Choose your response:</p>
          {availableChoices.map((choice, i) => (
            <button
              key={i}
              onClick={() => handleChoice(choice)}
              className={`w-full p-4 border rounded-lg text-left transition-all group ${
                choice.disabled
                  ? 'bg-zinc-900/50 border-orange-500/50 opacity-75'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 hover:border-yellow-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-yellow-500 font-bold">{i + 1}.</span>
                <span className={`${choice.disabled ? 'text-orange-300' : 'text-zinc-200 group-hover:text-zinc-100'}`}>
                  {choice.text}
                </span>
              </div>
              {choice.disabled && (
                <p className="text-orange-400 text-xs mt-1 ml-6">⚠️ This will have consequences</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Score tracker */}
      {scoreHistory.length > 0 && (
        <div className="bg-zinc-900 rounded p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Walkthrough Progress</span>
            <span className={totalScore >= 0 ? 'text-green-400' : 'text-red-400'}>
              {totalScore > 0 ? '+' : ''}{totalScore} pts
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function CompletionPhase({ state, dispatch }) {
  const [photosTaken, setPhotosTaken] = useState(state.photosDocumented || false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [walkthroughDone, setWalkthroughDone] = useState(false);

  const handlePhotos = () => {
    dispatch({ type: 'DOCUMENT_PHOTOS' });
    dispatch({ type: 'ADD_BONUS', reason: 'Proper documentation', points: 5 });
    setPhotosTaken(true);
  };

  const handleSkipPhotos = () => {
    dispatch({ type: 'ADD_PENALTY', reason: 'Skipped photo documentation', points: 5 });
    setShowWalkthrough(true);
  };

  const handleStartWalkthrough = () => {
    setShowWalkthrough(true);
  };

  const handleWalkthroughComplete = () => {
    setWalkthroughDone(true);
    setShowWalkthrough(false);
  };

  const handleComplete = () => {
    if (state.screwInventory < state.screwsNeeded) {
      dispatch({ type: 'ADD_PENALTY', reason: `Missing ${state.screwsNeeded - state.screwInventory} screws`, points: 5 });
    }
    dispatch({ type: 'COMPLETE_JOB' });
  };

  // Show walkthrough dialogue
  if (showWalkthrough) {
    return <CustomerWalkthrough state={state} dispatch={dispatch} onComplete={handleWalkthroughComplete} />;
  }

  return (
    <div className="space-y-4">
      <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
        <h3 className="text-yellow-400 font-bold mb-4">✅ Job Completion Checklist</h3>

        <div className="space-y-3">
          {!photosTaken ? (
            <div className="space-y-2">
              <button onClick={handlePhotos} className="w-full p-4 rounded-lg border-2 text-left transition-all bg-zinc-900 border-zinc-700 hover:border-yellow-500">
                <p className="text-zinc-200 font-bold">📸 Take Before/After Photos</p>
                <p className="text-zinc-500 text-sm">Document work completed for customer records</p>
                <p className="text-green-400 text-xs mt-1">+5 points • Required for best walkthrough options</p>
              </button>
              <button onClick={handleSkipPhotos} className="w-full p-2 text-sm text-zinc-500 hover:text-orange-400 transition-all">
                Skip photos and proceed to walkthrough (-5 points)
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-lg border-2 bg-green-900/30 border-green-500">
              <p className="text-green-400 font-bold">📸 Photos Documented</p>
              <p className="text-zinc-400 text-sm">Before/after photos ready for customer</p>
            </div>
          )}

          {photosTaken && !walkthroughDone && (
            <button onClick={handleStartWalkthrough} className="w-full p-4 rounded-lg border-2 text-left transition-all bg-zinc-900 border-zinc-700 hover:border-yellow-500">
              <p className="text-zinc-200 font-bold">🤝 Customer Walkthrough</p>
              <p className="text-zinc-500 text-sm">Present work, explain findings, get signature</p>
            </button>
          )}

          {walkthroughDone && (
            <div className="p-4 rounded-lg border-2 bg-green-900/30 border-green-500">
              <p className="text-green-400 font-bold">🤝 Walkthrough Complete</p>
              <p className="text-zinc-400 text-sm">Customer signed off on work</p>
            </div>
          )}

          <div className="p-4 rounded-lg border-2 border-zinc-700 bg-zinc-900">
            <p className="text-zinc-200 font-bold">🔩 Screw Inventory</p>
            <div className="flex justify-between mt-2">
              <span className="text-zinc-500">Needed:</span>
              <span className="text-zinc-300">{state.screwsNeeded}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Recovered:</span>
              <span className={state.screwInventory >= state.screwsNeeded ? 'text-green-400' : 'text-orange-400'}>{state.screwInventory}</span>
            </div>
            {state.screwInventory < state.screwsNeeded && (
              <p className="text-orange-400 text-sm mt-2">⚠️ Missing screws will be noted</p>
            )}
          </div>
        </div>
      </div>

      <button onClick={handleComplete} disabled={!walkthroughDone} className={`w-full py-3 font-bold rounded transition-all ${walkthroughDone ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'}`}>
        Complete Job & View Results →
      </button>
    </div>
  );
}

// ============================================================================
// RESULTS SCREEN
// ============================================================================

function ResultsScreen({ state, dispatch }) {
  const getGrade = (score) => {
    if (score >= 95) return { grade: 'A+', color: 'text-green-400', desc: 'Outstanding Performance' };
    if (score >= 90) return { grade: 'A', color: 'text-green-400', desc: 'Excellent Work' };
    if (score >= 85) return { grade: 'B+', color: 'text-blue-400', desc: 'Very Good' };
    if (score >= 80) return { grade: 'B', color: 'text-blue-400', desc: 'Good Performance' };
    if (score >= 75) return { grade: 'C+', color: 'text-yellow-400', desc: 'Satisfactory' };
    if (score >= 70) return { grade: 'C', color: 'text-yellow-400', desc: 'Needs Improvement' };
    if (score >= 60) return { grade: 'D', color: 'text-orange-400', desc: 'Below Expectations' };
    return { grade: 'F', color: 'text-red-400', desc: 'Failed - Retrain Required' };
  };
  
  const gradeInfo = getGrade(state.score);
  
  return (
    <div className="space-y-4">
      <div className="bg-zinc-800/50 border-2 border-yellow-500 rounded-lg p-6 text-center">
        <h2 className="text-2xl font-bold text-yellow-400 mb-4">Job Complete</h2>
        <div className={`text-7xl font-black ${gradeInfo.color}`}>{gradeInfo.grade}</div>
        <p className="text-zinc-400 mt-2">{gradeInfo.desc}</p>
        <p className="text-3xl font-bold text-zinc-200 mt-4">{state.score}/100</p>
        {state.timeDelay > 0 && (
          <p className="text-orange-400 mt-2">⏱️ Total delays: +{state.timeDelay} minutes</p>
        )}
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-zinc-900 rounded-lg p-4 border border-green-500/30">
          <h3 className="text-green-400 font-bold mb-3">✅ Bonuses Earned</h3>
          {state.bonuses.length > 0 ? (
            <ul className="space-y-1">
              {state.bonuses.map((b, i) => (
                <li key={i} className="text-zinc-300 text-sm flex justify-between">
                  <span>{b.reason}</span>
                  <span className="text-green-400">+{b.points}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-zinc-500 text-sm">No bonuses earned</p>
          )}
        </div>
        
        <div className="bg-zinc-900 rounded-lg p-4 border border-red-500/30">
          <h3 className="text-red-400 font-bold mb-3">❌ Penalties Incurred</h3>
          {state.penalties.length > 0 ? (
            <ul className="space-y-1">
              {state.penalties.map((p, i) => (
                <li key={i} className="text-zinc-300 text-sm flex justify-between">
                  <span>{p.reason}</span>
                  <span className="text-red-400">-{p.points}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-zinc-500 text-sm">No penalties - perfect run!</p>
          )}
        </div>
      </div>
      
      <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
        <h3 className="text-zinc-400 font-bold mb-3">📊 Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-zinc-200">{Object.values(state.ductsClean).filter(q => q === 'excellent').length}</p>
            <p className="text-xs text-zinc-500">Excellent Cleans</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-200">{state.problemsSolved.length}</p>
            <p className="text-xs text-zinc-500">Problems Solved</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-200">{state.registers.filter(r => !r.damaged).length}/{state.registers.length}</p>
            <p className="text-xs text-zinc-500">Registers Intact</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-200">{state.screwInventory}/{state.screwsNeeded}</p>
            <p className="text-xs text-zinc-500">Screws Recovered</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => dispatch({ type: 'START_GAME' })} className="py-3 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-bold rounded">🔄 Retry This Job</button>
        <button onClick={() => dispatch({ type: 'RESET' })} className="py-3 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-bold rounded">🏠 Main Menu</button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN MENU
// ============================================================================

function MainMenu({ state, dispatch }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-yellow-400 mb-2 tracking-tight">DUCT CLEANING</h1>
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-300 mb-2">SIMULATOR</h2>
          <p className="text-zinc-500">Carolina Quality Air Training System v1.2</p>
          <p className="text-zinc-600 text-sm mt-1">"Duct cleaning is 20% technique, 80% everything else."</p>
        </div>
        
        <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-6 mb-6">
          <h3 className="text-yellow-400 font-bold mb-4">🎮 Select Training Scenario</h3>
          <div className="space-y-3">
            {Object.entries(SCENARIOS).map(([key, scenario]) => (
              <button key={key} onClick={() => dispatch({ type: 'SELECT_SCENARIO', scenario: key })} className={`w-full p-4 rounded-lg border-2 text-left transition-all ${state.scenario === key ? 'bg-yellow-500/20 border-yellow-500' : scenario.unlocked ? 'bg-zinc-900 border-zinc-700 hover:border-yellow-500/50' : 'bg-zinc-900/50 border-zinc-800 opacity-50 cursor-not-allowed'}`} disabled={!scenario.unlocked}>
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{scenario.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-200">{scenario.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${scenario.difficulty === 'Beginner' ? 'bg-green-900 text-green-400' : scenario.difficulty === 'Intermediate' ? 'bg-yellow-900 text-yellow-400' : 'bg-red-900 text-red-400'}`}>{scenario.difficulty}</span>
                    </div>
                    <p className="text-sm text-zinc-400 mt-1">{scenario.description}</p>
                    <p className="text-xs text-zinc-500 mt-1">System: {scenario.systemType.toUpperCase()} • Est: {scenario.estimatedTime}</p>
                  </div>
                  {state.scenario === key && <span className="text-yellow-500 text-xl">✓</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-4 mb-6">
          <h4 className="text-zinc-400 font-bold mb-2">📚 Training Phases</h4>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
            {['📋 Pre-Job', '🏠 Arrival', '🔌 Setup', '🔧 Execute', '✅ Complete', '🎯 Results'].map((phase, i) => (
              <div key={i} className="bg-zinc-800 rounded p-2 text-center text-zinc-400">{phase}</div>
            ))}
          </div>
        </div>
        
        <button onClick={() => state.scenario && dispatch({ type: 'START_GAME' })} disabled={!state.scenario} className={`w-full py-4 font-black text-xl rounded-lg transition-all ${state.scenario ? 'bg-yellow-500 hover:bg-yellow-400 text-zinc-900 transform hover:scale-[1.02]' : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'}`}>
          {state.scenario ? `🚐 START: ${SCENARIOS[state.scenario]?.name}` : 'Select a Scenario Above'}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN APP
// ============================================================================

export default function DuctCleaningSimulator() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  const renderPhase = () => {
    switch (state.phase) {
      case 0: return <MainMenu state={state} dispatch={dispatch} />;
      case 1:
        return (
          <div className="max-w-4xl mx-auto">
            <PhaseHeader phase={state.phase} scenario={state.scenario} currentDay={state.currentDay} totalDays={state.totalDays} />
            <h2 className="text-xl font-bold text-zinc-200 mb-4">Phase 1: Pre-Job Preparation</h2>
            {state.subPhase === 0 && <JobBriefing state={state} dispatch={dispatch} />}
            {state.subPhase === 1 && <EquipmentLoadout state={state} dispatch={dispatch} />}
            {state.subPhase === 2 && <VehicleCheck state={state} dispatch={dispatch} />}
            {state.subPhase === 3 && <RoutePlanning state={state} dispatch={dispatch} />}
          </div>
        );
      case 2:
        return (
          <div className="max-w-4xl mx-auto">
            <PhaseHeader phase={state.phase} scenario={state.scenario} currentDay={state.currentDay} totalDays={state.totalDays} />
            <h2 className="text-xl font-bold text-zinc-200 mb-4">Phase 2: Arrival & Assessment</h2>
            {state.subPhase === 0 && <FirstContact state={state} dispatch={dispatch} />}
            {state.subPhase === 1 && <SiteSurvey state={state} dispatch={dispatch} />}
            {state.subPhase === 2 && <HazardCheck state={state} dispatch={dispatch} />}
          </div>
        );
      case 3:
        return (
          <div className="max-w-4xl mx-auto">
            <PhaseHeader phase={state.phase} scenario={state.scenario} currentDay={state.currentDay} totalDays={state.totalDays} />
            <h2 className="text-xl font-bold text-zinc-200 mb-4">Phase 3: Setup & Register Removal</h2>
            {state.subPhase === 0 && <PowerSetup state={state} dispatch={dispatch} />}
            {state.subPhase === 1 && <RegisterRemoval state={state} dispatch={dispatch} />}
          </div>
        );
      case 4:
        return (
          <div className="max-w-5xl mx-auto">
            <PhaseHeader phase={state.phase} scenario={state.scenario} currentDay={state.currentDay} totalDays={state.totalDays} />
            <h2 className="text-xl font-bold text-zinc-200 mb-4">Phase 4: Execution</h2>
            <DuctCleaning state={state} dispatch={dispatch} />
          </div>
        );
      case 5:
        return (
          <div className="max-w-4xl mx-auto">
            <PhaseHeader phase={state.phase} scenario={state.scenario} currentDay={state.currentDay} totalDays={state.totalDays} />
            <h2 className="text-xl font-bold text-zinc-200 mb-4">Phase 5: Completion</h2>
            <CompletionPhase state={state} dispatch={dispatch} />
          </div>
        );
      case 7:
        return (
          <div className="max-w-4xl mx-auto">
            <PhaseHeader phase={state.phase} scenario={state.scenario} currentDay={state.currentDay} totalDays={state.totalDays} />
            <ResultsScreen state={state} dispatch={dispatch} />
          </div>
        );
      default: return <MainMenu state={state} dispatch={dispatch} />;
    }
  };
  
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4" style={{ fontFamily: "'JetBrains Mono', 'SF Mono', 'Consolas', monospace" }}>
      <ScoreBar state={state} dispatch={dispatch} />
      <div className={state.phase > 0 && state.phase < 7 ? 'pt-12' : ''}>
        {renderPhase()}
      </div>
    </div>
  );
}
