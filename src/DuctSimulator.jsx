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
    name: 'Durham County Courthouse',
    difficulty: 'Advanced',
    icon: '🏛️',
    description: '1950s historic building, 47 wall-mounted PTAC units across 3 floors. Asbestos protocols required.',
    systemType: 'ptac',
    estimatedTime: '2-3 days',
    unlocked: true,
    crewSize: '4-6 (Jeff, Thomas, Andrew, Nate, Jack, Bryson)',
    specialNote: 'Based on real job at Durham County Courthouse'
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
    system: 'PTAC/Fan Coil - 47 wall-mounted units across 3 floors',
    sqft: '45,000',
    notes: 'Historic building, 1950s construction - asbestos protocols required. Work in phases by floor. Coordinate with building security. Some offices occupied during work - minimize disruption.',
    estimatedTime: '2-3 days',
    mapDistance: '15 miles',
    parking: 'Church Street Garage - $9/day, 2 blocks walking. Third van (equipment trailer) may need separate parking arrangements.',
    specialConsiderations: [
      'Multi-day job - 3 days minimum',
      'Security escort required for Floor 3',
      '47 individual PTAC units (wall-mounted, hotel-style)',
      'Occupied building - work around court schedules',
      'Historic 1950s building - asbestos suspect material likely',
      'Lined ductwork throughout - short runs to PTAC units',
      'Portable vacuum preferred over truck (short duct runs)',
      'Crew of 4-6 recommended'
    ]
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

// Courthouse crew members - real crew assignments
const COURTHOUSE_CREW = {
  jeff: {
    id: 'jeff',
    name: 'Jeff',
    role: 'Lead / Point Man',
    assignment: 'Runs point, coordinates with facilities',
    icon: '👷',
    dialogue: [
      "Thomas and Andrew are handling Floor 2 courtrooms - we'll hit Floor 3 after lunch.",
      "Nate, you're with me on Floor 1. Jack and Bryson, start prepping equipment.",
      "Check in with security before you head up - they're strict about Floor 3 access."
    ]
  },
  thomas: {
    id: 'thomas',
    name: 'Thomas',
    role: 'Floor 2 Lead',
    assignment: 'Floor 2 courtrooms and chambers',
    icon: '🔧',
    dialogue: [
      "Andrew, start on Courtroom C. I'll handle the judge chambers.",
      "Court's in session in Room B - we'll circle back during recess.",
      "Watch the historic fixtures in here - don't scratch anything."
    ]
  },
  andrew: {
    id: 'andrew',
    name: 'Andrew',
    role: 'Floor 2 Support',
    assignment: 'Floor 2 with Thomas',
    icon: '🛠️',
    dialogue: [
      "Courtroom C is clear - moving to conference rooms.",
      "Thomas, got some white putty on this joint. Flagging it.",
      "Judge's assistant wants to know when we'll be done in chambers."
    ]
  },
  nate: {
    id: 'nate',
    name: 'Nate',
    role: 'Rotating',
    assignment: 'Floor 1 with Jeff / rotating support',
    icon: '👨‍🔧',
    dialogue: [
      "Clerk offices are done. Moving to the public areas.",
      "Security's asking for our sign-out time.",
      "Jeff, the portable's running low on suction - filter check?"
    ]
  },
  jack: {
    id: 'jack',
    name: 'Jack',
    role: 'Rotating',
    assignment: 'Equipment prep / rotating support',
    icon: '🧰',
    dialogue: [
      "Equipment's staged in the stairwell.",
      "Got the PTAC filters sorted by size - ready for Floor 3.",
      "Bryson, hand me the coil cleaner."
    ]
  },
  bryson: {
    id: 'bryson',
    name: 'Bryson',
    role: 'Rotating',
    assignment: 'Equipment prep / rotating support',
    icon: '📦',
    dialogue: [
      "Third van's parked on the street - trailer wouldn't fit in the garage.",
      "Filter stock is running low. Might need a supply run tomorrow.",
      "Jack, you seen the drain pan tablets?"
    ]
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
    // Floor 1 - Clerk offices, public areas
    { id: 'floor1_main', name: 'Floor 1 - Main Corridor', material: 'lined', length: '120ft', type: 'trunk', note: 'Lined ductwork - 1950s construction' },
    { id: 'floor1_court1', name: 'Floor 1 - Public Area A', material: 'lined', length: '45ft', type: 'supply' },
    { id: 'floor1_court2', name: 'Floor 1 - Public Area B', material: 'lined', length: '45ft', type: 'supply' },
    { id: 'floor1_offices', name: 'Floor 1 - Clerk Offices', material: 'lined', length: '60ft', type: 'supply', note: 'High foot traffic area' },
    // Floor 2 - Courtrooms
    { id: 'floor2_main', name: 'Floor 2 - Main Corridor', material: 'lined', length: '120ft', type: 'trunk', note: 'Thomas and Andrew assigned' },
    { id: 'floor2_court3', name: 'Floor 2 - Courtroom C', material: 'lined', length: '50ft', type: 'supply', note: 'Work around court schedule' },
    { id: 'floor2_judges', name: 'Floor 2 - Courtrooms A & B', material: 'lined', length: '80ft', type: 'supply', note: 'Historic brass grilles' },
    // Floor 3 - Judge chambers, records (restricted)
    { id: 'floor3_main', name: 'Floor 3 - Main Corridor', material: 'lined', length: '110ft', type: 'trunk', note: 'Security escort required' },
    { id: 'floor3_admin', name: 'Floor 3 - Judge Chambers', material: 'lined', length: '90ft', type: 'supply', note: 'Schedule varies - check with assistant' },
    { id: 'floor3_records', name: 'Floor 3 - Records Room', material: 'ductboard', length: '40ft', type: 'supply', note: 'Cover EVERYTHING with plastic' },
    // PTAC Units - wall-mounted throughout
    { id: 'ptac_units', name: 'PTAC Units (47 wall-mounted)', material: 'lined', length: '8-15ft runs', type: 'ptac', note: 'Hotel-style units, short duct runs - portable vacuum preferred' }
  ]
};

// ============================================================================
// ACCESS CUTTING TOOLS & SCENARIOS
// ============================================================================

const ACCESS_CUTTING_TOOLS = {
  hole_cutter: {
    id: 'hole_cutter',
    name: '8" Hole Cutter',
    description: 'Circular aviation shears for round access holes. Standard 8" diameter.',
    icon: '⭕',
    forCutType: 'circular',
    color: '#3b82f6'
  },
  tin_snips: {
    id: 'tin_snips',
    name: 'Tin Snips',
    description: 'Aviation snips for rectangular cuts. Left and right cutting variants.',
    icon: '✂️',
    forCutType: 'rectangular',
    color: '#22c55e'
  },
  utility_knife: {
    id: 'utility_knife',
    name: 'Utility Knife',
    description: 'For cutting insulation on lined duct. Must cut insulation square BEFORE metal.',
    icon: '🔪',
    forCutType: 'insulation',
    color: '#f59e0b'
  },
  drill: {
    id: 'drill',
    name: 'Drill with Starter Bit',
    description: 'For starting holes before cutting. Required for clean rectangular cuts.',
    icon: '🔩',
    forCutType: 'starter',
    color: '#8b5cf6'
  }
};

const DUCT_ACCESS_SCENARIOS = {
  residential: {
    name: 'Residential Attic System',
    description: 'Simple flex duct runs from air handler. Access typically at trunk line only.',
    requiresLinedCutting: false,
    layout: {
      width: 400,
      height: 300,
      airHandler: { x: 200, y: 30, width: 60, height: 40 },
      trunk: { x: 100, y: 70, width: 200, height: 20, direction: 'horizontal', material: 'rigid' },
      branches: [
        { id: 'branch1', name: 'Master Branch', x: 100, y: 90, toX: 100, toY: 180, material: 'flex' },
        { id: 'branch2', name: 'Bed 2 Branch', x: 150, y: 90, toX: 150, toY: 160, material: 'flex' },
        { id: 'branch3', name: 'Bed 3 Branch', x: 250, y: 90, toX: 250, toY: 160, material: 'flex' },
        { id: 'branch4', name: 'Living Branch', x: 300, y: 90, toX: 300, toY: 180, material: 'flex' }
      ]
    },
    accessPoints: [
      { id: 'trunk_access', name: 'Main Trunk Access', x: 120, y: 70, recommended: true, position: 'upstream', purpose: 'whip', minCuts: true },
      { id: 'trunk_vacuum', name: 'Trunk Vacuum Port', x: 280, y: 70, recommended: true, position: 'downstream', purpose: 'vacuum', minCuts: true }
    ],
    minCutsRequired: 2,
    optimalCuts: ['trunk_access', 'trunk_vacuum']
  },
  commercial: {
    name: 'Commercial RTU System',
    description: 'Long rigid metal trunk runs with lined branch ducts. Multiple access points needed.',
    requiresLinedCutting: true,
    layout: {
      width: 450,
      height: 280,
      airHandler: { x: 20, y: 80, width: 70, height: 50, label: 'RTU' },
      trunk: { x: 90, y: 95, width: 340, height: 20, direction: 'horizontal', material: 'rigid' },
      branches: [
        { id: 'reception', name: 'Reception', x: 130, y: 115, toX: 130, toY: 180, material: 'rigid' },
        { id: 'exam1', name: 'Exam 1', x: 180, y: 115, toX: 180, toY: 170, material: 'rigid' },
        { id: 'exam2', name: 'Exam 2', x: 230, y: 115, toX: 230, toY: 170, material: 'rigid' },
        { id: 'exam3', name: 'Exam 3', x: 280, y: 115, toX: 280, toY: 170, material: 'rigid' },
        { id: 'office', name: 'Office (Lined)', x: 330, y: 115, toX: 330, toY: 190, material: 'lined' },
        { id: 'breakroom', name: 'Break Room', x: 400, y: 115, toX: 400, toY: 160, material: 'rigid' }
      ]
    },
    accessPoints: [
      { id: 'rtu_port', name: 'RTU Plenum Access', x: 100, y: 95, recommended: true, position: 'upstream', purpose: 'whip', minCuts: true },
      { id: 'trunk_mid', name: 'Mid-Trunk Access', x: 250, y: 95, recommended: true, position: 'downstream', purpose: 'vacuum', minCuts: true },
      { id: 'trunk_end', name: 'End-Trunk Access', x: 410, y: 95, recommended: false, position: 'downstream', purpose: 'vacuum', minCuts: false },
      { id: 'office_access', name: 'Office Branch (Lined)', x: 330, y: 150, recommended: true, position: 'upstream', purpose: 'whip', lined: true, minCuts: true }
    ],
    minCutsRequired: 3,
    optimalCuts: ['rtu_port', 'trunk_mid', 'office_access']
  },
  courthouse: {
    name: 'Durham County Courthouse - PTAC System',
    description: '1950s historic building with wall-mounted PTAC units (hotel-style). Short duct runs to each unit. Lined ductwork throughout. Portable vacuum preferred over truck - short runs make it more effective.',
    requiresLinedCutting: true,
    ptacDetails: {
      type: 'Wall-mounted (hotel-style)',
      count: 47,
      ductRuns: 'Short runs (8-15ft per unit)',
      vacuumNote: 'Portable vacuum works better than truck for short runs',
      liningNote: 'Lined ductwork throughout - insulation-first cuts required'
    },
    layout: {
      width: 480,
      height: 320,
      airHandler: { x: 20, y: 100, width: 60, height: 50, label: 'PTAC Bank' },
      trunk: { x: 80, y: 115, width: 380, height: 20, direction: 'horizontal', material: 'lined' },
      branches: [
        { id: 'courtA', name: 'Courtroom A', x: 140, y: 135, toX: 140, toY: 220, material: 'lined' },
        { id: 'courtB', name: 'Courtroom B', x: 240, y: 135, toX: 240, toY: 220, material: 'lined' },
        { id: 'clerks', name: 'Clerk Offices', x: 340, y: 135, toX: 340, toY: 200, material: 'rigid' },
        { id: 'judges', name: 'Chambers', x: 420, y: 135, toX: 420, toY: 180, material: 'ductboard' }
      ]
    },
    accessPoints: [
      { id: 'ptac_access', name: 'PTAC Plenum Access', x: 90, y: 115, recommended: true, position: 'upstream', purpose: 'whip', lined: true, minCuts: true },
      { id: 'trunk_courtA', name: 'Before Courtroom A', x: 130, y: 115, recommended: true, position: 'downstream', purpose: 'vacuum', lined: true, minCuts: true },
      { id: 'trunk_courtB', name: 'Before Courtroom B', x: 230, y: 115, recommended: false, position: 'downstream', purpose: 'vacuum', lined: true, minCuts: false },
      { id: 'trunk_end', name: 'Trunk End Access', x: 440, y: 115, recommended: true, position: 'downstream', purpose: 'vacuum', lined: true, minCuts: true },
      { id: 'courtA_branch', name: 'Courtroom A Branch', x: 140, y: 170, recommended: false, position: 'upstream', purpose: 'whip', lined: true, minCuts: false },
      { id: 'courtB_branch', name: 'Courtroom B Branch', x: 240, y: 170, recommended: false, position: 'upstream', purpose: 'whip', lined: true, minCuts: false }
    ],
    minCutsRequired: 3,
    optimalCuts: ['ptac_access', 'trunk_courtA', 'trunk_end'],
    specialNote: 'Durham County Courthouse (1950s): Lined ductwork requires insulation-first cuts. 8" circular access holes. Whip toward PTAC units. HIGH asbestos probability - white putty at joints common. Notify Jeff Martinez if suspect material found.',
    asbestosWarning: true
  }
};

const ACCESS_CUT_TYPES = {
  circular: { id: 'circular', name: '8" Circular', tool: 'hole_cutter', icon: '⭕', size: 8 },
  rectangular: { id: 'rectangular', name: 'Rectangular (6"x8")', tool: 'tin_snips', icon: '⬜', size: '6x8' }
};

const ACCESS_CUT_SIZES = {
  small: { id: 'small', name: 'Small (6")', penalty: 10, reason: 'Too small - tools won\'t fit properly' },
  standard: { id: 'standard', name: 'Standard (8")', penalty: 0, reason: 'Optimal size for tool access' },
  large: { id: 'large', name: 'Large (10")', penalty: 5, reason: 'Larger than needed - harder to cap securely' }
};

// ============================================================================
// SITE MAP DATA - 2D Floor Plans for Navigation
// ============================================================================

