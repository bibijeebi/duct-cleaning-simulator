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
  const dialogues = {
    helpful: { text: "Oh great, you're here! Let me show you where everything is. The air handler is in the attic, pull-down stairs are in the hallway. Coffee?", choices: [{ text: "Thank you! I'd love to take a look at the system first.", bonus: 3 }, { text: "Thanks, let me get my equipment set up.", next: 'survey' }, { text: "Where's the thermostat?", next: 'survey' }] },
    suspicious: { text: "You're from the duct cleaning company? Do you have ID? How long is this going to take? I don't want you tracking dirt everywhere.", choices: [{ text: "Absolutely, here's my ID and I'll use drop cloths to protect your floors.", bonus: 5 }, { text: "Yes, we spoke on the phone. This should take 3-4 hours.", next: 'survey' }, { text: "Can you just show me the air handler?", penalty: 3 }] },
    micromanager: { text: "Finally! I've been waiting. I want to watch everything you do. I've heard horror stories about duct cleaners. You ARE going to clean every single vent, right?", choices: [{ text: "Of course! I'll walk you through the entire process. Would you like to see the before photos?", bonus: 5 }, { text: "Yes, we clean everything. I'll show you as we go.", next: 'survey' }, { text: "We know what we're doing.", penalty: 5 }] },
    professional: { text: "Good morning. I'm the office manager. Here's the building access card and alarm code. Roof hatch key is at the front desk. Any questions?", choices: [{ text: "Perfect, thank you. I'll check in before we start on the roof.", bonus: 3 }, { text: "Got it. Where's the breaker panel?", next: 'survey' }, { text: "We'll get started.", next: 'survey' }] },
    security: { text: "Hold up. I need to see ID and your work order. You'll need an escort to the mechanical areas. Sign in here.", choices: [{ text: "No problem. Here's everything. Happy to work with your security protocols.", bonus: 5 }, { text: "Here's my ID. When can we get started?", next: 'survey' }, { text: "This is excessive for duct cleaning.", penalty: 5 }] },
    absent: { text: "[Text message received] 'Running late. Key is under the mat. Alarm code is 1234. Make yourself at home, text me when done.'", choices: [{ text: "Document the key location with a photo before entering.", bonus: 3 }, { text: "Let yourself in and get started.", next: 'survey' }, { text: "Text back: 'No problem, I'll document everything.'", bonus: 2 }] },
    facilities: { text: "Welcome to Durham County Courthouse. I'm Jeff Martinez, Facilities. We've got 47 PTAC units across three floors. Security will escort you. We'll need to work around court schedules.", choices: [{ text: "Understood. Let's review the floor plan and court schedule together.", bonus: 5 }, { text: "47 units, got it. Which floor should we start on?", next: 'survey' }, { text: "Can we just get access and figure it out?", penalty: 3 }] }
  };
  
  const handleChoice = (choice) => {
    if (choice.bonus) dispatch({ type: 'ADD_BONUS', reason: 'Professional first contact', points: choice.bonus });
    if (choice.penalty) dispatch({ type: 'ADD_PENALTY', reason: 'Poor customer interaction', points: choice.penalty });
    dispatch({ type: 'SET_DIALOGUE', dialogue: null });
    dispatch({ type: 'SET_SUBPHASE', subPhase: 1 });
  };
  
  useEffect(() => {
    dispatch({ type: 'SET_DIALOGUE', dialogue: { speaker: 'customer', ...dialogues[state.customerType] } });
  }, []);
  
  return (
    <div className="space-y-4">
      {state.currentDialogue && (
        <DialogueBox dialogue={state.currentDialogue} onChoice={handleChoice} customerType={state.customerType} />
      )}
      <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
        <h3 className="text-yellow-400 font-bold mb-2">🤝 First Contact</h3>
        <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded border border-zinc-700">
          <span className="text-3xl">{customer.avatar}</span>
          <div>
            <p className="text-zinc-200 font-bold">{customer.name}</p>
            <p className="text-zinc-500 text-sm">Waiting for interaction...</p>
          </div>
        </div>
      </div>
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

function CompletionPhase({ state, dispatch }) {
  const [step, setStep] = useState(0);
  const [photosTaken, setPhotosTaken] = useState(false);
  const [walkthroughDone, setWalkthroughDone] = useState(false);
  
  const handlePhotos = () => {
    dispatch({ type: 'DOCUMENT_PHOTOS' });
    dispatch({ type: 'ADD_BONUS', reason: 'Proper documentation', points: 5 });
    setPhotosTaken(true);
  };
  
  const handleWalkthrough = () => {
    dispatch({ type: 'COMPLETE_WALKTHROUGH' });
    dispatch({ type: 'ADD_BONUS', reason: 'Professional walkthrough', points: 5 });
    setWalkthroughDone(true);
  };
  
  const handleComplete = () => {
    if (state.screwInventory < state.screwsNeeded) {
      dispatch({ type: 'ADD_PENALTY', reason: `Missing ${state.screwsNeeded - state.screwInventory} screws`, points: 5 });
    }
    dispatch({ type: 'COMPLETE_JOB' });
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-zinc-800/50 border border-yellow-500/30 rounded-lg p-4">
        <h3 className="text-yellow-400 font-bold mb-4">✅ Job Completion Checklist</h3>
        
        <div className="space-y-3">
          <button onClick={handlePhotos} disabled={photosTaken} className={`w-full p-4 rounded-lg border-2 text-left transition-all ${photosTaken ? 'bg-green-900/30 border-green-500' : 'bg-zinc-900 border-zinc-700 hover:border-yellow-500'}`}>
            <p className="text-zinc-200 font-bold">📸 Before/After Photos</p>
            <p className="text-zinc-500 text-sm">Document work completed for customer records</p>
            {photosTaken && <p className="text-green-400 mt-2">✓ Photos documented</p>}
          </button>
          
          <button onClick={handleWalkthrough} disabled={walkthroughDone || !photosTaken} className={`w-full p-4 rounded-lg border-2 text-left transition-all ${walkthroughDone ? 'bg-green-900/30 border-green-500' : !photosTaken ? 'opacity-50 cursor-not-allowed bg-zinc-900 border-zinc-700' : 'bg-zinc-900 border-zinc-700 hover:border-yellow-500'}`}>
            <p className="text-zinc-200 font-bold">🤝 Customer Walkthrough</p>
            <p className="text-zinc-500 text-sm">Present work and obtain signature</p>
            {walkthroughDone && <p className="text-green-400 mt-2">✓ Walkthrough complete</p>}
          </button>
          
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