const SITE_MAPS = {
  residential: {
    name: 'Ranch Home Floor Plan',
    width: 400,
    height: 300,
    startArea: 'entry',
    requiredAreas: ['air_handler', 'electrical_panel', 'return1', 'return2', 'supply_master', 'supply_bed2', 'supply_bed3', 'supply_living', 'supply_kitchen'],
    areas: {
      entry: {
        id: 'entry',
        name: 'Front Entry',
        x: 200, y: 260,
        width: 60, height: 40,
        color: '#4b5563',
        icon: '🚪',
        info: null,
        connections: ['living_room', 'hallway']
      },
      living_room: {
        id: 'living_room',
        name: 'Living Room',
        x: 100, y: 180,
        width: 120, height: 100,
        color: '#374151',
        icon: '🛋️',
        info: null,
        connections: ['entry', 'kitchen', 'hallway'],
        registers: ['return1', 'supply_living']
      },
      return1: {
        id: 'return1',
        name: 'Return 1 (Living Room)',
        x: 60, y: 200,
        width: 30, height: 30,
        color: '#3b82f6',
        icon: '📥',
        info: 'Large 20x25 return grille. Flex duct connection to air handler.',
        isRegister: true,
        connections: ['living_room']
      },
      supply_living: {
        id: 'supply_living',
        name: 'Supply (Living Room)',
        x: 180, y: 200,
        width: 30, height: 30,
        color: '#22c55e',
        icon: '📤',
        info: '12ft flex duct run. Good airflow noted.',
        isRegister: true,
        connections: ['living_room']
      },
      kitchen: {
        id: 'kitchen',
        name: 'Kitchen',
        x: 100, y: 60,
        width: 100, height: 80,
        color: '#374151',
        icon: '🍳',
        info: null,
        connections: ['living_room', 'dining'],
        registers: ['supply_kitchen']
      },
      supply_kitchen: {
        id: 'supply_kitchen',
        name: 'Supply (Kitchen)',
        x: 130, y: 80,
        width: 30, height: 30,
        color: '#22c55e',
        icon: '📤',
        info: '16ft flex duct run. Located under cabinet toe kick.',
        isRegister: true,
        connections: ['kitchen']
      },
      dining: {
        id: 'dining',
        name: 'Dining Room',
        x: 220, y: 60,
        width: 80, height: 80,
        color: '#374151',
        icon: '🍽️',
        info: null,
        connections: ['kitchen', 'hallway'],
        registers: ['supply_dining']
      },
      supply_dining: {
        id: 'supply_dining',
        name: 'Supply (Dining)',
        x: 250, y: 100,
        width: 30, height: 30,
        color: '#22c55e',
        icon: '📤',
        info: '14ft flex duct run. Under china cabinet - will need to move.',
        isRegister: true,
        connections: ['dining']
      },
      hallway: {
        id: 'hallway',
        name: 'Hallway',
        x: 250, y: 160,
        width: 40, height: 100,
        color: '#4b5563',
        icon: '🚶',
        info: null,
        connections: ['entry', 'living_room', 'dining', 'master_bed', 'bed2', 'bed3', 'attic_access'],
        registers: ['return2']
      },
      return2: {
        id: 'return2',
        name: 'Return 2 (Hallway)',
        x: 295, y: 190,
        width: 30, height: 30,
        color: '#3b82f6',
        icon: '📥',
        info: '8ft rigid duct to main trunk. 14x20 filter grille.',
        isRegister: true,
        connections: ['hallway']
      },
      attic_access: {
        id: 'attic_access',
        name: 'Attic Access',
        x: 250, y: 140,
        width: 40, height: 20,
        color: '#fbbf24',
        icon: '🪜',
        info: 'Pull-down stairs. Watch head clearance. Plywood walkway to air handler.',
        connections: ['hallway', 'air_handler']
      },
      air_handler: {
        id: 'air_handler',
        name: 'Air Handler (Attic)',
        x: 200, y: 20,
        width: 60, height: 40,
        color: '#ef4444',
        icon: '❄️',
        info: 'Goodman 3-ton split system. Filter at unit. Main trunk runs east-west.',
        isAirHandler: true,
        connections: ['attic_access']
      },
      master_bed: {
        id: 'master_bed',
        name: 'Master Bedroom',
        x: 320, y: 60,
        width: 80, height: 80,
        color: '#374151',
        icon: '🛏️',
        info: null,
        connections: ['hallway'],
        registers: ['supply_master']
      },
      supply_master: {
        id: 'supply_master',
        name: 'Supply (Master)',
        x: 350, y: 100,
        width: 30, height: 30,
        color: '#22c55e',
        icon: '📤',
        info: '20ft flex duct run - longest in house. Customer mentioned noise here.',
        isRegister: true,
        connections: ['master_bed']
      },
      bed2: {
        id: 'bed2',
        name: 'Bedroom 2',
        x: 320, y: 160,
        width: 60, height: 60,
        color: '#374151',
        icon: '🛏️',
        info: null,
        connections: ['hallway'],
        registers: ['supply_bed2']
      },
      supply_bed2: {
        id: 'supply_bed2',
        name: 'Supply (Bed 2)',
        x: 340, y: 180,
        width: 30, height: 30,
        color: '#22c55e',
        icon: '📤',
        info: '18ft flex duct run. Normal condition.',
        isRegister: true,
        connections: ['bed2']
      },
      bed3: {
        id: 'bed3',
        name: 'Bedroom 3',
        x: 320, y: 230,
        width: 60, height: 60,
        color: '#374151',
        icon: '🛏️',
        info: null,
        connections: ['hallway'],
        registers: ['supply_bed3']
      },
      supply_bed3: {
        id: 'supply_bed3',
        name: 'Supply (Bed 3)',
        x: 340, y: 250,
        width: 30, height: 30,
        color: '#22c55e',
        icon: '📤',
        info: '15ft flex duct run. Normal condition.',
        isRegister: true,
        connections: ['bed3']
      },
      garage: {
        id: 'garage',
        name: 'Garage',
        x: 20, y: 180,
        width: 60, height: 100,
        color: '#1f2937',
        icon: '🚗',
        info: null,
        connections: ['living_room', 'electrical_panel']
      },
      electrical_panel: {
        id: 'electrical_panel',
        name: 'Electrical Panel',
        x: 20, y: 260,
        width: 40, height: 30,
        color: '#f59e0b',
        icon: '⚡',
        info: 'Main panel in garage. Found 20A circuit labeled "HVAC". Outlet nearby.',
        isElectrical: true,
        connections: ['garage']
      }
    }
  },
  commercial: {
    name: 'Strip Mall - Dental Office',
    width: 450,
    height: 350,
    startArea: 'rear_entrance',
    requiredAreas: ['rtu_access', 'electrical_panel', 'reception_reg', 'exam1_reg', 'exam2_reg', 'exam3_reg', 'office_reg', 'lab_reg', 'breakroom_reg'],
    areas: {
      rear_entrance: {
        id: 'rear_entrance',
        name: 'Rear Entrance',
        x: 400, y: 310,
        width: 40, height: 40,
        color: '#4b5563',
        icon: '🚪',
        info: 'Service entrance. Alarm panel inside - enter code.',
        connections: ['back_hallway', 'exterior']
      },
      exterior: {
        id: 'exterior',
        name: 'Exterior/Parking',
        x: 400, y: 260,
        width: 50, height: 40,
        color: '#1f2937',
        icon: '🅿️',
        info: 'Roof ladder access on east side of building.',
        connections: ['rear_entrance', 'roof_access']
      },
      roof_access: {
        id: 'roof_access',
        name: 'Roof Ladder',
        x: 420, y: 200,
        width: 30, height: 50,
        color: '#f59e0b',
        icon: '🪜',
        info: 'Fixed ladder to roof. Tie off point at top.',
        connections: ['exterior', 'rtu_access']
      },
      rtu_access: {
        id: 'rtu_access',
        name: 'Rooftop Unit',
        x: 200, y: 10,
        width: 80, height: 50,
        color: '#ef4444',
        icon: '❄️',
        info: 'Carrier 7.5-ton RTU. 100ft hose run needed. Port on supply plenum.',
        isAirHandler: true,
        connections: ['roof_access']
      },
      back_hallway: {
        id: 'back_hallway',
        name: 'Back Hallway',
        x: 320, y: 180,
        width: 40, height: 130,
        color: '#4b5563',
        icon: '🚶',
        info: null,
        connections: ['rear_entrance', 'breakroom', 'lab', 'exam3', 'main_hallway']
      },
      breakroom: {
        id: 'breakroom',
        name: 'Break Room',
        x: 370, y: 180,
        width: 60, height: 50,
        color: '#374151',
        icon: '☕',
        info: null,
        connections: ['back_hallway'],
        registers: ['breakroom_reg']
      },
      breakroom_reg: {
        id: 'breakroom_reg',
        name: 'Supply (Break Room)',
        x: 390, y: 200,
        width: 25, height: 25,
        color: '#22c55e',
        icon: '📤',
        info: '18ft rigid run. Ceiling diffuser.',
        isRegister: true,
        connections: ['breakroom']
      },
      lab: {
        id: 'lab',
        name: 'Lab',
        x: 370, y: 120,
        width: 60, height: 50,
        color: '#374151',
        icon: '🔬',
        info: null,
        connections: ['back_hallway'],
        registers: ['lab_reg']
      },
      lab_reg: {
        id: 'lab_reg',
        name: 'Supply (Lab)',
        x: 390, y: 140,
        width: 25, height: 25,
        color: '#22c55e',
        icon: '📤',
        info: '22ft rigid run. Keep equipment covered - sensitive instruments.',
        isRegister: true,
        connections: ['lab']
      },
      exam3: {
        id: 'exam3',
        name: 'Exam Room 3',
        x: 240, y: 240,
        width: 70, height: 60,
        color: '#374151',
        icon: '🦷',
        info: null,
        connections: ['back_hallway', 'main_hallway'],
        registers: ['exam3_reg']
      },
      exam3_reg: {
        id: 'exam3_reg',
        name: 'Supply (Exam 3)',
        x: 270, y: 260,
        width: 25, height: 25,
        color: '#22c55e',
        icon: '📤',
        info: '28ft rigid run. Linear slot diffuser.',
        isRegister: true,
        connections: ['exam3']
      },
      main_hallway: {
        id: 'main_hallway',
        name: 'Main Hallway',
        x: 180, y: 120,
        width: 40, height: 180,
        color: '#4b5563',
        icon: '🚶',
        info: 'Main duct trunk runs above ceiling here.',
        connections: ['back_hallway', 'exam3', 'exam2', 'exam1', 'office', 'reception']
      },
      exam2: {
        id: 'exam2',
        name: 'Exam Room 2',
        x: 240, y: 170,
        width: 70, height: 60,
        color: '#374151',
        icon: '🦷',
        info: null,
        connections: ['main_hallway'],
        registers: ['exam2_reg']
      },
      exam2_reg: {
        id: 'exam2_reg',
        name: 'Supply (Exam 2)',
        x: 270, y: 190,
        width: 25, height: 25,
        color: '#22c55e',
        icon: '📤',
        info: '30ft rigid run. Ceiling supply.',
        isRegister: true,
        connections: ['exam2']
      },
      exam1: {
        id: 'exam1',
        name: 'Exam Room 1',
        x: 240, y: 100,
        width: 70, height: 60,
        color: '#374151',
        icon: '🦷',
        info: null,
        connections: ['main_hallway'],
        registers: ['exam1_reg']
      },
      exam1_reg: {
        id: 'exam1_reg',
        name: 'Supply (Exam 1)',
        x: 270, y: 120,
        width: 25, height: 25,
        color: '#22c55e',
        icon: '📤',
        info: '30ft rigid run. Same as Exam 2.',
        isRegister: true,
        connections: ['exam1']
      },
      office: {
        id: 'office',
        name: 'Office',
        x: 100, y: 200,
        width: 70, height: 60,
        color: '#374151',
        icon: '💼',
        info: null,
        connections: ['main_hallway'],
        registers: ['office_reg']
      },
      office_reg: {
        id: 'office_reg',
        name: 'Supply (Office)',
        x: 130, y: 220,
        width: 25, height: 25,
        color: '#22c55e',
        icon: '📤',
        info: '20ft lined duct run. Diffuser at desk area.',
        isRegister: true,
        connections: ['office']
      },
      reception: {
        id: 'reception',
        name: 'Reception',
        x: 40, y: 100,
        width: 120, height: 80,
        color: '#374151',
        icon: '🪑',
        info: null,
        connections: ['main_hallway', 'front_entrance'],
        registers: ['reception_reg', 'main_return']
      },
      reception_reg: {
        id: 'reception_reg',
        name: 'Supply (Reception)',
        x: 80, y: 120,
        width: 25, height: 25,
        color: '#22c55e',
        icon: '📤',
        info: '25ft rigid run. Large 4-way diffuser for waiting area.',
        isRegister: true,
        connections: ['reception']
      },
      main_return: {
        id: 'main_return',
        name: 'Main Return',
        x: 120, y: 150,
        width: 30, height: 25,
        color: '#3b82f6',
        icon: '📥',
        info: '24x24 return grille. 60ft return trunk to RTU.',
        isRegister: true,
        connections: ['reception']
      },
      front_entrance: {
        id: 'front_entrance',
        name: 'Front Entrance',
        x: 40, y: 60,
        width: 50, height: 30,
        color: '#4b5563',
        icon: '🚪',
        info: 'Main customer entrance. Locked after hours.',
        connections: ['reception']
      },
      electrical_panel: {
        id: 'electrical_panel',
        name: 'Electrical Panel',
        x: 320, y: 120,
        width: 35, height: 30,
        color: '#f59e0b',
        icon: '⚡',
        info: '200A service. RTU on 60A breaker. Found 20A outlet in lab.',
        isElectrical: true,
        connections: ['back_hallway']
      }
    }
  },
  courthouse: {
    name: 'Durham County Courthouse',
    width: 450,
    height: 380,
    startArea: 'main_entrance',
    floors: [1, 2, 3],
    requiredAreas: {
      1: ['floor1_mechanical', 'floor1_electrical', 'floor1_courta_reg', 'floor1_courtb_reg', 'floor1_clerk_reg1', 'floor1_clerk_reg2'],
      2: ['floor2_mechanical', 'floor2_electrical', 'floor2_courtc_reg', 'floor2_chambers_reg1', 'floor2_chambers_reg2'],
      3: ['floor3_mechanical', 'floor3_electrical', 'floor3_admin_reg1', 'floor3_admin_reg2', 'floor3_records_reg', 'floor3_ptac1', 'floor3_ptac2']
    },
    floorPlans: {
      1: {
        name: 'Floor 1 - Ground Level',
        areas: {
          main_entrance: {
            id: 'main_entrance',
            name: 'Main Entrance',
            x: 200, y: 340,
            width: 50, height: 30,
            color: '#4b5563',
            icon: '🚪',
            info: 'Security checkpoint. Sign in required.',
            connections: ['main_lobby']
          },
          main_lobby: {
            id: 'main_lobby',
            name: 'Main Lobby',
            x: 150, y: 260,
            width: 150, height: 70,
            color: '#374151',
            icon: '🏛️',
            info: 'High traffic area. Work after hours only.',
            connections: ['main_entrance', 'floor1_corridor', 'stairwell']
          },
          stairwell: {
            id: 'stairwell',
            name: 'Stairwell',
            x: 380, y: 160,
            width: 40, height: 100,
            color: '#4b5563',
            icon: '🪜',
            info: 'Access to all floors. Equipment staging area.',
            connections: ['main_lobby', 'floor1_corridor'],
            isStairwell: true
          },
          floor1_corridor: {
            id: 'floor1_corridor',
            name: 'Main Corridor',
            x: 150, y: 140,
            width: 200, height: 40,
            color: '#4b5563',
            icon: '🚶',
            info: '120ft main trunk above ceiling tiles.',
            connections: ['main_lobby', 'stairwell', 'courtroom_a', 'courtroom_b', 'clerk_offices', 'floor1_mechanical']
          },
          courtroom_a: {
            id: 'courtroom_a',
            name: 'Courtroom A',
            x: 40, y: 60,
            width: 120, height: 100,
            color: '#374151',
            icon: '⚖️',
            info: 'Active courtroom. Coordinate with bailiff.',
            connections: ['floor1_corridor'],
            registers: ['floor1_courta_reg']
          },
          floor1_courta_reg: {
            id: 'floor1_courta_reg',
            name: 'Supply (Courtroom A)',
            x: 80, y: 100,
            width: 30, height: 30,
            color: '#22c55e',
            icon: '📤',
            info: '45ft lined duct. Large ceiling diffuser. Quiet operation required.',
            isRegister: true,
            connections: ['courtroom_a']
          },
          courtroom_b: {
            id: 'courtroom_b',
            name: 'Courtroom B',
            x: 40, y: 180,
            width: 90, height: 80,
            color: '#374151',
            icon: '⚖️',
            info: 'Smaller courtroom. Usually hearings only.',
            connections: ['floor1_corridor'],
            registers: ['floor1_courtb_reg']
          },
          floor1_courtb_reg: {
            id: 'floor1_courtb_reg',
            name: 'Supply (Courtroom B)',
            x: 70, y: 210,
            width: 30, height: 30,
            color: '#22c55e',
            icon: '📤',
            info: '45ft lined duct. Similar to Courtroom A.',
            isRegister: true,
            connections: ['courtroom_b']
          },
          clerk_offices: {
            id: 'clerk_offices',
            name: 'Clerk Offices',
            x: 200, y: 60,
            width: 140, height: 70,
            color: '#374151',
            icon: '📋',
            info: 'Open office area. 4 workstations.',
            connections: ['floor1_corridor'],
            registers: ['floor1_clerk_reg1', 'floor1_clerk_reg2']
          },
          floor1_clerk_reg1: {
            id: 'floor1_clerk_reg1',
            name: 'Supply (Clerk 1)',
            x: 230, y: 80,
            width: 25, height: 25,
            color: '#22c55e',
            icon: '📤',
            info: '60ft rigid run. Linear diffuser.',
            isRegister: true,
            connections: ['clerk_offices']
          },
          floor1_clerk_reg2: {
            id: 'floor1_clerk_reg2',
            name: 'Supply (Clerk 2)',
            x: 290, y: 80,
            width: 25, height: 25,
            color: '#22c55e',
            icon: '📤',
            info: '55ft rigid run. Same trunk as Clerk 1.',
            isRegister: true,
            connections: ['clerk_offices']
          },
          floor1_mechanical: {
            id: 'floor1_mechanical',
            name: 'Mechanical Room',
            x: 380, y: 60,
            width: 50, height: 80,
            color: '#ef4444',
            icon: '🔧',
            info: 'Floor 1 AHU location. Fan coil units here.',
            isAirHandler: true,
            connections: ['floor1_corridor', 'floor1_electrical']
          },
          floor1_electrical: {
            id: 'floor1_electrical',
            name: 'Electrical Room',
            x: 380, y: 260,
            width: 40, height: 50,
            color: '#f59e0b',
            icon: '⚡',
            info: 'Floor 1 panel. 30A circuit available for equipment.',
            isElectrical: true,
            connections: ['stairwell']
          }
        }
      },
      2: {
        name: 'Floor 2 - Courtrooms',
        areas: {
          stairwell: {
            id: 'stairwell',
            name: 'Stairwell',
            x: 380, y: 160,
            width: 40, height: 100,
            color: '#4b5563',
            icon: '🪜',
            info: 'Floor 2 landing.',
            connections: ['floor2_corridor'],
            isStairwell: true
          },
          floor2_corridor: {
            id: 'floor2_corridor',
            name: 'Main Corridor',
            x: 150, y: 160,
            width: 200, height: 40,
            color: '#4b5563',
            icon: '🚶',
            info: '120ft trunk. Historic plaster ceilings - use care.',
            connections: ['stairwell', 'courtroom_c', 'judge_chambers', 'conference', 'floor2_mechanical']
          },
          courtroom_c: {
            id: 'courtroom_c',
            name: 'Courtroom C',
            x: 40, y: 80,
            width: 130, height: 120,
            color: '#374151',
            icon: '⚖️',
            info: 'Largest courtroom. Judge Williams - strict about noise.',
            connections: ['floor2_corridor'],
            registers: ['floor2_courtc_reg']
          },
          floor2_courtc_reg: {
            id: 'floor2_courtc_reg',
            name: 'Supply (Courtroom C)',
            x: 90, y: 130,
            width: 30, height: 30,
            color: '#22c55e',
            icon: '📤',
            info: '50ft lined duct. Ornate ceiling grille.',
            isRegister: true,
            connections: ['courtroom_c']
          },
          judge_chambers: {
            id: 'judge_chambers',
            name: 'Judge Chambers',
            x: 200, y: 60,
            width: 150, height: 90,
            color: '#374151',
            icon: '👨‍⚖️',
            info: 'Private offices. Schedule varies. Historic woodwork.',
            connections: ['floor2_corridor'],
            registers: ['floor2_chambers_reg1', 'floor2_chambers_reg2']
          },
          floor2_chambers_reg1: {
            id: 'floor2_chambers_reg1',
            name: 'Supply (Chambers 1)',
            x: 230, y: 90,
            width: 25, height: 25,
            color: '#22c55e',
            icon: '📤',
            info: '80ft ductboard run. Handle with extreme care.',
            isRegister: true,
            connections: ['judge_chambers']
          },
          floor2_chambers_reg2: {
            id: 'floor2_chambers_reg2',
            name: 'Supply (Chambers 2)',
            x: 300, y: 90,
            width: 25, height: 25,
            color: '#22c55e',
            icon: '📤',
            info: '75ft ductboard. Same caution applies.',
            isRegister: true,
            connections: ['judge_chambers']
          },
          conference: {
            id: 'conference',
            name: 'Conference Rooms',
            x: 40, y: 220,
            width: 100, height: 70,
            color: '#374151',
            icon: '👥',
            info: 'Attorney meeting rooms. Usually available.',
            connections: ['floor2_corridor']
          },
          floor2_mechanical: {
            id: 'floor2_mechanical',
            name: 'Mechanical Closet',
            x: 380, y: 60,
            width: 50, height: 80,
            color: '#ef4444',
            icon: '🔧',
            info: 'Floor 2 fan coils. Tight space.',
            isAirHandler: true,
            connections: ['floor2_corridor', 'floor2_electrical']
          },
          floor2_electrical: {
            id: 'floor2_electrical',
            name: 'Electrical Panel',
            x: 380, y: 270,
            width: 40, height: 40,
            color: '#f59e0b',
            icon: '⚡',
            info: 'Sub-panel for Floor 2. 20A available.',
            isElectrical: true,
            connections: ['stairwell']
          }
        }
      },
      3: {
        name: 'Floor 3 - Administration',
        areas: {
          stairwell: {
            id: 'stairwell',
            name: 'Stairwell',
            x: 380, y: 160,
            width: 40, height: 100,
            color: '#4b5563',
            icon: '🪜',
            info: 'Top floor. Roof access hatch in ceiling.',
            connections: ['floor3_corridor'],
            isStairwell: true
          },
          floor3_corridor: {
            id: 'floor3_corridor',
            name: 'Main Corridor',
            x: 150, y: 160,
            width: 200, height: 40,
            color: '#4b5563',
            icon: '🚶',
            info: '110ft main trunk. Less restrictive schedule.',
            connections: ['stairwell', 'admin_offices', 'records_room', 'it_room', 'floor3_mechanical']
          },
          admin_offices: {
            id: 'admin_offices',
            name: 'Admin Offices',
            x: 40, y: 80,
            width: 160, height: 100,
            color: '#374151',
            icon: '📋',
            info: 'County admin staff. Open floor plan.',
            connections: ['floor3_corridor'],
            registers: ['floor3_admin_reg1', 'floor3_admin_reg2', 'floor3_ptac1']
          },
          floor3_admin_reg1: {
            id: 'floor3_admin_reg1',
            name: 'Supply (Admin 1)',
            x: 70, y: 110,
            width: 25, height: 25,
            color: '#22c55e',
            icon: '📤',
            info: '90ft rigid duct. Long run but accessible.',
            isRegister: true,
            connections: ['admin_offices']
          },
          floor3_admin_reg2: {
            id: 'floor3_admin_reg2',
            name: 'Supply (Admin 2)',
            x: 140, y: 110,
            width: 25, height: 25,
            color: '#22c55e',
            icon: '📤',
            info: '85ft rigid duct. Same trunk.',
            isRegister: true,
            connections: ['admin_offices']
          },
          floor3_ptac1: {
            id: 'floor3_ptac1',
            name: 'PTAC Unit 1',
            x: 60, y: 150,
            width: 30, height: 20,
            color: '#a855f7',
            icon: '📦',
            info: 'Wall-mounted PTAC. Filter and coil cleaning.',
            isPTAC: true,
            connections: ['admin_offices']
          },
          records_room: {
            id: 'records_room',
            name: 'Records Room',
            x: 220, y: 60,
            width: 100, height: 90,
            color: '#374151',
            icon: '📁',
            info: 'Sensitive documents. Cover EVERYTHING with plastic.',
            connections: ['floor3_corridor'],
            registers: ['floor3_records_reg']
          },
          floor3_records_reg: {
            id: 'floor3_records_reg',
            name: 'Supply (Records)',
            x: 260, y: 90,
            width: 25, height: 25,
            color: '#22c55e',
            icon: '📤',
            info: '40ft ductboard. Air wash only - no contact tools!',
            isRegister: true,
            connections: ['records_room']
          },
          it_room: {
            id: 'it_room',
            name: 'IT/Server Room',
            x: 40, y: 220,
            width: 100, height: 80,
            color: '#374151',
            icon: '🖥️',
            info: 'Temperature critical. Coordinate with IT staff.',
            connections: ['floor3_corridor'],
            registers: ['floor3_ptac2']
          },
          floor3_ptac2: {
            id: 'floor3_ptac2',
            name: 'PTAC Unit 2',
            x: 80, y: 260,
            width: 30, height: 20,
            color: '#a855f7',
            icon: '📦',
            info: 'Server room PTAC. Critical for cooling.',
            isPTAC: true,
            connections: ['it_room']
          },
          floor3_mechanical: {
            id: 'floor3_mechanical',
            name: 'Mechanical Room',
            x: 380, y: 60,
            width: 50, height: 80,
            color: '#ef4444',
            icon: '🔧',
            info: 'Floor 3 AHU. Also houses 8 PTAC filter stock.',
            isAirHandler: true,
            connections: ['floor3_corridor', 'floor3_electrical']
          },
          floor3_electrical: {
            id: 'floor3_electrical',
            name: 'Electrical Panel',
            x: 380, y: 270,
            width: 40, height: 40,
            color: '#f59e0b',
            icon: '⚡',
            info: 'Floor 3 panel. Multiple 20A circuits available.',
            isElectrical: true,
            connections: ['stairwell']
          }
        }
      }
    }
  }
};

// ============================================================================
// MULTI-DAY COURTHOUSE DATA
// ============================================================================

const COURTHOUSE_FLOORS = {
  1: {
    name: 'Floor 1 - Ground Level',
    description: 'Clerk offices, public areas, main lobby. High foot traffic zone.',
    ductPrefix: 'floor1_',
    ptacCount: 16,
    challenges: [
      'High foot traffic - work around public hours',
      'Security screening area - coordinate with deputies',
      'Clerk offices occupied - minimize disruption',
      'Thomas and Andrew handling Floor 2 while we work here'
    ],
    crewAssignment: 'Jeff runs point, Nate on support'
  },
  2: {
    name: 'Floor 2 - Courtrooms',
    description: 'Courtrooms A, B, C. Work around court schedules - check session times.',
    ductPrefix: 'floor2_',
    ptacCount: 15,
    challenges: [
      'Court in session - wait for recess',
      'Quiet zones required during proceedings',
      'Historic fixtures - document before touching',
      'Judge Williams strict about noise levels'
    ],
    crewAssignment: 'Thomas (lead), Andrew on support'
  },
  3: {
    name: 'Floor 3 - Restricted',
    description: 'Judge chambers, records room, admin offices. Security escort required.',
    ductPrefix: 'floor3_',
    ptacCount: 16,
    challenges: [
      'Security escort required at all times',
      'Judge chambers - schedule varies, check with assistant',
      'Records room - cover EVERYTHING with plastic',
      'PTAC units throughout - short duct runs',
      'Asbestos-suspect material likely (1950s construction)'
    ],
    crewAssignment: 'Full crew - Jack and Bryson prep PTAC filters'
  }
};

const DAY_START_EVENTS = {
  returning_crew: [
    { id: 'fast_checkin', text: "Security remembers you from yesterday - faster check-in today.", bonus: 2, type: 'positive' },
    { id: 'equipment_where', text: "Your equipment is right where you left it in the staging area.", bonus: 0, type: 'neutral' },
    { id: 'morning_coffee', text: "Jeff Martinez from Facilities brought coffee for the crew. 'Heard good things about yesterday's work.'", bonus: 3, type: 'positive' },
    { id: 'badges_ready', text: "Security has your badges ready. 'You guys are becoming regulars around here.'", bonus: 1, type: 'positive' }
  ],
  callbacks: [
    { id: 'register_callback', text: "Jeff: 'That register you flagged yesterday in Courtroom A - can you take another look? Judge noticed a rattle.'", task: 'reinspect_register', floor: 1 },
    { id: 'airflow_question', text: "Clerk from Floor 1: 'The air feels different today - in a good way! What did you do?'", task: 'explain_work', floor: 1 },
    { id: 'noise_complaint', text: "Security: 'Got a complaint about noise from yesterday. Judge Williams wasn't happy.'", penalty: 5, type: 'negative' },
    { id: 'dust_followup', text: "Jeff: 'Admin on Floor 2 said there was some dust on their desks. Did we miss covering something?'", task: 'apologize', penalty: 3 },
    { id: 'ptac_rattle', text: "Judge's assistant: 'That PTAC unit you cleaned yesterday - it's quieter! The judge noticed.'", bonus: 2, type: 'positive' }
  ],
  morning_briefing: [
    { id: 'schedule_change', text: "Court schedule changed - Courtroom C has a trial starting at 10 AM instead of 2 PM.", impact: 'Must work around new schedule' },
    { id: 'vip_visit', text: "Heads up: County Commissioner touring the building at 2 PM. Look sharp.", impact: 'Extra scrutiny' },
    { id: 'hvac_issue', text: "Overnight HVAC had issues on Floor 3. Might find more debris than expected.", impact: 'Extra cleaning needed' },
    { id: 'judge_schedule', text: "Judge Patterson out sick today - his chambers are clear for work.", impact: 'Bonus access time' }
  ]
};

// Random events that can occur during courthouse execution phase
const COURTHOUSE_RANDOM_EVENTS = [
  {
    id: 'court_session_b',
    text: "Court in session in Room B - wait for recess.",
    type: 'delay',
    waitTime: 45,
    floor: 2,
    resolution: "Bailiff signals recess at 10:30. You have 15 minutes."
  },
  {
    id: 'security_escort_f3',
    text: "Security needs to escort you to Floor 3. Deputy on the way.",
    type: 'delay',
    waitTime: 10,
    floor: 3,
    resolution: "Deputy arrives. 'Stay with me up there - restricted area.'"
  },
  {
    id: 'facilities_coffee',
    text: "Jeff Martinez brought coffee for the crew. Quick break.",
    type: 'positive',
    bonus: 2,
    resolution: "'How's it going up here? Any issues I should know about?'"
  },
  {
    id: 'judge_assistant',
    text: "Judge's assistant asking how much longer in chambers.",
    type: 'pressure',
    floor: 3,
    resolution: "You estimate 45 minutes. She nods. 'Judge has a 2 PM call.'"
  },
  {
    id: 'white_putty',
    text: "Found white putty at a duct joint. Building is 1950s - flag this.",
    type: 'hazard',
    critical: true,
    resolution: "Document location, do not disturb. Notify Jeff Martinez."
  },
  {
    id: 'historic_grille',
    text: "Ornate brass grille - historic. Clerk says it's original 1950s.",
    type: 'caution',
    resolution: "Clean in place. Do NOT remove. Document condition first."
  },
  {
    id: 'crew_check',
    text: "Radio crackles: 'Jeff here. Thomas, how's Floor 2 looking?'",
    type: 'crew',
    resolution: "Thomas: 'Courtroom C done. Moving to chambers.'"
  },
  {
    id: 'trailer_parking',
    text: "Bryson on radio: 'Had to move the trailer - meter maid giving tickets.'",
    type: 'logistics',
    resolution: "He found street parking two blocks over."
  },
  {
    id: 'filter_shortage',
    text: "Jack: 'Running low on 16x25 filters. Need a supply run?'",
    type: 'logistics',
    resolution: "Check remaining PTAC units - might need to send someone."
  },
  {
    id: 'clerk_thanks',
    text: "Clerk pops head in: 'Already breathing easier in here. Thanks!'",
    type: 'positive',
    bonus: 1,
    resolution: "Good feedback to pass along to Jeff."
  }
];

const DAY_END_SUMMARY = {
  packUp: [
    'Secure all equipment in staging area',
    'Cover exposed ductwork with plastic',
    'Remove drop cloths from work areas',
    'Collect all debris and dispose properly',
    'Document progress with photos'
  ],
  securityCheckout: [
    'Return temporary access badges',
    'Sign out at security desk',
    'Confirm tomorrow\'s arrival time',
    'Report any issues or concerns'
  ]
};

// Helper to get ducts for current day in courthouse
function getCourthouseDuctsForDay(day) {
  const floor = COURTHOUSE_FLOORS[day];
  if (!floor) return [];

  const allDucts = SCENARIO_DUCTS.courthouse;
  return allDucts.filter(duct => {
    // Include ducts for the current floor, or PTAC units on final day
    if (duct.id.startsWith(floor.ductPrefix)) return true;
    if (day === 3 && duct.id === 'ptac_units') return true;
    return false;
  });
}

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

// Generate registers for a specific day in multi-day courthouse scenario
function generateRegistersForDay(scenario, day) {
  if (scenario !== 'courthouse') {
    return generateRegistersForScenario(scenario);
  }
  const ducts = getCourthouseDuctsForDay(day);
  const registers = ducts
    .filter(d => d.type === 'supply' || d.type === 'return')
    .map(duct => ({
      id: `reg_${duct.id}_day${day}`,
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
    { id: 'security_clearance', name: 'Security Clearance Hold', description: 'Security won\'t grant access to Floor 3 - restricted area', solution: 'Contact Jeff Martinez, provide credentials, wait for deputy escort', phase: 'arrival' },
    { id: 'court_in_session', name: 'Court In Session (Room B)', description: 'Cannot work near active courtroom - trial in progress', solution: 'Work other areas, return during recess (usually 10:30 or 2:30)', phase: 'execution' },
    { id: 'historic_register', name: 'Historic Brass Grille', description: 'Ornate 1950s brass grille - original to building, irreplaceable', solution: 'Document condition first, clean in place ONLY, photograph any concerns', phase: 'execution' },
    { id: 'asbestos_discovery', name: 'Suspected Asbestos (White Putty)', description: 'White putty at duct joints - 1950s building, high probability ACM', solution: 'STOP WORK immediately, do not disturb, document location, notify Jeff Martinez', phase: 'execution', critical: true, probability: 0.35 },
    { id: 'asbestos_insulation', name: 'Fibrous Duct Insulation', description: 'Old fibrous insulation visible - possible asbestos content', solution: 'STOP WORK, same protocol as white putty - assume worst until tested', phase: 'execution', critical: true, probability: 0.2 },
    { id: 'crew_coordination', name: 'Crew Miscommunication', description: 'Thomas started on Floor 3 before security escort arrived', solution: 'Radio to redirect, verify floor assignments, wait for deputy', phase: 'execution' },
    { id: 'judge_chambers_timing', name: 'Judge Returning Early', description: 'Judge\'s assistant warns judge returning in 20 minutes', solution: 'Pack up quickly, document progress, can resume after lunch', phase: 'execution' },
    { id: 'ptac_drain_clog', name: 'PTAC Drain Pan Overflow', description: 'Wall-mounted PTAC drain pan clogged - water damage risk', solution: 'Clear drain, add drain pan tablet, document for facilities', phase: 'execution' },
    { id: 'trailer_parking', name: 'Equipment Trailer Ticketed', description: 'Third van/trailer got a parking ticket on Church Street', solution: 'Move to alternate location, note for expense report', phase: 'execution' }
  ]
};

const HAZARDS = [
  { id: 'mold', name: 'Visible Mold', description: 'Dark growth visible on duct surface', action: 'STOP WORK', protocol: 'Do not disturb. Document. Notify customer. Exit area.', scenarioProbability: { residential: 0.05, commercial: 0.08, courthouse: 0.03 } },
  { id: 'asbestos', name: 'Asbestos-Suspect Material', description: 'White putty at duct joints, fibrous insulation material', action: 'STOP WORK', protocol: 'Same as mold. Durham Courthouse is 1950s construction - HIGH probability. Do not disturb, document location, notify Jeff Martinez.', scenarioProbability: { residential: 0.02, commercial: 0.05, courthouse: 0.35 } },
  { id: 'dead_animal', name: 'Dead Animal', description: 'Decomposing remains in ductwork', action: 'PPE UPGRADE', protocol: 'Full PPE, careful removal, sanitization required.', scenarioProbability: { residential: 0.08, commercial: 0.03, courthouse: 0.01 } }
];

const TOOLS = [
  { id: 'aggressive_whip', name: 'Aggressive Whip', icon: '🌀', desc: 'High-power for rigid metal' },
  { id: 'gentle_whip', name: 'Gentle Whip', icon: '💫', desc: 'Low-power for flex/lined' },
  { id: 'rotating_brush', name: 'Rotating Brush', icon: '🔄', desc: 'Deep clean rigid metal' },
  { id: 'air_wash', name: 'Air Wash Only', icon: '💨', desc: 'Non-contact, all types' }
];

// ============================================================================
// VACUUM GAUGE SCENARIOS
// ============================================================================

const GAUGE_SCENARIOS = {
  normal_steady: {
    id: 'normal_steady',
    name: 'Normal - Steady Reading',
    description: 'Gauge holding steady at rated vacuum. System operating normally.',
    needlePosition: 75, // percentage of max
    needleBehavior: 'steady',
    correctDiagnosis: 'system_healthy',
    icon: '✅',
    color: '#22c55e'
  },
  dropping_slowly: {
    id: 'dropping_slowly',
    name: 'Slowly Dropping',
    description: 'Vacuum reading gradually decreasing over time. Started at rated, now losing inches.',
    needlePosition: 55,
    needleBehavior: 'dropping',
    correctDiagnosis: 'filter_loading',
    icon: '📉',
    color: '#f59e0b'
  },
  dropped_suddenly: {
    id: 'dropped_suddenly',
    name: 'Sudden Drop',
    description: 'Vacuum suddenly dropped from rated to near zero. Happened mid-cleaning.',
    needlePosition: 15,
    needleBehavior: 'low',
    correctDiagnosis: 'blockage_or_leak',
    icon: '⚠️',
    color: '#ef4444'
  },
  wont_reach_rated: {
    id: 'wont_reach_rated',
    name: 'Won\'t Reach Rated Vacuum',
    description: 'System started but gauge never climbed to rated vacuum. Maxed out at 60% of expected.',
    needlePosition: 45,
    needleBehavior: 'stuck',
    correctDiagnosis: 'blower_issue',
    icon: '🔧',
    color: '#f97316'
  },
  fluctuating: {
    id: 'fluctuating',
    name: 'Fluctuating Wildly',
    description: 'Needle bouncing erratically between 30% and 80% of rated vacuum.',
    needlePosition: 50,
    needleBehavior: 'fluctuating',
    correctDiagnosis: 'intermittent_blockage',
    icon: '📊',
    color: '#8b5cf6'
  }
};

const GAUGE_DIAGNOSES = [
  { id: 'system_healthy', text: 'System healthy - continue cleaning', forScenario: 'normal_steady' },
  { id: 'filter_loading', text: 'Filter loading or minor leak - check filter first', forScenario: 'dropping_slowly' },
  { id: 'blockage_or_leak', text: 'Major blockage or disconnect - stop and inspect entire line', forScenario: 'dropped_suddenly' },
  { id: 'blower_issue', text: 'Blower problem or massive air leak - do not force, check equipment', forScenario: 'wont_reach_rated' },
  { id: 'intermittent_blockage', text: 'Intermittent obstruction - debris may clear or needs inspection', forScenario: 'fluctuating' }
];

// ============================================================================
// INITIAL STATE & REDUCER
// ============================================================================

const initialState = {
  phase: 0,
  subPhase: 0,
  scenario: null,
  score: 100,
  paused: false,
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
  ductPhotos: {}, // { ductId: { before: true, after: true, quality: 'excellent' } }
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
  timeDelay: 0,
  // Multi-day courthouse state
  dayPhase: null, // 'day-start' or 'day-end' for transition screens
  dayProgress: {}, // { 1: { ductsClean: {}, score: 100 }, 2: {...} }
  dayScores: [], // Score breakdown per day
  dayStartEvent: null, // Random event at start of day
  dayCallback: null, // Callback from previous day
  dayPackedUp: false, // Equipment packed for day
  dayCheckedOut: false, // Security checkout complete
  // Site map navigation state
  siteMapCompleted: false,
  currentLocation: null, // Current area id
  visitedAreas: {}, // { areaId: true }
  discoveredInfo: {}, // { areaId: info string }
  currentFloor: 1, // For courthouse multi-floor navigation
  // Access cutting state
  accessCuts: [], // Array of { id, location, type, size, lined, linedDuctHandled, capped }
  accessCuttingComplete: false
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
    case 'TAKE_DUCT_PHOTO':
      return {
        ...state,
        ductPhotos: {
          ...state.ductPhotos,
          [action.ductId]: {
            before: true,
            after: true,
            quality: state.ductsClean[action.ductId] || 'good',
            ductName: action.ductName
          }
        }
      };
    case 'COMPLETE_WALKTHROUGH':
      return { ...state, customerWalkthrough: true };
    case 'SET_DIALOGUE':
      return { ...state, currentDialogue: action.dialogue };
    case 'CLEAR_SECURITY':
      return { ...state, securityCleared: true };
    case 'ASSIGN_CREW':
      return { ...state, crewAssigned: true };
    // Site map navigation actions
    case 'INIT_SITE_MAP': {
      const siteMap = SITE_MAPS[state.scenario];
      const startArea = state.scenario === 'courthouse'
        ? siteMap.floorPlans[1].areas[siteMap.startArea]?.id || 'main_entrance'
        : siteMap.startArea;
      return {
        ...state,
        currentLocation: startArea,
        visitedAreas: { [startArea]: true },
        currentFloor: 1
      };
    }
    case 'MOVE_TO_AREA': {
      const newVisited = { ...state.visitedAreas, [action.areaId]: true };
      const siteMap = SITE_MAPS[state.scenario];
      let areaInfo = null;

      if (state.scenario === 'courthouse') {
        const floorPlan = siteMap.floorPlans[state.currentFloor];
        areaInfo = floorPlan?.areas[action.areaId]?.info;
      } else {
        areaInfo = siteMap.areas[action.areaId]?.info;
      }

      const newDiscovered = areaInfo
        ? { ...state.discoveredInfo, [action.areaId]: areaInfo }
        : state.discoveredInfo;

      return {
        ...state,
        currentLocation: action.areaId,
        visitedAreas: newVisited,
        discoveredInfo: newDiscovered
      };
    }
    case 'CHANGE_FLOOR':
      return {
        ...state,
        currentFloor: action.floor,
        currentLocation: 'stairwell'
      };
    case 'COMPLETE_SITE_MAP':
      return { ...state, siteMapCompleted: true };
    // Access cutting actions
    case 'ADD_ACCESS_CUT': {
      const newCut = {
        id: action.id,
        location: action.location,
        name: action.name,
        type: action.cutType, // circular or rectangular
        size: action.size, // small, standard, large
        lined: action.lined || false,
        linedDuctHandled: action.linedDuctHandled || false,
        capped: false,
        position: action.position, // upstream or downstream
        purpose: action.purpose // whip or vacuum
      };
      return {
        ...state,
        accessCuts: [...state.accessCuts, newCut]
      };
    }
    case 'COMPLETE_ACCESS_CUTTING':
      return { ...state, accessCuttingComplete: true };
    case 'CAP_ACCESS_CUT': {
      const updatedCuts = state.accessCuts.map(cut =>
        cut.id === action.cutId ? { ...cut, capped: true } : cut
      );
      return { ...state, accessCuts: updatedCuts };
    }
    case 'CAP_ALL_CUTS': {
      const allCapped = state.accessCuts.map(cut => ({ ...cut, capped: true }));
      return { ...state, accessCuts: allCapped };
    }
    // Multi-day courthouse actions
    case 'START_DAY_END': {
      // Save current day's progress before transitioning
      const currentDayScore = state.score;
      const dayProgress = {
        ...state.dayProgress,
        [state.currentDay]: {
          ductsClean: { ...state.ductsClean },
          score: currentDayScore,
          penalties: [...state.penalties],
          bonuses: [...state.bonuses]
        }
      };
      return {
        ...state,
        dayPhase: 'day-end',
        dayProgress,
        dayPackedUp: false,
        dayCheckedOut: false
      };
    }
    case 'PACK_UP_EQUIPMENT':
      return { ...state, dayPackedUp: true };
    case 'SECURITY_CHECKOUT':
      return { ...state, dayCheckedOut: true };
    case 'NEXT_DAY': {
      // Transition to next day - preserve ductsClean across days
      const nextDay = state.currentDay + 1;
      // Pick a random day start event for returning crew
      const returningEvents = DAY_START_EVENTS.returning_crew;
      const randomReturning = returningEvents[Math.floor(Math.random() * returningEvents.length)];
      // Maybe pick a callback (40% chance)
      let callback = null;
      if (Math.random() < 0.4) {
        const callbacks = DAY_START_EVENTS.callbacks.filter(c => c.floor < nextDay);
        if (callbacks.length > 0) {
          callback = callbacks[Math.floor(Math.random() * callbacks.length)];
        }
      }
      // Generate registers for the new floor
      const newRegisters = generateRegistersForDay(state.scenario, nextDay);
      const newScrewsNeeded = newRegisters.reduce((sum, r) => sum + r.screwCount, 0);
      return {
        ...state,
        currentDay: nextDay,
        dayPhase: 'day-start',
        dayStartEvent: randomReturning,
        dayCallback: callback,
        dayPackedUp: false,
        dayCheckedOut: false,
        // Reset daily state but preserve cross-day progress
        powerConnected: false,
        securityCleared: false,
        registers: newRegisters,
        screwsNeeded: newScrewsNeeded,
        screwInventory: 0,
        registersRemoved: {},
        registerDamages: [],
        photosDocumented: false,
        customerWalkthrough: false
      };
    }
    case 'COMPLETE_DAY_START':
      return { ...state, dayPhase: null, phase: 3, subPhase: 0 };
    case 'HANDLE_CALLBACK': {
      if (action.success) {
        return {
          ...state,
          dayCallback: null,
          score: Math.min(100, state.score + 3),
          bonuses: [...state.bonuses, { reason: 'Handled callback professionally', points: 3 }]
        };
      } else {
        return {
          ...state,
          dayCallback: null,
          score: Math.max(0, state.score - (action.penalty || 0)),
          penalties: action.penalty ? [...state.penalties, { reason: 'Poor callback handling', points: action.penalty }] : state.penalties
        };
      }
    }
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
    case 'TOGGLE_PAUSE':
      return { ...state, paused: !state.paused };
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
    <div className="fixed top-0 left-0 right-0 bg-zinc-900 border-b border-yellow-500/30 px-2 sm:px-4 py-2 z-40">
      <div className="max-w-5xl mx-auto flex justify-between items-center text-xs sm:text-sm">
        <div className="flex items-center gap-1 sm:gap-3">
          <span className="text-yellow-400 font-bold hidden sm:inline">CQA TRAINING</span>
          <span className="text-yellow-400 font-bold sm:hidden">CQA</span>
          <span className="text-zinc-500 hidden sm:inline">|</span>
          <span className="text-zinc-400">{SCENARIOS[state.scenario]?.icon} <span className="hidden sm:inline">{SCENARIOS[state.scenario]?.name}</span></span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-zinc-400">Score: <span className={state.score >= 80 ? 'text-green-400' : state.score >= 60 ? 'text-yellow-400' : 'text-red-400'}>{state.score}</span></span>
          {state.timeDelay > 0 && (
            <span className="text-orange-400 hidden sm:inline">⏱️ +{state.timeDelay}min</span>
          )}
          {state.phase === 3 && state.subPhase === 1 && (
            <span className="text-zinc-500 hidden sm:inline">🔩 {state.screwInventory}</span>
          )}
          <button
            onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
            className="text-zinc-500 hover:text-yellow-400 px-2"
            title="Pause (Esc)"
          >
            ⏸
          </button>
          <button onClick={() => dispatch({ type: 'RESET' })} className="text-zinc-500 hover:text-red-400">✕</button>
        </div>
      </div>
    </div>
  );
}

function PauseMenu({ dispatch }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border-2 border-yellow-500 rounded-lg p-6 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-yellow-400 mb-2">Paused</h2>
        <p className="text-zinc-400 text-sm mb-6">Press Escape or click Resume to continue</p>
        <div className="space-y-3">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
            className="w-full px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-bold rounded transition-colors"
          >
            Resume
          </button>
          <button
            onClick={() => dispatch({ type: 'RESET' })}
            className="w-full px-6 py-3 bg-zinc-800 hover:bg-red-900/50 text-zinc-300 hover:text-red-400 border border-zinc-700 hover:border-red-500 rounded transition-colors"
          >
            Exit to Menu
          </button>
        </div>
        <div className="mt-6 pt-4 border-t border-zinc-700">
          <h3 className="text-sm font-bold text-zinc-400 mb-2">Keyboard Shortcuts</h3>
          <div className="text-xs text-zinc-500 space-y-1">
            <p><kbd className="px-1 py-0.5 bg-zinc-800 rounded">Esc</kbd> Pause/Resume</p>
            <p><kbd className="px-1 py-0.5 bg-zinc-800 rounded">Enter</kbd> Continue/Advance dialogue</p>
            <p><kbd className="px-1 py-0.5 bg-zinc-800 rounded">1-9</kbd> Select dialogue option</p>
          </div>
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

// ============================================================================
// SITE MAP NAVIGATION COMPONENT
// ============================================================================

function SiteMapNavigation({ state, dispatch, onComplete }) {
  const [selectedInfo, setSelectedInfo] = useState(null);
  const siteMap = SITE_MAPS[state.scenario];

  useEffect(() => {
    if (!state.currentLocation) {
      dispatch({ type: 'INIT_SITE_MAP' });
    }
  }, []);

  // Get the current floor's areas for courthouse, or regular areas for others
  const getCurrentAreas = () => {
    if (state.scenario === 'courthouse') {
      return siteMap.floorPlans[state.currentFloor]?.areas || {};
    }
    return siteMap.areas;
  };

  const areas = getCurrentAreas();
  const currentArea = areas[state.currentLocation];

  // Get required areas based on scenario
  const getRequiredAreas = () => {
    if (state.scenario === 'courthouse') {
      return siteMap.requiredAreas[state.currentFloor] || [];
    }
    return siteMap.requiredAreas;
  };

  const requiredAreas = getRequiredAreas();

  // Check if an area is accessible from current location
  const isAccessible = (areaId) => {
    if (!currentArea) return areaId === siteMap.startArea;
    return currentArea.connections?.includes(areaId);
  };

  // Check if all required areas have been visited
  const allRequiredVisited = () => {
    if (state.scenario === 'courthouse') {
      // For courthouse, check all floors
      for (let floor = 1; floor <= 3; floor++) {
        const floorRequired = siteMap.requiredAreas[floor] || [];
        for (const areaId of floorRequired) {
          if (!state.visitedAreas[areaId]) return false;
        }
      }
      return true;
    }
    return requiredAreas.every(areaId => state.visitedAreas[areaId]);
  };

  // Count visited required areas
  const getProgress = () => {
    if (state.scenario === 'courthouse') {
      let total = 0;
      let visited = 0;
      for (let floor = 1; floor <= 3; floor++) {
        const floorRequired = siteMap.requiredAreas[floor] || [];
        total += floorRequired.length;
        visited += floorRequired.filter(id => state.visitedAreas[id]).length;
      }
      return { visited, total };
    }
    const visited = requiredAreas.filter(id => state.visitedAreas[id]).length;
    return { visited, total: requiredAreas.length };
  };

  const progress = getProgress();

  const handleAreaClick = (areaId) => {
    if (!isAccessible(areaId) && areaId !== state.currentLocation) return;

    const area = areas[areaId];
    if (areaId !== state.currentLocation) {
      dispatch({ type: 'MOVE_TO_AREA', areaId });
    }

    if (area?.info) {
      setSelectedInfo({ name: area.name, info: area.info, icon: area.icon });
    }
  };

  const handleFloorChange = (floor) => {
    dispatch({ type: 'CHANGE_FLOOR', floor });
    setSelectedInfo(null);
  };

  const handleComplete = () => {
    // Calculate penalties for missed areas
    let missedCount = 0;
    const missedTypes = { airHandler: false, electrical: false, registers: 0 };

    if (state.scenario === 'courthouse') {
      for (let floor = 1; floor <= 3; floor++) {
        const floorRequired = siteMap.requiredAreas[floor] || [];
        const floorAreas = siteMap.floorPlans[floor]?.areas || {};
        for (const areaId of floorRequired) {
          if (!state.visitedAreas[areaId]) {
            missedCount++;
            const area = floorAreas[areaId];
            if (area?.isAirHandler) missedTypes.airHandler = true;
            if (area?.isElectrical) missedTypes.electrical = true;
            if (area?.isRegister || area?.isPTAC) missedTypes.registers++;
          }
        }
      }
    } else {
      for (const areaId of requiredAreas) {
        if (!state.visitedAreas[areaId]) {
          missedCount++;
          const area = areas[areaId];
          if (area?.isAirHandler) missedTypes.airHandler = true;
          if (area?.isElectrical) missedTypes.electrical = true;
          if (area?.isRegister) missedTypes.registers++;
        }
      }
    }

    // Apply penalties
    if (missedTypes.airHandler) {
      dispatch({ type: 'ADD_PENALTY', reason: "Didn't locate air handler before starting", points: 15 });
    }
    if (missedTypes.electrical) {
      dispatch({ type: 'ADD_PENALTY', reason: "Didn't locate electrical panel", points: 10 });
    }
    if (missedTypes.registers > 0) {
      dispatch({ type: 'ADD_PENALTY', reason: `Missed ${missedTypes.registers} register location(s)`, points: missedTypes.registers * 3 });
    }

    // Bonus for thorough survey
    if (missedCount === 0) {
      dispatch({ type: 'ADD_BONUS', reason: 'Thorough site survey - all areas checked', points: 5 });
    }

    dispatch({ type: 'COMPLETE_SITE_MAP' });
    onComplete();
  };

  // Render an area as an SVG rect
  const renderArea = (area) => {
    const isCurrentLocation = state.currentLocation === area.id;
    const isVisited = state.visitedAreas[area.id];
    const accessible = isAccessible(area.id);
    const isRequired = requiredAreas.includes(area.id);

    let strokeColor = '#3f3f46'; // zinc-700
    let strokeWidth = 1;
    let fillOpacity = 0.5;
    let cursor = 'default';

    if (isCurrentLocation) {
      strokeColor = '#facc15'; // yellow-400
      strokeWidth = 3;
      fillOpacity = 0.8;
    } else if (accessible) {
      strokeColor = '#6366f1'; // indigo-500
      strokeWidth = 2;
      cursor = 'pointer';
    }

    if (isVisited && !isCurrentLocation) {
      fillOpacity = 0.3;
    }

    return (
      <g key={area.id} onClick={() => handleAreaClick(area.id)} style={{ cursor }}>
        <rect
          x={area.x}
          y={area.y}
          width={area.width}
          height={area.height}
          fill={area.color}
          fillOpacity={fillOpacity}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          rx={4}
        />
        {/* Icon */}
        <text
          x={area.x + area.width / 2}
          y={area.y + area.height / 2 - 4}
          textAnchor="middle"
          fontSize={area.width < 40 ? 12 : 16}
          dominantBaseline="middle"
        >
          {area.icon}
        </text>
        {/* Name - only for larger areas */}
        {area.width >= 50 && area.height >= 40 && (
          <text
            x={area.x + area.width / 2}
            y={area.y + area.height / 2 + 12}
            textAnchor="middle"
            fontSize={9}
            fill="#a1a1aa"
            dominantBaseline="middle"
          >
            {area.name.length > 15 ? area.name.substring(0, 12) + '...' : area.name}
          </text>
        )}
        {/* Required indicator */}
        {isRequired && !isVisited && (
          <circle
            cx={area.x + area.width - 6}
            cy={area.y + 6}
            r={5}
            fill="#ef4444"
          />
        )}
        {/* Visited checkmark */}
        {isVisited && isRequired && (
          <circle
            cx={area.x + area.width - 6}
            cy={area.y + 6}
            r={5}
            fill="#22c55e"
          />
        )}
      </g>
    );
  };

  // Render connection lines between areas
  const renderConnections = () => {
    const lines = [];
    const drawnConnections = new Set();

    Object.values(areas).forEach(area => {
      if (!area.connections) return;
      area.connections.forEach(connId => {
        const connArea = areas[connId];
        if (!connArea) return;

        const connKey = [area.id, connId].sort().join('-');
        if (drawnConnections.has(connKey)) return;
        drawnConnections.add(connKey);

        const x1 = area.x + area.width / 2;
        const y1 = area.y + area.height / 2;
        const x2 = connArea.x + connArea.width / 2;
        const y2 = connArea.y + connArea.height / 2;

        lines.push(
          <line
            key={connKey}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#27272a"
            strokeWidth={2}
            strokeDasharray="4,4"
          />
        );
      });
    });

    return lines;
  };

  return (
    <div className="space-y-4">
      <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-yellow-400 font-bold">
            🗺️ Site Survey - {state.scenario === 'courthouse'
              ? siteMap.floorPlans[state.currentFloor].name
              : siteMap.name}
          </h3>
          <div className="text-sm text-zinc-400">
            Progress: <span className={progress.visited === progress.total ? 'text-green-400' : 'text-yellow-400'}>
              {progress.visited}/{progress.total}
            </span> areas
          </div>
        </div>

        {/* Floor selector for courthouse */}
        {state.scenario === 'courthouse' && (
          <div className="flex gap-2 mb-4">
            {siteMap.floors.map(floor => {
              const floorRequired = siteMap.requiredAreas[floor] || [];
              const floorVisited = floorRequired.filter(id => state.visitedAreas[id]).length;
              const isComplete = floorVisited === floorRequired.length;

              return (
                <button
                  key={floor}
                  onClick={() => handleFloorChange(floor)}
                  disabled={floor !== state.currentFloor && state.currentLocation !== 'stairwell'}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-all ${
                    floor === state.currentFloor
                      ? 'bg-yellow-500 text-zinc-900'
                      : state.currentLocation === 'stairwell'
                        ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  Floor {floor}
                  {isComplete && <span className="ml-1 text-green-600">✓</span>}
                  {!isComplete && <span className="ml-1 text-xs">({floorVisited}/{floorRequired.length})</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* SVG Floor Plan */}
        <div className="bg-zinc-900 rounded-lg p-2 overflow-x-auto">
          <svg
            viewBox={`0 0 ${siteMap.width} ${siteMap.height}`}
            className="mx-auto w-full max-w-full min-w-[320px]"
            style={{ aspectRatio: `${siteMap.width}/${siteMap.height}` }}
          >
            {/* Connection lines (render first, behind areas) */}
            {renderConnections()}

            {/* Areas */}
            {Object.values(areas).map(renderArea)}

            {/* Current location indicator pulse */}
            {currentArea && (
              <circle
                cx={currentArea.x + currentArea.width / 2}
                cy={currentArea.y + currentArea.height / 2}
                r={Math.min(currentArea.width, currentArea.height) / 2 + 5}
                fill="none"
                stroke="#facc15"
                strokeWidth={2}
                opacity={0.5}
              >
                <animate
                  attributeName="r"
                  from={Math.min(currentArea.width, currentArea.height) / 2}
                  to={Math.min(currentArea.width, currentArea.height) / 2 + 15}
                  dur="1.5s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.6"
                  to="0"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-yellow-500/50 border-2 border-yellow-400"></span>
            Current
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-indigo-500/30 border-2 border-indigo-500"></span>
            Accessible
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Required
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Visited
          </span>
        </div>

        {/* Current location info */}
        {currentArea && (
          <div className="mt-4 p-3 bg-zinc-900 rounded">
            <div className="flex items-center gap-2 text-zinc-200">
              <span className="text-xl">{currentArea.icon}</span>
              <span className="font-bold">{currentArea.name}</span>
              {currentArea.isAirHandler && <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded">Air Handler</span>}
              {currentArea.isElectrical && <span className="text-xs bg-amber-900/50 text-amber-400 px-2 py-0.5 rounded">Electrical</span>}
              {currentArea.isRegister && <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded">Register</span>}
              {currentArea.isPTAC && <span className="text-xs bg-purple-900/50 text-purple-400 px-2 py-0.5 rounded">PTAC</span>}
            </div>
            {state.discoveredInfo[currentArea.id] && (
              <p className="text-sm text-zinc-400 mt-2 pl-7">
                📋 {state.discoveredInfo[currentArea.id]}
              </p>
            )}
          </div>
        )}

        {/* Discovery log */}
        {Object.keys(state.discoveredInfo).length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-zinc-500 mb-2">Survey Notes ({Object.keys(state.discoveredInfo).length} discoveries):</p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {Object.entries(state.discoveredInfo).slice(-5).map(([areaId, info]) => {
                const area = areas[areaId] ||
                  (state.scenario === 'courthouse'
                    ? Object.values(siteMap.floorPlans).flatMap(f => Object.values(f.areas)).find(a => a.id === areaId)
                    : null);
                return (
                  <div key={areaId} className="text-xs bg-zinc-900/50 p-2 rounded flex gap-2">
                    <span>{area?.icon || '📍'}</span>
                    <span className="text-zinc-400">{info}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Continue button */}
      <button
        onClick={handleComplete}
        className={`w-full py-3 font-bold rounded transition-all ${
          allRequiredVisited()
            ? 'bg-green-600 hover:bg-green-500 text-white'
            : 'bg-yellow-500 hover:bg-yellow-400 text-zinc-900'
        }`}
      >
        {allRequiredVisited()
          ? '✓ Survey Complete - Continue →'
          : `Continue with Survey (${progress.total - progress.visited} areas remaining)`}
      </button>
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
// PHASE 3: SETUP - ACCESS CUTTING
// ============================================================================

function AccessCutting({ state, dispatch }) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [cutStep, setCutStep] = useState('select_location'); // select_location, select_type, lined_step, select_size, confirm
  const [selectedCutType, setSelectedCutType] = useState(null);
  const [linedHandled, setLinedHandled] = useState(false);
  const [selectedSize, setSelectedSize] = useState('standard');
  const [showResult, setShowResult] = useState(false);
  const [resultMessage, setResultMessage] = useState(null);

  const scenario = DUCT_ACCESS_SCENARIOS[state.scenario];
  const layout = scenario.layout;
  const accessPoints = scenario.accessPoints;
  const cutsNeeded = scenario.minCutsRequired;
  const currentCuts = state.accessCuts;
  const cutIds = currentCuts.map(c => c.id);

  // Check if we have minimum cuts and at least one upstream (whip) and one downstream (vacuum)
  const hasUpstream = currentCuts.some(c => c.position === 'upstream');
  const hasDownstream = currentCuts.some(c => c.position === 'downstream');
  const meetsMinimum = currentCuts.length >= cutsNeeded && hasUpstream && hasDownstream;

  const handleSelectPoint = (point) => {
    if (cutIds.includes(point.id)) return; // Already cut
    setSelectedPoint(point);
    setCutStep('select_type');
  };

  const handleSelectCutType = (type) => {
    setSelectedCutType(type);
    if (selectedPoint.lined) {
      setCutStep('lined_step');
    } else {
      setCutStep('select_size');
    }
  };

  const handleLinedStep = (cutInsulationFirst) => {
    setLinedHandled(cutInsulationFirst);
    if (!cutInsulationFirst) {
      // Wrong sequence - penalty
      dispatch({ type: 'ADD_PENALTY', reason: 'Insulation damage - cut metal before insulation', points: 15 });
      setResultMessage({ success: false, text: 'Insulation damage! You must cut the insulation square FIRST with a utility knife, THEN cut the metal.' });
      setShowResult(true);
      setTimeout(() => {
        setShowResult(false);
        setCutStep('select_size');
      }, 2500);
    } else {
      // Correct sequence - bonus
      dispatch({ type: 'ADD_BONUS', reason: 'Proper lined duct cutting sequence', points: 5 });
      setCutStep('select_size');
    }
  };

  const handleSelectSize = (size) => {
    setSelectedSize(size);
    setCutStep('confirm');
  };

  const handleConfirmCut = () => {
    const sizeData = ACCESS_CUT_SIZES[selectedSize];

    // Apply size penalty if any
    if (sizeData.penalty > 0) {
      dispatch({ type: 'ADD_PENALTY', reason: sizeData.reason, points: sizeData.penalty });
    }

    // Add the cut
    dispatch({
      type: 'ADD_ACCESS_CUT',
      id: selectedPoint.id,
      location: selectedPoint.id,
      name: selectedPoint.name,
      cutType: selectedCutType,
      size: selectedSize,
      lined: selectedPoint.lined || false,
      linedDuctHandled: linedHandled,
      position: selectedPoint.position,
      purpose: selectedPoint.purpose
    });

    // Show result and reset
    const isOptimal = scenario.optimalCuts.includes(selectedPoint.id);
    setResultMessage({
      success: true,
      text: isOptimal
        ? `Cut complete at ${selectedPoint.name}. Good positioning for ${selectedPoint.purpose === 'whip' ? 'whip insertion' : 'vacuum connection'}!`
        : `Cut complete at ${selectedPoint.name}. This location works but may not be optimal.`
    });
    setShowResult(true);

    setTimeout(() => {
      setShowResult(false);
      setSelectedPoint(null);
      setCutStep('select_location');
      setSelectedCutType(null);
      setLinedHandled(false);
      setSelectedSize('standard');
    }, 2000);
  };

  const handleComplete = () => {
    // Check for efficiency bonus
    const optimalCutsMade = currentCuts.filter(c => scenario.optimalCuts.includes(c.id)).length;
    if (optimalCutsMade === scenario.optimalCuts.length && currentCuts.length === scenario.minCutsRequired) {
      dispatch({ type: 'ADD_BONUS', reason: 'Optimal access cut placement - minimum cuts for full coverage', points: 5 });
    } else if (currentCuts.length > scenario.minCutsRequired) {
      const extraCuts = currentCuts.length - scenario.minCutsRequired;
      dispatch({ type: 'ADD_PENALTY', reason: `${extraCuts} unnecessary cut(s) - more holes to cap`, points: extraCuts * 3 });
    }

    dispatch({ type: 'COMPLETE_ACCESS_CUTTING' });
    dispatch({ type: 'SET_SUBPHASE', subPhase: 1 });
  };

  const getMaterialColor = (material) => {
    const colors = {
      rigid: '#64748b',
      flex: '#fbbf24',
      lined: '#34d399',
      ductboard: '#a78bfa'
    };
    return colors[material] || '#64748b';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-yellow-400 font-bold">⭕ Access Cutting</h3>
            <p className="text-zinc-400 text-sm mt-1">{scenario.name}</p>
          </div>
          <div className="text-right">
            <p className="text-zinc-300">Cuts: <span className={currentCuts.length >= cutsNeeded ? 'text-green-400' : 'text-yellow-400'}>{currentCuts.length}</span> / {cutsNeeded} min</p>
            <div className="flex gap-2 mt-1 text-xs">
              <span className={hasUpstream ? 'text-green-400' : 'text-zinc-500'}>Whip access: {hasUpstream ? '✓' : '○'}</span>
              <span className={hasDownstream ? 'text-green-400' : 'text-zinc-500'}>Vacuum: {hasDownstream ? '✓' : '○'}</span>
            </div>
          </div>
        </div>
        <p className="text-zinc-500 text-sm">{scenario.description}</p>
        {scenario.specialNote && (
          <p className="text-orange-400 text-xs mt-2">{scenario.specialNote}</p>
        )}
      </div>

      {/* 2D Duct Layout */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
        <h4 className="text-zinc-400 text-sm font-bold mb-3">Duct System Layout - Click to select cut location</h4>
        <div
          className="relative bg-zinc-950 rounded border border-zinc-800 mx-auto overflow-hidden"
          style={{ width: Math.min(layout.width, 480), height: Math.min(layout.height, 320) }}
        >
          {/* Air Handler */}
          <div
            className="absolute bg-red-900/50 border-2 border-red-500 rounded flex items-center justify-center text-xs text-red-300 font-bold"
            style={{
              left: layout.airHandler.x * (Math.min(layout.width, 480) / layout.width),
              top: layout.airHandler.y * (Math.min(layout.height, 320) / layout.height),
              width: layout.airHandler.width * (Math.min(layout.width, 480) / layout.width),
              height: layout.airHandler.height * (Math.min(layout.height, 320) / layout.height)
            }}
          >
            {layout.airHandler.label || 'AHU'}
          </div>

          {/* Main Trunk */}
          <div
            className="absolute rounded"
            style={{
              left: layout.trunk.x * (Math.min(layout.width, 480) / layout.width),
              top: layout.trunk.y * (Math.min(layout.height, 320) / layout.height),
              width: layout.trunk.width * (Math.min(layout.width, 480) / layout.width),
              height: layout.trunk.height * (Math.min(layout.height, 320) / layout.height),
              backgroundColor: getMaterialColor(layout.trunk.material || 'rigid'),
              opacity: 0.7
            }}
          />

          {/* Branch Ducts */}
          {layout.branches.map((branch, i) => (
            <div
              key={branch.id}
              className="absolute rounded"
              style={{
                left: branch.x * (Math.min(layout.width, 480) / layout.width) - 4,
                top: branch.y * (Math.min(layout.height, 320) / layout.height),
                width: 8,
                height: (branch.toY - branch.y) * (Math.min(layout.height, 320) / layout.height),
                backgroundColor: getMaterialColor(branch.material),
                opacity: 0.7
              }}
            >
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-zinc-500 whitespace-nowrap">
                {branch.name}
              </span>
            </div>
          ))}

          {/* Access Points */}
          {accessPoints.map((point) => {
            const isCut = cutIds.includes(point.id);
            const isSelected = selectedPoint?.id === point.id;
            const scaleX = Math.min(layout.width, 480) / layout.width;
            const scaleY = Math.min(layout.height, 320) / layout.height;

            return (
              <button
                key={point.id}
                onClick={() => !isCut && handleSelectPoint(point)}
                disabled={isCut || showResult}
                className={`absolute w-6 h-6 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 transition-all text-xs font-bold ${
                  isCut
                    ? 'bg-green-600 border-green-400 text-white cursor-default'
                    : isSelected
                      ? 'bg-yellow-500 border-yellow-300 text-zinc-900 scale-125 z-10'
                      : point.recommended
                        ? 'bg-blue-600/50 border-blue-400 text-blue-200 hover:bg-blue-500 hover:scale-110 cursor-pointer'
                        : 'bg-zinc-600/50 border-zinc-400 text-zinc-300 hover:bg-zinc-500 hover:scale-110 cursor-pointer'
                }`}
                style={{
                  left: point.x * scaleX,
                  top: point.y * scaleY
                }}
                title={`${point.name} (${point.position} - ${point.purpose})${point.lined ? ' - LINED' : ''}`}
              >
                {isCut ? '✓' : point.purpose === 'whip' ? 'W' : 'V'}
              </button>
            );
          })}

          {/* Legend */}
          <div className="absolute bottom-1 right-1 bg-zinc-900/90 p-1 rounded text-[8px] space-y-0.5">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-zinc-400">Recommended</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
              <span className="text-zinc-400">Optional</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-blue-300">W</span>
              <span className="text-zinc-400">= Whip</span>
              <span className="text-blue-300 ml-1">V</span>
              <span className="text-zinc-400">= Vacuum</span>
            </div>
          </div>

          {/* Material Legend */}
          <div className="absolute bottom-1 left-1 bg-zinc-900/90 p-1 rounded text-[8px] space-y-0.5">
            <div className="flex items-center gap-1"><span className="w-3 h-1" style={{backgroundColor: '#64748b'}}></span><span className="text-zinc-400">Rigid</span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-1" style={{backgroundColor: '#34d399'}}></span><span className="text-zinc-400">Lined</span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-1" style={{backgroundColor: '#fbbf24'}}></span><span className="text-zinc-400">Flex</span></div>
          </div>
        </div>
      </div>

      {/* Cut Configuration Panel */}
      {selectedPoint && !showResult && (
        <div className="bg-zinc-800/50 border border-blue-500/30 rounded-lg p-4">
          <h4 className="text-blue-400 font-bold mb-3">
            Cutting: {selectedPoint.name}
            {selectedPoint.lined && <span className="text-orange-400 ml-2">(LINED DUCT)</span>}
          </h4>

          {/* Step 1: Select Cut Type */}
          {cutStep === 'select_type' && (
            <div className="space-y-3">
              <p className="text-zinc-400 text-sm">Select cut type:</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(ACCESS_CUT_TYPES).map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleSelectCutType(type.id)}
                    className="p-3 bg-zinc-900 border border-zinc-700 hover:border-blue-500 rounded text-left transition-all"
                  >
                    <span className="text-2xl">{type.icon}</span>
                    <p className="text-zinc-200 font-medium mt-1">{type.name}</p>
                    <p className="text-zinc-500 text-xs">Uses: {ACCESS_CUTTING_TOOLS[type.tool].name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Lined Duct Handling */}
          {cutStep === 'lined_step' && (
            <div className="space-y-3">
              <div className="p-3 bg-orange-900/30 border border-orange-500/50 rounded">
                <p className="text-orange-400 font-bold">Lined Duct Detected</p>
                <p className="text-zinc-300 text-sm mt-1">This duct has internal insulation liner. How do you proceed?</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => handleLinedStep(true)}
                  className="p-3 bg-zinc-900 border border-green-500/50 hover:border-green-400 rounded text-left transition-all"
                >
                  <span className="text-xl">🔪</span>
                  <span className="text-green-400 font-medium ml-2">Cut insulation square FIRST with utility knife, then cut metal</span>
                  <p className="text-zinc-500 text-xs mt-1">Correct sequence - protects insulation integrity</p>
                </button>
                <button
                  onClick={() => handleLinedStep(false)}
                  className="p-3 bg-zinc-900 border border-red-500/50 hover:border-red-400 rounded text-left transition-all"
                >
                  <span className="text-xl">⭕</span>
                  <span className="text-red-400 font-medium ml-2">Cut metal directly with hole cutter</span>
                  <p className="text-zinc-500 text-xs mt-1">Faster approach</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Select Size */}
          {cutStep === 'select_size' && (
            <div className="space-y-3">
              <p className="text-zinc-400 text-sm">Select cut size:</p>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(ACCESS_CUT_SIZES).map((size) => (
                  <button
                    key={size.id}
                    onClick={() => handleSelectSize(size.id)}
                    className={`p-3 bg-zinc-900 border rounded text-center transition-all ${
                      size.id === 'standard'
                        ? 'border-green-500/50 hover:border-green-400'
                        : 'border-zinc-700 hover:border-yellow-500'
                    }`}
                  >
                    <p className="text-zinc-200 font-medium">{size.name}</p>
                    {size.penalty > 0 && <p className="text-orange-400 text-xs mt-1">-{size.penalty} pts</p>}
                    {size.penalty === 0 && <p className="text-green-400 text-xs mt-1">Optimal</p>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {cutStep === 'confirm' && (
            <div className="space-y-3">
              <div className="bg-zinc-900 rounded p-3 border border-zinc-700">
                <p className="text-zinc-300">Cut Summary:</p>
                <ul className="text-sm text-zinc-400 mt-2 space-y-1">
                  <li>Location: <span className="text-zinc-200">{selectedPoint.name}</span></li>
                  <li>Type: <span className="text-zinc-200">{ACCESS_CUT_TYPES[selectedCutType].name}</span></li>
                  <li>Size: <span className="text-zinc-200">{ACCESS_CUT_SIZES[selectedSize].name}</span></li>
                  <li>Position: <span className="text-zinc-200">{selectedPoint.position} ({selectedPoint.purpose})</span></li>
                  {selectedPoint.lined && (
                    <li>Lined handling: <span className={linedHandled ? 'text-green-400' : 'text-red-400'}>
                      {linedHandled ? 'Insulation first ✓' : 'Skipped (damaged)'}
                    </span></li>
                  )}
                </ul>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedPoint(null);
                    setCutStep('select_location');
                    setSelectedCutType(null);
                    setLinedHandled(false);
                    setSelectedSize('standard');
                  }}
                  className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCut}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-all"
                >
                  Make Cut
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result Message */}
      {showResult && resultMessage && (
        <div className={`p-4 rounded-lg border-2 ${resultMessage.success ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'}`}>
          <p className={resultMessage.success ? 'text-green-400' : 'text-red-400'}>{resultMessage.text}</p>
        </div>
      )}

      {/* Cuts Made Summary */}
      {currentCuts.length > 0 && (
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
          <h4 className="text-zinc-400 font-bold mb-2">Access Cuts Made ({currentCuts.length})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {currentCuts.map((cut) => (
              <div key={cut.id} className="flex items-center gap-2 p-2 bg-zinc-800 rounded text-sm">
                <span className="text-green-400">✓</span>
                <span className="text-zinc-300">{cut.name}</span>
                <span className="text-zinc-500 text-xs">({cut.position})</span>
                {cut.lined && (
                  <span className={cut.linedDuctHandled ? 'text-green-400 text-xs' : 'text-red-400 text-xs'}>
                    {cut.linedDuctHandled ? 'Lined OK' : 'Damaged'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete Button */}
      <button
        onClick={handleComplete}
        disabled={!meetsMinimum || showResult}
        className={`w-full py-3 font-bold rounded transition-all ${
          meetsMinimum && !showResult
            ? 'bg-green-600 hover:bg-green-500 text-white'
            : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
        }`}
      >
        {meetsMinimum ? 'Complete Access Cutting →' : `Need ${cutsNeeded - currentCuts.length} more cut(s) (whip + vacuum required)`}
      </button>
    </div>
  );
}

// ============================================================================
// PHASE 3: SETUP - POWER & REGISTERS
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
    setTimeout(() => dispatch({ type: 'SET_SUBPHASE', subPhase: 2 }), 1500);
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

function VacuumGauge({ scenario, animating }) {
  const [needleAngle, setNeedleAngle] = useState(-45);
  const [fluctOffset, setFluctOffset] = useState(0);

  useEffect(() => {
    // Convert needle position (0-100) to angle (-45 to 225 degrees)
    const baseAngle = -45 + (scenario.needlePosition / 100) * 270;

    if (scenario.needleBehavior === 'fluctuating' && animating) {
      const interval = setInterval(() => {
        setFluctOffset(Math.sin(Date.now() / 200) * 40);
      }, 50);
      return () => clearInterval(interval);
    } else if (scenario.needleBehavior === 'dropping' && animating) {
      const interval = setInterval(() => {
        setNeedleAngle(prev => Math.max(-45, prev - 0.5));
      }, 100);
      return () => clearInterval(interval);
    } else {
      setNeedleAngle(baseAngle);
      setFluctOffset(0);
    }
  }, [scenario, animating]);

  const displayAngle = needleAngle + fluctOffset;

  return (
    <div className="relative w-48 h-48 mx-auto">
      {/* Gauge background */}
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Outer ring */}
        <circle cx="100" cy="100" r="95" fill="#18181b" stroke="#3f3f46" strokeWidth="3" />

        {/* Gauge face gradient */}
        <circle cx="100" cy="100" r="85" fill="#27272a" />

        {/* Colored arc zones */}
        <path d="M 100 100 L 20 100 A 80 80 0 0 1 47 47 Z" fill="#ef4444" opacity="0.3" />
        <path d="M 100 100 L 47 47 A 80 80 0 0 1 100 20 Z" fill="#f59e0b" opacity="0.3" />
        <path d="M 100 100 L 100 20 A 80 80 0 0 1 153 47 Z" fill="#22c55e" opacity="0.3" />
        <path d="M 100 100 L 153 47 A 80 80 0 0 1 180 100 Z" fill="#22c55e" opacity="0.5" />

        {/* Tick marks */}
        {[...Array(11)].map((_, i) => {
          const angle = (-45 + i * 27) * (Math.PI / 180);
          const x1 = 100 + Math.cos(angle) * 70;
          const y1 = 100 + Math.sin(angle) * 70;
          const x2 = 100 + Math.cos(angle) * 80;
          const y2 = 100 + Math.sin(angle) * 80;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#71717a" strokeWidth="2" />;
        })}

        {/* Labels */}
        <text x="35" y="115" fill="#71717a" fontSize="10" textAnchor="middle">0</text>
        <text x="55" y="65" fill="#71717a" fontSize="10" textAnchor="middle">5</text>
        <text x="100" y="40" fill="#71717a" fontSize="10" textAnchor="middle">10</text>
        <text x="145" y="65" fill="#71717a" fontSize="10" textAnchor="middle">15</text>
        <text x="165" y="115" fill="#71717a" fontSize="10" textAnchor="middle">20</text>

        {/* Center cap */}
        <circle cx="100" cy="100" r="12" fill="#52525b" />
        <circle cx="100" cy="100" r="8" fill="#3f3f46" />

        {/* Needle */}
        <g transform={`rotate(${displayAngle}, 100, 100)`}>
          <polygon points="100,30 96,100 104,100" fill={scenario.color} />
          <circle cx="100" cy="100" r="6" fill={scenario.color} />
        </g>

        {/* Glass reflection effect */}
        <ellipse cx="85" cy="75" rx="25" ry="15" fill="white" opacity="0.05" />
      </svg>

      {/* Unit label */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-zinc-500 text-xs">
        inches Hg
      </div>
    </div>
  );
}

function VacuumGaugeDiagnostics({ scenario, onDiagnosis }) {
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [shuffledDiagnoses, setShuffledDiagnoses] = useState([]);

  useEffect(() => {
    // Shuffle diagnoses on mount
    const shuffled = [...GAUGE_DIAGNOSES].sort(() => Math.random() - 0.5);
    setShuffledDiagnoses(shuffled);
  }, []);

  const handleDiagnosis = (diagnosis) => {
    setSelectedDiagnosis(diagnosis);
    setShowResult(true);
  };

  const handleContinue = () => {
    const isCorrect = selectedDiagnosis.id === scenario.correctDiagnosis;
    onDiagnosis(isCorrect, selectedDiagnosis);
  };

  const isCorrect = selectedDiagnosis?.id === scenario.correctDiagnosis;

  if (showResult) {
    return (
      <div className="space-y-4">
        <div className={`border-2 rounded-lg p-4 ${isCorrect ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{isCorrect ? '✅' : '❌'}</span>
            <div>
              <h3 className={`font-bold text-lg ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {isCorrect ? 'Correct Diagnosis!' : 'Incorrect Diagnosis'}
              </h3>
              <p className="text-zinc-400">
                {isCorrect ? '+5 points' : '-10 points'}
              </p>
            </div>
          </div>

          <div className="bg-zinc-900 rounded p-3 mb-4">
            <p className="text-zinc-500 text-sm mb-1">Your diagnosis:</p>
            <p className={`${isCorrect ? 'text-green-400' : 'text-red-400'}`}>{selectedDiagnosis.text}</p>
          </div>

          {!isCorrect && (
            <div className="bg-zinc-900 rounded p-3 mb-4">
              <p className="text-zinc-500 text-sm mb-1">Correct diagnosis:</p>
              <p className="text-green-400">
                {GAUGE_DIAGNOSES.find(d => d.id === scenario.correctDiagnosis)?.text}
              </p>
              <p className="text-orange-400 text-sm mt-2">
                ⚠️ Wrong diagnosis could damage equipment or miss a serious problem!
              </p>
            </div>
          )}

          <div className="bg-zinc-800 rounded p-3">
            <p className="text-zinc-500 text-sm mb-1">What this reading means:</p>
            <p className="text-zinc-300 text-sm">{scenario.description}</p>
          </div>
        </div>

        <button
          onClick={handleContinue}
          className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-bold rounded"
        >
          Continue Cleaning →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-zinc-800/50 border-2 border-blue-500/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📊</span>
          <h3 className="text-blue-400 font-bold text-lg">Vacuum Gauge Check</h3>
        </div>

        <p className="text-zinc-400 text-sm mb-4">
          You glance at the vacuum gauge on the truck. What do you see?
        </p>

        {/* Visual gauge */}
        <div className="bg-zinc-900 rounded-lg p-4 mb-4">
          <VacuumGauge scenario={scenario} animating={true} />
          <div className="text-center mt-2">
            <span className="text-xl">{scenario.icon}</span>
            <p className="text-zinc-300 font-bold">{scenario.name}</p>
          </div>
        </div>

        <div className="bg-zinc-900 rounded p-3 mb-4">
          <p className="text-zinc-400 text-sm">{scenario.description}</p>
        </div>

        <p className="text-zinc-500 text-sm mb-2">What's your diagnosis?</p>

        <div className="space-y-2">
          {shuffledDiagnoses.map((diagnosis, i) => (
            <button
              key={diagnosis.id}
              onClick={() => handleDiagnosis(diagnosis)}
              className="w-full p-3 bg-zinc-900 border border-zinc-700 hover:border-blue-500 rounded-lg text-left transition-all group"
            >
              <div className="flex items-start gap-3">
                <span className="text-blue-400 font-bold">{i + 1}.</span>
                <span className="text-zinc-200 group-hover:text-zinc-100">{diagnosis.text}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DuctCleaning({ state, dispatch }) {
  const [selectedTool, setSelectedTool] = useState(null);
  const [currentDuctIndex, setCurrentDuctIndex] = useState(0);
  const [cleaningInProgress, setCleaningInProgress] = useState(false);
  const [airflowDirection, setAirflowDirection] = useState(null);
  const [showProblem, setShowProblem] = useState(false);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [showGaugeCheck, setShowGaugeCheck] = useState(false);
  const [currentGaugeScenario, setCurrentGaugeScenario] = useState(null);

  // For courthouse, get floor-specific ducts based on current day
  const ducts = state.scenario === 'courthouse'
    ? getCourthouseDuctsForDay(state.currentDay)
    : (SCENARIO_DUCTS[state.scenario] || []);
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

  const triggerGaugeCheck = () => {
    // 20% chance per duct cleaning to trigger a gauge event
    if (Math.random() < 0.20) {
      const scenarioKeys = Object.keys(GAUGE_SCENARIOS);
      const randomKey = scenarioKeys[Math.floor(Math.random() * scenarioKeys.length)];
      setCurrentGaugeScenario(GAUGE_SCENARIOS[randomKey]);
      setShowGaugeCheck(true);
      return true;
    }
    return false;
  };

  const handleGaugeDiagnosis = (isCorrect, diagnosis) => {
    if (isCorrect) {
      dispatch({ type: 'ADD_BONUS', reason: 'Correct gauge diagnosis', points: 5 });
    } else {
      dispatch({ type: 'ADD_PENALTY', reason: 'Incorrect gauge diagnosis - equipment risk', points: 10 });
    }
    setShowGaugeCheck(false);
    setCurrentGaugeScenario(null);
    // Continue to next duct
    setCurrentDuctIndex(i => i + 1);
    setSelectedTool(null);
    setAirflowDirection(null);
  };
  
  if (!currentDuct || currentDuctIndex >= ducts.length) {
    // For courthouse multi-day: end of day transition instead of completion (unless final day)
    const isMultiDay = state.scenario === 'courthouse' && state.totalDays > 1;
    const isFinalDay = state.currentDay >= state.totalDays;

    // Count cleaned ducts for current floor only
    const floorDucts = isMultiDay ? getCourthouseDuctsForDay(state.currentDay) : ducts;
    const cleanedThisFloor = floorDucts.filter(d => state.ductsClean[d.id]).length;
    const excellentThisFloor = floorDucts.filter(d => state.ductsClean[d.id] === 'excellent').length;
    const goodThisFloor = floorDucts.filter(d => state.ductsClean[d.id] === 'good').length;
    const poorThisFloor = floorDucts.filter(d => state.ductsClean[d.id] === 'poor').length;

    const handleProceed = () => {
      if (isMultiDay && !isFinalDay) {
        // End of day - go to day-end transition
        dispatch({ type: 'START_DAY_END' });
      } else {
        // Final day or single-day scenario - go to completion
        dispatch({ type: 'SET_PHASE', phase: 5 });
      }
    };

    return (
      <div className="space-y-4">
        <div className="bg-green-900/30 border-2 border-green-500 rounded-lg p-6 text-center">
          <span className="text-5xl">🎉</span>
          <h3 className="text-green-400 font-bold text-xl mt-4">
            {isMultiDay ? `Floor ${state.currentDay} Complete!` : 'All Ducts Cleaned!'}
          </h3>
          {isMultiDay && (
            <p className="text-zinc-400 text-sm mt-1">
              {COURTHOUSE_FLOORS[state.currentDay]?.name}
            </p>
          )}
          <p className="text-zinc-300 mt-2">
            {excellentThisFloor} excellent, {goodThisFloor} good, {poorThisFloor} poor
          </p>
        </div>

        {isMultiDay && !isFinalDay && (
          <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              <span className="font-bold">Day {state.currentDay} of {state.totalDays}</span> - Time to pack up and check out with security.
            </p>
          </div>
        )}

        <button onClick={handleProceed} className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-bold rounded">
          {isMultiDay && !isFinalDay ? `End Day ${state.currentDay} →` : 'Proceed to Completion →'}
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

      // First check for problems (15% chance)
      triggerRandomProblem();

      // If no problem, check for gauge event (20% chance)
      if (!showProblem) {
        const gaugeTriggered = triggerGaugeCheck();
        if (!gaugeTriggered) {
          setCurrentDuctIndex(i => i + 1);
          setSelectedTool(null);
          setAirflowDirection(null);
        }
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

  // Show vacuum gauge diagnostics
  if (showGaugeCheck && currentGaugeScenario) {
    return (
      <VacuumGaugeDiagnostics
        scenario={currentGaugeScenario}
        onDiagnosis={handleGaugeDiagnosis}
      />
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

// Simulated dust visualization - generates a "debris pattern" for before/after photos
function DuctPhotoVisualization({ isBefore, quality, material }) {
  const debrisColors = {
    heavy: ['#8B7355', '#6B5344', '#9C8B76', '#7D6B5A'],
    medium: ['#9C8B76', '#B5A38E', '#8B7355', '#A69580'],
    light: ['#B5A38E', '#C4B3A0', '#A69580', '#D4C4B5']
  };

  const cleanColors = {
    excellent: '#6B7280', // Clean gray
    good: '#78716C',
    poor: '#8B8178'
  };

  const materialBg = {
    rigid: '#52525B',
    flex: '#57534E',
    ductboard: '#64748B',
    lined: '#475569'
  };

  if (isBefore) {
    // Generate debris particles for "dirty" visualization
    const particleCount = 25 + Math.floor(Math.random() * 20);
    const colors = debrisColors.heavy;

    return (
      <div
        className="relative w-full h-24 rounded overflow-hidden border-2 border-zinc-600"
        style={{ backgroundColor: materialBg[material] || '#52525B' }}
      >
        {/* Debris layer */}
        <div className="absolute inset-0 opacity-80">
          {Array.from({ length: particleCount }, (_, i) => {
            const size = 4 + Math.random() * 12;
            const left = Math.random() * 95;
            const top = Math.random() * 85;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const blur = Math.random() > 0.5 ? '1px' : '0px';

            return (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${size}px`,
                  height: `${size * (0.6 + Math.random() * 0.4)}px`,
                  left: `${left}%`,
                  top: `${top}%`,
                  backgroundColor: color,
                  filter: `blur(${blur})`,
                  transform: `rotate(${Math.random() * 360}deg)`
                }}
              />
            );
          })}
        </div>
        {/* Dust film overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(139,115,85,0.4) 0%, rgba(107,83,68,0.5) 50%, rgba(156,139,118,0.3) 100%)'
          }}
        />
        <span className="absolute bottom-1 left-2 text-xs text-zinc-300 font-bold bg-black/50 px-1 rounded">BEFORE</span>
      </div>
    );
  } else {
    // Clean duct visualization
    return (
      <div
        className="relative w-full h-24 rounded overflow-hidden border-2 border-green-600"
        style={{ backgroundColor: cleanColors[quality] || cleanColors.good }}
      >
        {/* Clean metallic sheen */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)`
          }}
        />
        {/* Quality indicator */}
        {quality === 'excellent' && (
          <div className="absolute top-1 right-1">
            <span className="text-green-400 text-lg">✨</span>
          </div>
        )}
        <span className="absolute bottom-1 left-2 text-xs text-green-300 font-bold bg-black/50 px-1 rounded">AFTER</span>
      </div>
    );
  }
}

function PhotoDocumentation({ state, dispatch, onComplete }) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showFlash, setShowFlash] = useState(false);

  // Get all cleaned ducts
  const ducts = state.scenario === 'courthouse'
    ? getCourthouseDuctsForDay(state.currentDay)
    : (SCENARIO_DUCTS[state.scenario] || []);

  const cleanedDucts = ducts.filter(d => state.ductsClean[d.id]);
  const currentDuct = cleanedDucts[currentPhotoIndex];
  const photosTaken = Object.keys(state.ductPhotos).length;
  const allPhotosTaken = photosTaken >= cleanedDucts.length;

  const handleTakePhoto = () => {
    if (!currentDuct) return;

    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);

    dispatch({
      type: 'TAKE_DUCT_PHOTO',
      ductId: currentDuct.id,
      ductName: currentDuct.name
    });

    // Move to next duct after a brief delay
    setTimeout(() => {
      if (currentPhotoIndex < cleanedDucts.length - 1) {
        setCurrentPhotoIndex(i => i + 1);
      }
    }, 500);
  };

  const handleComplete = () => {
    dispatch({ type: 'DOCUMENT_PHOTOS' });
    dispatch({ type: 'ADD_BONUS', reason: 'Complete photo documentation', points: 5 });
    onComplete();
  };

  const handleSkip = () => {
    dispatch({ type: 'ADD_PENALTY', reason: 'Incomplete photo documentation', points: 3 });
    onComplete();
  };

  const material = currentDuct ? (DUCT_MATERIALS[currentDuct.material]?.name || currentDuct.material) : '';

  return (
    <div className="space-y-4">
      {/* Flash effect */}
      {showFlash && (
        <div className="fixed inset-0 bg-white z-50 animate-pulse" style={{ animationDuration: '0.2s' }} />
      )}

      <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-yellow-400 font-bold">📸 Photo Documentation</h3>
          <span className="text-zinc-400 text-sm">{photosTaken}/{cleanedDucts.length} photos</span>
        </div>

        <p className="text-zinc-400 text-sm mb-4">
          Document before/after photos of each cleaned duct. These photos build customer trust and serve as proof of work.
        </p>

        {currentDuct && !state.ductPhotos[currentDuct.id] ? (
          <div className="space-y-4">
            {/* Current duct info */}
            <div className="bg-zinc-900 rounded p-3 border border-zinc-700">
              <p className="text-zinc-200 font-bold">{currentDuct.name}</p>
              <p className="text-zinc-500 text-sm">{material} • {currentDuct.length}</p>
              <p className="text-sm mt-1">
                <span className={`${state.ductsClean[currentDuct.id] === 'excellent' ? 'text-green-400' : state.ductsClean[currentDuct.id] === 'good' ? 'text-yellow-400' : 'text-orange-400'}`}>
                  Cleaning quality: {state.ductsClean[currentDuct.id]}
                </span>
              </p>
            </div>

            {/* Before/After visualization */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-zinc-500 text-xs mb-1 uppercase">Before</p>
                <DuctPhotoVisualization isBefore={true} material={currentDuct.material} />
              </div>
              <div>
                <p className="text-zinc-500 text-xs mb-1 uppercase">After</p>
                <DuctPhotoVisualization isBefore={false} quality={state.ductsClean[currentDuct.id]} material={currentDuct.material} />
              </div>
            </div>

            {/* Take photo button */}
            <button
              onClick={handleTakePhoto}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-bold rounded flex items-center justify-center gap-2 transition-all"
            >
              <span className="text-xl">📷</span>
              Take Photo
            </button>
          </div>
        ) : allPhotosTaken ? (
          <div className="space-y-4">
            {/* Photo gallery preview */}
            <div className="bg-green-900/30 border border-green-500 rounded-lg p-4 text-center">
              <span className="text-4xl">✅</span>
              <h4 className="text-green-400 font-bold mt-2">All Photos Taken!</h4>
              <p className="text-zinc-400 text-sm mt-1">{photosTaken} before/after comparisons documented</p>
            </div>

            {/* Mini gallery */}
            <div className="bg-zinc-900 rounded p-3">
              <p className="text-zinc-500 text-xs uppercase mb-2">Photo Gallery Preview</p>
              <div className="grid grid-cols-3 gap-2">
                {cleanedDucts.slice(0, 6).map(duct => (
                  <div key={duct.id} className="aspect-video bg-zinc-800 rounded border border-zinc-700 flex items-center justify-center">
                    <span className={`text-xs ${state.ductsClean[duct.id] === 'excellent' ? 'text-green-400' : 'text-zinc-400'}`}>
                      {state.ductsClean[duct.id] === 'excellent' ? '✨' : '✓'}
                    </span>
                  </div>
                ))}
                {cleanedDucts.length > 6 && (
                  <div className="aspect-video bg-zinc-800 rounded border border-zinc-700 flex items-center justify-center">
                    <span className="text-xs text-zinc-500">+{cleanedDucts.length - 6}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleComplete}
              className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-all"
            >
              Continue to Customer Walkthrough →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Show already-taken photos with navigation */}
            <div className="bg-zinc-900 rounded p-3">
              <p className="text-zinc-500 text-xs uppercase mb-2">Photos Taken</p>
              <div className="flex flex-wrap gap-2">
                {cleanedDucts.map((duct, idx) => (
                  <button
                    key={duct.id}
                    onClick={() => setCurrentPhotoIndex(idx)}
                    className={`w-8 h-8 rounded flex items-center justify-center text-xs transition-all ${
                      state.ductPhotos[duct.id]
                        ? 'bg-green-900/50 border border-green-500 text-green-400'
                        : idx === currentPhotoIndex
                        ? 'bg-yellow-500/20 border border-yellow-500 text-yellow-400'
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-500'
                    }`}
                  >
                    {state.ductPhotos[duct.id] ? '✓' : idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Current duct to photograph */}
            {currentDuct && (
              <>
                <div className="bg-zinc-900 rounded p-3 border border-zinc-700">
                  <p className="text-zinc-200 font-bold">{currentDuct.name}</p>
                  <p className="text-zinc-500 text-sm">{material} • {currentDuct.length}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-zinc-500 text-xs mb-1 uppercase">Before</p>
                    <DuctPhotoVisualization isBefore={true} material={currentDuct.material} />
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs mb-1 uppercase">After</p>
                    <DuctPhotoVisualization isBefore={false} quality={state.ductsClean[currentDuct.id]} material={currentDuct.material} />
                  </div>
                </div>

                <button
                  onClick={handleTakePhoto}
                  className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-bold rounded flex items-center justify-center gap-2 transition-all"
                >
                  <span className="text-xl">📷</span>
                  Take Photo
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="bg-zinc-900 rounded p-3">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Documentation Progress</span>
          <span className="text-zinc-400">{Math.round((photosTaken / cleanedDucts.length) * 100)}%</span>
        </div>
        <div className="w-full bg-zinc-700 rounded-full h-2 mt-2">
          <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${(photosTaken / cleanedDucts.length) * 100}%` }}></div>
        </div>
      </div>

      {/* Skip option */}
      {!allPhotosTaken && photosTaken > 0 && (
        <button
          onClick={handleSkip}
          className="w-full py-2 text-sm text-zinc-500 hover:text-orange-400 transition-all"
        >
          Skip remaining photos and continue (-3 points)
        </button>
      )}
    </div>
  );
}

// Gallery component for CustomerWalkthrough
function PhotoGallery({ state }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const photos = Object.entries(state.ductPhotos).map(([ductId, data]) => ({
    ductId,
    ...data
  }));

  if (photos.length === 0) return null;

  return (
    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
      <h4 className="text-zinc-400 font-bold text-sm uppercase mb-3">📸 Photo Documentation</h4>

      {selectedPhoto ? (
        <div className="space-y-3">
          <button
            onClick={() => setSelectedPhoto(null)}
            className="text-yellow-400 text-sm hover:text-yellow-300"
          >
            ← Back to gallery
          </button>
          <div className="bg-zinc-800 rounded p-3">
            <p className="text-zinc-200 font-bold mb-2">{selectedPhoto.ductName}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-zinc-500 text-xs mb-1">Before</p>
                <div className="h-20 rounded bg-gradient-to-br from-amber-900/60 to-stone-700/60 border border-zinc-600 flex items-center justify-center">
                  <span className="text-2xl opacity-50">🟤</span>
                </div>
              </div>
              <div>
                <p className="text-zinc-500 text-xs mb-1">After</p>
                <div className={`h-20 rounded border flex items-center justify-center ${
                  selectedPhoto.quality === 'excellent'
                    ? 'bg-zinc-600 border-green-500'
                    : 'bg-zinc-700 border-zinc-600'
                }`}>
                  <span className="text-2xl">{selectedPhoto.quality === 'excellent' ? '✨' : '✓'}</span>
                </div>
              </div>
            </div>
            <p className="text-sm mt-2">
              <span className={`${selectedPhoto.quality === 'excellent' ? 'text-green-400' : selectedPhoto.quality === 'good' ? 'text-yellow-400' : 'text-orange-400'}`}>
                Quality: {selectedPhoto.quality}
              </span>
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((photo) => (
            <button
              key={photo.ductId}
              onClick={() => setSelectedPhoto(photo)}
              className="aspect-square bg-zinc-800 rounded border border-zinc-700 hover:border-yellow-500 transition-all flex items-center justify-center"
            >
              <span className={photo.quality === 'excellent' ? 'text-green-400' : 'text-zinc-400'}>
                {photo.quality === 'excellent' ? '✨' : '✓'}
              </span>
            </button>
          ))}
        </div>
      )}

      <p className="text-zinc-500 text-xs mt-2">{photos.length} ducts documented</p>
    </div>
  );
}

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

        {/* Photo Gallery - show when photos documented */}
        {hasPhotos && Object.keys(state.ductPhotos).length > 0 && (
          <div className="mb-4">
            <PhotoGallery state={state} />
          </div>
        )}

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

// ============================================================================
// MULTI-DAY TRANSITION COMPONENTS
// ============================================================================

function DayEndPhase({ state, dispatch }) {
  const floor = COURTHOUSE_FLOORS[state.currentDay];
  const dayDucts = getCourthouseDuctsForDay(state.currentDay);
  const cleanedCount = dayDucts.filter(d => state.ductsClean[d.id]).length;
  const excellentCount = dayDucts.filter(d => state.ductsClean[d.id] === 'excellent').length;

  const handlePackUp = () => {
    dispatch({ type: 'PACK_UP_EQUIPMENT' });
    dispatch({ type: 'ADD_BONUS', reason: 'Proper end-of-day pack up', points: 2 });
  };

  const handleSecurityCheckout = () => {
    dispatch({ type: 'SECURITY_CHECKOUT' });
  };

  const handleNextDay = () => {
    dispatch({ type: 'NEXT_DAY' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <span className="text-5xl">🌅</span>
        <h2 className="text-2xl font-bold text-yellow-400 mt-4">End of Day {state.currentDay}</h2>
        <p className="text-zinc-400">{floor?.name}</p>
      </div>

      {/* Day Summary */}
      <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
        <h3 className="text-yellow-400 font-bold mb-4">📊 Day {state.currentDay} Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900 rounded p-3 border border-zinc-700">
            <p className="text-zinc-400 text-xs">Ducts Cleaned</p>
            <p className="text-2xl font-bold text-zinc-100">{cleanedCount}/{dayDucts.length}</p>
          </div>
          <div className="bg-zinc-900 rounded p-3 border border-zinc-700">
            <p className="text-zinc-400 text-xs">Excellent Quality</p>
            <p className="text-2xl font-bold text-green-400">{excellentCount}</p>
          </div>
          <div className="bg-zinc-900 rounded p-3 border border-zinc-700">
            <p className="text-zinc-400 text-xs">Current Score</p>
            <p className="text-2xl font-bold text-yellow-400">{state.score}</p>
          </div>
          <div className="bg-zinc-900 rounded p-3 border border-zinc-700">
            <p className="text-zinc-400 text-xs">Time Delays</p>
            <p className="text-2xl font-bold text-orange-400">+{state.timeDelay}min</p>
          </div>
        </div>
      </div>

      {/* Pack Up Checklist */}
      <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
        <h3 className="text-yellow-400 font-bold mb-4">📦 End of Day Pack Up</h3>
        {!state.dayPackedUp ? (
          <div className="space-y-2">
            {DAY_END_SUMMARY.packUp.map((task, i) => (
              <div key={i} className="flex items-center gap-2 text-zinc-300 text-sm">
                <span className="text-zinc-600">○</span>
                <span>{task}</span>
              </div>
            ))}
            <button onClick={handlePackUp} className="mt-4 w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-bold rounded transition-all">
              Complete Pack Up (+2 pts)
            </button>
          </div>
        ) : (
          <div className="p-4 bg-green-900/30 border border-green-500 rounded">
            <p className="text-green-400 font-bold">✓ Equipment Secured</p>
            <p className="text-zinc-400 text-sm">All equipment packed and staging area organized for tomorrow.</p>
          </div>
        )}
      </div>

      {/* Security Checkout */}
      <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
        <h3 className="text-yellow-400 font-bold mb-4">🛡️ Security Checkout</h3>
        {!state.dayCheckedOut ? (
          <div className="space-y-2">
            {DAY_END_SUMMARY.securityCheckout.map((task, i) => (
              <div key={i} className="flex items-center gap-2 text-zinc-300 text-sm">
                <span className="text-zinc-600">○</span>
                <span>{task}</span>
              </div>
            ))}
            <button onClick={handleSecurityCheckout} disabled={!state.dayPackedUp} className={`mt-4 w-full py-3 font-bold rounded transition-all ${state.dayPackedUp ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'}`}>
              Complete Security Checkout
            </button>
          </div>
        ) : (
          <div className="p-4 bg-green-900/30 border border-green-500 rounded">
            <p className="text-green-400 font-bold">✓ Checked Out</p>
            <p className="text-zinc-400 text-sm">Badges returned, signed out. See you tomorrow at 7:30 AM.</p>
          </div>
        )}
      </div>

      {/* Tomorrow Preview */}
      {state.dayPackedUp && state.dayCheckedOut && state.currentDay < state.totalDays && (
        <div className="bg-zinc-800/50 border border-blue-500/30 rounded-lg p-4">
          <h3 className="text-blue-400 font-bold mb-2">📅 Tomorrow: Day {state.currentDay + 1}</h3>
          <p className="text-zinc-300">{COURTHOUSE_FLOORS[state.currentDay + 1]?.name}</p>
          <p className="text-zinc-500 text-sm mt-1">{COURTHOUSE_FLOORS[state.currentDay + 1]?.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {COURTHOUSE_FLOORS[state.currentDay + 1]?.challenges.map((c, i) => (
              <span key={i} className="px-2 py-1 bg-zinc-900 rounded text-xs text-zinc-400">{c}</span>
            ))}
          </div>
          <button onClick={handleNextDay} className="mt-4 w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-all">
            Start Day {state.currentDay + 1} →
          </button>
        </div>
      )}
    </div>
  );
}

function DayStartPhase({ state, dispatch }) {
  const [eventAcknowledged, setEventAcknowledged] = useState(false);
  const [callbackHandled, setCallbackHandled] = useState(!state.dayCallback);
  const [securityDone, setSecurityDone] = useState(false);

  const floor = COURTHOUSE_FLOORS[state.currentDay];

  const handleAcknowledgeEvent = () => {
    if (state.dayStartEvent?.bonus) {
      dispatch({ type: 'ADD_BONUS', reason: state.dayStartEvent.text.split('.')[0], points: state.dayStartEvent.bonus });
    }
    setEventAcknowledged(true);
  };

  const handleCallback = (success) => {
    dispatch({ type: 'HANDLE_CALLBACK', success, penalty: state.dayCallback?.penalty || 0 });
    setCallbackHandled(true);
  };

  const handleSecurityCheckIn = () => {
    dispatch({ type: 'CLEAR_SECURITY' });
    setSecurityDone(true);
  };

  const handleStartWork = () => {
    dispatch({ type: 'COMPLETE_DAY_START' });
  };

  const canProceed = eventAcknowledged && callbackHandled && securityDone;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <span className="text-5xl">🌅</span>
        <h2 className="text-2xl font-bold text-yellow-400 mt-4">Day {state.currentDay} - Morning</h2>
        <p className="text-zinc-400">{floor?.name}</p>
      </div>

      {/* Returning Crew Event */}
      {state.dayStartEvent && !eventAcknowledged && (
        <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
          <h3 className="text-yellow-400 font-bold mb-3">☀️ Morning Arrival</h3>
          <div className={`p-4 rounded border ${state.dayStartEvent.type === 'positive' ? 'bg-green-900/20 border-green-500/50' : 'bg-zinc-900 border-zinc-700'}`}>
            <p className="text-zinc-200">{state.dayStartEvent.text}</p>
            {state.dayStartEvent.bonus > 0 && (
              <p className="text-green-400 text-sm mt-2">+{state.dayStartEvent.bonus} points</p>
            )}
          </div>
          <button onClick={handleAcknowledgeEvent} className="mt-4 w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-bold rounded">
            Continue
          </button>
        </div>
      )}

      {/* Callback from Previous Day */}
      {state.dayCallback && !callbackHandled && eventAcknowledged && (
        <div className="bg-orange-900/20 border border-orange-500/50 rounded-lg p-4">
          <h3 className="text-orange-400 font-bold mb-3">📞 Callback from Yesterday</h3>
          <p className="text-zinc-200">{state.dayCallback.text}</p>
          {state.dayCallback.penalty && (
            <p className="text-orange-400 text-sm mt-2">Previous issue: -{state.dayCallback.penalty} points if not addressed</p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => handleCallback(true)} className="py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded">
              Handle Professionally
            </button>
            <button onClick={() => handleCallback(false)} className="py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-bold rounded">
              Brush Off
            </button>
          </div>
        </div>
      )}

      {/* Security Check-In */}
      {eventAcknowledged && callbackHandled && !securityDone && (
        <div className="bg-zinc-800/50 border border-blue-500/30 rounded-lg p-4">
          <h3 className="text-blue-400 font-bold mb-3">🛡️ Security Check-In</h3>
          <p className="text-zinc-300">Morning check-in with courthouse security.</p>
          {state.currentDay > 1 && (
            <p className="text-green-400 text-sm mt-2">Security recognizes you from yesterday - expedited check-in.</p>
          )}
          <button onClick={handleSecurityCheckIn} className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded">
            Complete Check-In
          </button>
        </div>
      )}

      {/* Today's Floor Preview */}
      {eventAcknowledged && callbackHandled && securityDone && (
        <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
          <h3 className="text-yellow-400 font-bold mb-3">📋 Today's Assignment</h3>
          <p className="text-zinc-200 font-bold text-lg">{floor?.name}</p>
          <p className="text-zinc-400 mt-1">{floor?.description}</p>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-zinc-900 rounded p-3 border border-zinc-700">
              <p className="text-zinc-400 text-xs">PTAC Units</p>
              <p className="text-xl font-bold text-zinc-100">{floor?.ptacCount}</p>
            </div>
            <div className="bg-zinc-900 rounded p-3 border border-zinc-700">
              <p className="text-zinc-400 text-xs">Ducts to Clean</p>
              <p className="text-xl font-bold text-zinc-100">{getCourthouseDuctsForDay(state.currentDay).length}</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-zinc-500 text-sm mb-2">Today's Challenges:</p>
            <div className="flex flex-wrap gap-2">
              {floor?.challenges.map((c, i) => (
                <span key={i} className="px-2 py-1 bg-orange-900/30 border border-orange-500/50 rounded text-xs text-orange-300">{c}</span>
              ))}
            </div>
          </div>

          <button onClick={handleStartWork} className="mt-6 w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-all">
            Begin Work on {floor?.name} →
          </button>
        </div>
      )}

      {/* Progress from Previous Days */}
      {state.currentDay > 1 && eventAcknowledged && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
          <h3 className="text-zinc-400 font-bold mb-3">📈 Previous Days</h3>
          <div className="space-y-2">
            {Array.from({ length: state.currentDay - 1 }, (_, i) => i + 1).map(day => {
              const dayData = state.dayProgress[day];
              return (
                <div key={day} className="flex justify-between items-center p-2 bg-zinc-900 rounded">
                  <span className="text-zinc-300">Day {day} - {COURTHOUSE_FLOORS[day]?.name}</span>
                  <span className="text-green-400">✓ Complete</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CompletionPhase({ state, dispatch }) {
  const [subPhase, setSubPhase] = useState(state.accessCuts.length > 0 ? 'cap_cuts' : 'photos'); // 'cap_cuts', 'photos', 'walkthrough', 'complete'
  const [walkthroughDone, setWalkthroughDone] = useState(false);
  const [cappingComplete, setCappingComplete] = useState(false);

  const uncappedCuts = state.accessCuts.filter(c => !c.capped);
  const allCutsCapped = uncappedCuts.length === 0;

  const handleCapCut = (cutId) => {
    dispatch({ type: 'CAP_ACCESS_CUT', cutId });
  };

  const handleCapAllCuts = () => {
    dispatch({ type: 'CAP_ALL_CUTS' });
    dispatch({ type: 'ADD_BONUS', reason: 'All access holes properly capped', points: 3 });
    setCappingComplete(true);
    setTimeout(() => setSubPhase('photos'), 1500);
  };

  const handleSkipCapping = () => {
    const uncappedCount = uncappedCuts.length;
    dispatch({ type: 'ADD_PENALTY', reason: `${uncappedCount} access hole(s) left uncapped`, points: uncappedCount * 10 });
    setSubPhase('photos');
  };

  const handlePhotosDone = () => {
    setSubPhase('walkthrough');
  };

  const handleSkipPhotos = () => {
    dispatch({ type: 'ADD_PENALTY', reason: 'Skipped photo documentation', points: 5 });
    setSubPhase('walkthrough');
  };

  const handleWalkthroughComplete = () => {
    setWalkthroughDone(true);
    setSubPhase('complete');
  };

  const handleComplete = () => {
    if (state.screwInventory < state.screwsNeeded) {
      dispatch({ type: 'ADD_PENALTY', reason: `Missing ${state.screwsNeeded - state.screwInventory} screws`, points: 5 });
    }
    dispatch({ type: 'COMPLETE_JOB' });
  };

  // Access cut capping phase
  if (subPhase === 'cap_cuts' && !cappingComplete) {
    return (
      <div className="space-y-4">
        <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
          <h3 className="text-yellow-400 font-bold mb-4">⭕ Cap Access Holes</h3>
          <p className="text-zinc-400 text-sm mb-4">
            All access holes must be capped with proper access panels before job completion.
          </p>

          <div className="space-y-2">
            {state.accessCuts.map((cut) => (
              <div
                key={cut.id}
                className={`p-3 rounded-lg border-2 flex items-center justify-between ${
                  cut.capped ? 'bg-green-900/30 border-green-500' : 'bg-zinc-900 border-zinc-700'
                }`}
              >
                <div>
                  <p className={cut.capped ? 'text-green-400 font-medium' : 'text-zinc-200 font-medium'}>
                    {cut.capped ? '✓ ' : '○ '}{cut.name}
                  </p>
                  <p className="text-zinc-500 text-xs">
                    {cut.type === 'circular' ? '8" Circular' : 'Rectangular'} • {cut.position}
                    {cut.lined && <span className="text-orange-400 ml-1">(lined)</span>}
                  </p>
                </div>
                {!cut.capped && (
                  <button
                    onClick={() => handleCapCut(cut.id)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-all"
                  >
                    Install Cap
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            {!allCutsCapped && (
              <button
                onClick={handleCapAllCuts}
                className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-all"
              >
                Cap All Remaining (+3 pts)
              </button>
            )}
            {allCutsCapped && (
              <button
                onClick={() => {
                  dispatch({ type: 'ADD_BONUS', reason: 'All access holes properly capped', points: 3 });
                  setSubPhase('photos');
                }}
                className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-all"
              >
                Continue to Photos →
              </button>
            )}
          </div>
          <button
            onClick={handleSkipCapping}
            className="w-full mt-2 py-2 text-sm text-zinc-500 hover:text-red-400 transition-all"
          >
            Skip capping (-10 pts per hole)
          </button>
        </div>
      </div>
    );
  }

  // Photo documentation phase
  if (subPhase === 'photos' && !state.photosDocumented) {
    return (
      <div className="space-y-4">
        <PhotoDocumentation state={state} dispatch={dispatch} onComplete={handlePhotosDone} />
        <button
          onClick={handleSkipPhotos}
          className="w-full py-2 text-sm text-zinc-500 hover:text-orange-400 transition-all"
        >
          Skip all photos and proceed to walkthrough (-5 points)
        </button>
      </div>
    );
  }

  // Customer walkthrough phase
  if (subPhase === 'walkthrough' && !walkthroughDone) {
    return <CustomerWalkthrough state={state} dispatch={dispatch} onComplete={handleWalkthroughComplete} />;
  }

  // Final completion screen
  const allAccessCapped = state.accessCuts.every(c => c.capped);

  return (
    <div className="space-y-4">
      <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
        <h3 className="text-yellow-400 font-bold mb-4">✅ Job Completion Checklist</h3>

        <div className="space-y-3">
          {/* Access holes status (if any were made) */}
          {state.accessCuts.length > 0 && (
            <div className={`p-4 rounded-lg border-2 ${allAccessCapped ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'}`}>
              <p className={allAccessCapped ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                ⭕ {allAccessCapped ? 'Access Holes Capped' : 'Uncapped Access Holes!'}
              </p>
              <p className="text-zinc-400 text-sm">
                {allAccessCapped
                  ? `${state.accessCuts.length} access hole(s) properly capped with panels`
                  : `${state.accessCuts.filter(c => !c.capped).length} hole(s) left uncapped`}
              </p>
            </div>
          )}

          {/* Photos status */}
          <div className={`p-4 rounded-lg border-2 ${state.photosDocumented ? 'bg-green-900/30 border-green-500' : 'bg-orange-900/30 border-orange-500'}`}>
            <p className={state.photosDocumented ? 'text-green-400 font-bold' : 'text-orange-400 font-bold'}>
              📸 {state.photosDocumented ? 'Photos Documented' : 'Photos Skipped'}
            </p>
            <p className="text-zinc-400 text-sm">
              {state.photosDocumented
                ? `${Object.keys(state.ductPhotos).length} before/after photos ready for customer`
                : 'No documentation available'}
            </p>
          </div>

          {/* Walkthrough status */}
          <div className="p-4 rounded-lg border-2 bg-green-900/30 border-green-500">
            <p className="text-green-400 font-bold">🤝 Walkthrough Complete</p>
            <p className="text-zinc-400 text-sm">Customer signed off on work</p>
          </div>

          {/* Screw inventory */}
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

      <button onClick={handleComplete} className="w-full py-3 font-bold rounded transition-all bg-green-600 hover:bg-green-500 text-white">
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

      {/* Multi-day summary for courthouse */}
      {state.scenario === 'courthouse' && state.totalDays > 1 && Object.keys(state.dayProgress).length > 0 && (
        <div className="bg-zinc-900 rounded-lg p-4 border border-blue-500/30">
          <h3 className="text-blue-400 font-bold mb-3">📅 Multi-Day Summary</h3>
          <div className="space-y-2">
            {Array.from({ length: state.totalDays }, (_, i) => i + 1).map(day => {
              const floor = COURTHOUSE_FLOORS[day];
              const dayData = state.dayProgress[day];
              const dayDucts = getCourthouseDuctsForDay(day);
              const cleanedCount = dayDucts.filter(d => state.ductsClean[d.id]).length;
              return (
                <div key={day} className="flex justify-between items-center p-2 bg-zinc-800 rounded">
                  <div>
                    <span className="text-zinc-300 font-medium">Day {day}</span>
                    <span className="text-zinc-500 text-sm ml-2">{floor?.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-green-400">{cleanedCount}/{dayDucts.length} ducts</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
          <p className="text-zinc-500">Carolina Quality Air Training System v1.3</p>
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape to toggle pause (only when in game)
      if (e.key === 'Escape' && state.phase > 0 && state.phase < 7) {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_PAUSE' });
        return;
      }

      // Don't process other shortcuts when paused or in menu
      if (state.paused || state.phase === 0 || state.phase === 7) return;

      // Enter to click primary action buttons
      if (e.key === 'Enter') {
        const primaryBtn = document.querySelector('button.bg-yellow-500, button.bg-green-600');
        if (primaryBtn) {
          e.preventDefault();
          primaryBtn.click();
        }
      }

      // Number keys 1-9 to select dialogue options
      if (e.key >= '1' && e.key <= '9') {
        const optionIndex = parseInt(e.key) - 1;
        const options = document.querySelectorAll('.space-y-2 > button, .space-y-3 > button');
        if (options[optionIndex]) {
          e.preventDefault();
          options[optionIndex].click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.phase, state.paused]);

  const renderPhase = () => {
    // Handle multi-day transitions for courthouse
    if (state.dayPhase === 'day-end') {
      return <DayEndPhase state={state} dispatch={dispatch} />;
    }
    if (state.dayPhase === 'day-start') {
      return <DayStartPhase state={state} dispatch={dispatch} />;
    }

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
            {state.subPhase === 1 && !state.siteMapCompleted && (
              <SiteMapNavigation
                state={state}
                dispatch={dispatch}
                onComplete={() => dispatch({ type: 'COMPLETE_SITE_MAP' })}
              />
            )}
            {state.subPhase === 1 && state.siteMapCompleted && <SiteSurvey state={state} dispatch={dispatch} />}
            {state.subPhase === 2 && <HazardCheck state={state} dispatch={dispatch} />}
          </div>
        );
      case 3:
        return (
          <div className="max-w-4xl mx-auto">
            <PhaseHeader phase={state.phase} scenario={state.scenario} currentDay={state.currentDay} totalDays={state.totalDays} />
            <h2 className="text-xl font-bold text-zinc-200 mb-4">Phase 3: Setup</h2>
            {state.subPhase === 0 && <AccessCutting state={state} dispatch={dispatch} />}
            {state.subPhase === 1 && <PowerSetup state={state} dispatch={dispatch} />}
            {state.subPhase === 2 && <RegisterRemoval state={state} dispatch={dispatch} />}
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-2 sm:p-4" style={{ fontFamily: "'JetBrains Mono', 'SF Mono', 'Consolas', monospace" }}>
      <ScoreBar state={state} dispatch={dispatch} />
      {state.paused && <PauseMenu dispatch={dispatch} />}
      <div className={state.phase > 0 && state.phase < 7 ? 'pt-12' : ''}>
        {renderPhase()}
      </div>
    </div>
  );
}
