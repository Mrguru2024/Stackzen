// Centralized category mapping utility for all job sources

export function mapCategory(
  source: string,
  rawCategory: string | undefined,
  title?: string,
  description?: string
): string {
  if (!rawCategory && !title && !description) return 'Other';
  const cat = (rawCategory || '').toLowerCase();
  const text = ((title || '') + ' ' + (description || '')).toLowerCase();

  // --- Specialized mappings ---
  // Agile/Scrum
  if (
    cat.includes('scrum master') ||
    cat.includes('agile coach') ||
    text.match(/\bscrum master|agile coach\b/)
  )
    return 'Project/Product/Business';
  // SRE/Release/Build
  if (
    cat.includes('sre') ||
    cat.includes('site reliability engineer') ||
    cat.includes('release manager') ||
    cat.includes('build engineer') ||
    text.match(/\bsre|site reliability engineer|release manager|build engineer\b/)
  )
    return 'Web Dev / Tech';
  // Mobile
  if (
    cat.includes('mobile developer') ||
    cat.includes('ios developer') ||
    cat.includes('android developer') ||
    text.match(/\bmobile developer|ios developer|android developer\b/)
  )
    return 'Web Dev / Tech';
  // Game/Unity/Unreal
  if (
    cat.includes('game developer') ||
    cat.includes('unity developer') ||
    cat.includes('unreal developer') ||
    text.match(/\bgame developer|unity developer|unreal developer\b/)
  )
    return 'Web Dev / Tech';
  // Blockchain/Web3
  if (
    cat.includes('blockchain developer') ||
    cat.includes('smart contract') ||
    cat.includes('solidity') ||
    cat.includes('web3') ||
    text.match(/\bblockchain developer|smart contract|solidity|web3\b/)
  )
    return 'Web Dev / Tech';
  // AI/ML/Deep Learning/NLP/Computer Vision
  if (
    cat.includes('ai engineer') ||
    cat.includes('machine learning engineer') ||
    cat.includes('deep learning') ||
    cat.includes('nlp') ||
    cat.includes('computer vision') ||
    text.match(/\bai engineer|machine learning engineer|deep learning|nlp|computer vision\b/)
  )
    return 'Data & Analytics';
  // Robotics/Embedded/Firmware/FPGA/ASIC
  if (
    cat.includes('robotics') ||
    cat.includes('embedded engineer') ||
    cat.includes('firmware engineer') ||
    cat.includes('fpga') ||
    cat.includes('asic') ||
    text.match(/\brobotics|embedded engineer|firmware engineer|fpga|asic\b/)
  )
    return 'Web Dev / Tech';
  // EDA (Electronic Design Automation)
  if (cat.includes('eda') || text.match(/\beda\b/)) return 'Web Dev / Tech';

  // --- Existing custom rules for edge cases ---
  // Data/Analytics
  if (
    cat.includes('data analyst') ||
    cat.includes('data scientist') ||
    cat.includes('analytics') ||
    text.match(/\bdata analyst|data scientist|analytics\b/)
  )
    return 'Data & Analytics';
  // QA/Testing
  if (
    cat.includes('qa') ||
    cat.includes('quality assurance') ||
    text.match(/\bqa|quality assurance|test engineer|test technician\b/)
  )
    return 'QA & Testing';
  // Project/Product/Business
  if (
    cat.includes('project manager') ||
    cat.includes('product manager') ||
    cat.includes('business analyst') ||
    text.match(/\bproject manager|product manager|business analyst\b/)
  )
    return 'Project/Product/Business';
  // Bookkeeping/Finance
  if (
    cat.includes('bookkeeper') ||
    cat.includes('payroll') ||
    cat.includes('billing') ||
    cat.includes('collections') ||
    text.match(/\bbookkeeper|payroll|billing|collections\b/)
  )
    return 'Finance / Legal';
  // Paralegal/Legal
  if (
    cat.includes('paralegal') ||
    cat.includes('legal assistant') ||
    cat.includes('attorney') ||
    cat.includes('lawyer') ||
    text.match(/\bparalegal|legal assistant|attorney|lawyer\b/)
  )
    return 'Finance / Legal';
  // Social Media/Marketing/SEO/Content
  if (
    cat.includes('social media') ||
    cat.includes('marketing') ||
    cat.includes('seo') ||
    cat.includes('content creator') ||
    text.match(/\bsocial media|marketing|seo|content creator\b/)
  )
    return 'Marketing';
  // Recruiting/HR
  if (
    cat.includes('recruiter') ||
    cat.includes('hr manager') ||
    cat.includes('human resources') ||
    text.match(/\brecruiter|hr manager|human resources\b/)
  )
    return 'Other';
  // Admin/Assistant
  if (
    cat.includes('administrative assistant') ||
    cat.includes('executive assistant') ||
    text.match(/\badministrative assistant|executive assistant\b/)
  )
    return 'Customer Service';
  // Operations/Account/Sales
  if (
    cat.includes('operations manager') ||
    cat.includes('account executive') ||
    cat.includes('sales representative') ||
    text.match(/\boperations manager|account executive|sales representative\b/)
  )
    return 'Sales';
  // Customer Success/Support/Help Desk
  if (
    cat.includes('customer success') ||
    cat.includes('support specialist') ||
    cat.includes('help desk') ||
    cat.includes('it support') ||
    text.match(/\bcustomer success|support specialist|help desk|it support\b/)
  )
    return 'Customer Service';
  // IT/Network/System/DevOps/Cloud/Security
  if (
    cat.includes('network engineer') ||
    cat.includes('system administrator') ||
    cat.includes('devops') ||
    cat.includes('cloud engineer') ||
    cat.includes('security analyst') ||
    cat.includes('cybersecurity') ||
    text.match(
      /\bnetwork engineer|system administrator|devops|cloud engineer|security analyst|cybersecurity\b/
    )
  )
    return 'Web Dev / Tech';
  // Compliance/Legal
  if (
    cat.includes('compliance') ||
    cat.includes('legal assistant') ||
    cat.includes('attorney') ||
    text.match(/\bcompliance|legal assistant|attorney\b/)
  )
    return 'Finance / Legal';
  // Medical/Healthcare Assistants
  if (
    cat.includes('occupational therapy assistant') ||
    cat.includes('physical therapy assistant') ||
    cat.includes('therapy assistant') ||
    text.match(
      /\boccupational therapy assistant|physical therapy assistant|therapy assistant|certified occupational therapy assistant\b/
    )
  )
    return 'Healthcare & Nursing Jobs';
  // Emergency/Fire/Police/Security
  if (cat.match(/firefighter|police|security guard|dispatcher/)) return 'Other';
  if (text.match(/\bfirefighter|police|security guard|dispatcher\b/)) return 'Other';
  // Logistics/Supply Chain/Warehouse
  if (
    cat.match(
      /logistics|supply chain|warehouse|forklift|shipping|receiving|inventory|procurement|purchasing|buyer|sourcing/
    )
  )
    return 'Other';
  if (
    text.match(
      /\blogistics|supply chain|warehouse|forklift|shipping|receiving|inventory|procurement|purchasing|buyer|sourcing\b/
    )
  )
    return 'Other';
  // Manufacturing/Production/Assembly
  if (cat.match(/manufacturing|production|assembly|machinist|welder|fabricator|cnc|maintenance/))
    return 'Other';
  if (
    text.match(/\bmanufacturing|production|assembly|machinist|welder|fabricator|cnc|maintenance\b/)
  )
    return 'Other';
  // Janitorial/Landscaping/Moving
  if (cat.match(/janitor|custodian|housekeeper|cleaner|landscaper|groundskeeper|gardener|mover/))
    return 'Other';
  if (
    text.match(/\bjanitor|custodian|housekeeper|cleaner|landscaper|groundskeeper|gardener|mover\b/)
  )
    return 'Other';
  // Driving/Transportation
  if (
    cat.match(
      /driver|courier|delivery|rideshare|uber|lyft|taxi|bus|truck|fleet|aviation|pilot|flight attendant|airport|marine|sailor|deckhand|fisherman|oil rig|miner/
    )
  )
    return 'Driving Jobs';
  if (
    text.match(
      /\bdriver|courier|delivery|rideshare|uber|lyft|taxi|bus|truck|fleet|aviation|pilot|flight attendant|airport|marine|sailor|deckhand|fisherman|oil rig|miner\b/
    )
  )
    return 'Driving Jobs';
  // Construction/Trades/Engineering
  if (
    cat.match(
      /construction|carpenter|electrician|plumber|hvac|roofer|painter|mason|glazier|ironworker|sheet metal|tile setter|concrete|paver|surveyor|architect|civil engineer|structural engineer|mechanical engineer|electrical engineer|chemical engineer|environmental engineer|biomedical engineer|aerospace engineer|nuclear engineer|petroleum engineer|geologist|meteorologist|biologist|chemist|physicist|mathematician|statistician|economist|anthropologist|archaeologist|historian|librarian|archivist|curator|museum/
    )
  )
    return 'Construction & Trades';
  if (
    text.match(
      /\bconstruction|carpenter|electrician|plumber|hvac|roofer|painter|mason|glazier|ironworker|sheet metal|tile setter|concrete|paver|surveyor|architect|civil engineer|structural engineer|mechanical engineer|electrical engineer|chemical engineer|environmental engineer|biomedical engineer|aerospace engineer|nuclear engineer|petroleum engineer|geologist|meteorologist|biologist|chemist|physicist|mathematician|statistician|economist|anthropologist|archaeologist|historian|librarian|archivist|curator|museum\b/
    )
  )
    return 'Construction & Trades';
  // Arts/Media/Entertainment
  if (
    cat.match(
      /art|music|theater|actor|director|producer|screenwriter|editor|publisher|journalist|reporter|photographer|videographer|animator|illustrator|graphic designer|fashion|model|stylist|makeup|hair|barber/
    )
  )
    return 'UX/UI & Design';
  if (
    text.match(
      /\bart|music|theater|actor|director|producer|screenwriter|editor|publisher|journalist|reporter|photographer|videographer|animator|illustrator|graphic designer|fashion|model|stylist|makeup|hair|barber\b/
    )
  )
    return 'UX/UI & Design';
  // Food/Beverage/Hospitality
  if (
    cat.match(
      /chef|cook|baker|butcher|brewer|winemaker|sommelier|bartender|waiter|server|host|hostess|busser|dishwasher|caterer|event planner|wedding planner|travel agent|tour guide|concierge|hotel|resort|casino|cruise|theme park|recreation|fitness|personal trainer|coach|athlete|referee|umpire|scout|agent|talent|casting|producer|director|stage manager|lighting|sound|set designer|costume designer|props|makeup artist|hair stylist|wardrobe|seamstress|tailor|cobbler|jeweler|watchmaker|optician|audiologist|speech pathologist|occupational health|safety|industrial hygienist|ergonomist|toxicologist|epidemiologist|public health|health educator|community health|social worker|counselor|therapist|psychologist|psychiatrist|substance abuse|addiction|rehabilitation|case manager|probation|parole|correctional officer|jailer|warden|bailiff|court clerk|judge|magistrate|mediator|arbitrator|notary|patent|trademark|copyright|intellectual property|compliance officer|risk manager|loss prevention|fraud|investigator|detective|inspector|auditor|quality control|quality assurance|qa|qc|test engineer|test technician|lab manager|research assistant|research scientist|principal investigator|postdoc|graduate student|teaching assistant|professor|lecturer|adjunct|dean|chancellor|provost|registrar|admissions|financial aid|bursar|student affairs|career counselor|academic advisor/
    )
  )
    return 'Catering & Food';
  if (
    text.match(
      /\bchef|cook|baker|butcher|brewer|winemaker|sommelier|bartender|waiter|server|host|hostess|busser|dishwasher|caterer|event planner|wedding planner|travel agent|tour guide|concierge|hotel|resort|casino|cruise|theme park|recreation|fitness|personal trainer|coach|athlete|referee|umpire|scout|agent|talent|casting|producer|director|stage manager|lighting|sound|set designer|costume designer|props|makeup artist|hair stylist|wardrobe|seamstress|tailor|cobbler|jeweler|watchmaker|optician|audiologist|speech pathologist|occupational health|safety|industrial hygienist|ergonomist|toxicologist|epidemiologist|public health|health educator|community health|social worker|counselor|therapist|psychologist|psychiatrist|substance abuse|addiction|rehabilitation|case manager|probation|parole|correctional officer|jailer|warden|bailiff|court clerk|judge|magistrate|mediator|arbitrator|notary|patent|trademark|copyright|intellectual property|compliance officer|risk manager|loss prevention|fraud|investigator|detective|inspector|auditor|quality control|quality assurance|qa|qc|test engineer|test technician|lab manager|research assistant|research scientist|principal investigator|postdoc|graduate student|teaching assistant|professor|lecturer|adjunct|dean|chancellor|provost|registrar|admissions|financial aid|bursar|student affairs|career counselor|academic advisor\b/
    )
  )
    return 'Catering & Food';

  // --- Existing rules (fallbacks) ---
  // Healthcare & Nursing
  if (
    cat.includes('healthcare') ||
    cat.includes('nursing') ||
    cat.includes('nurse') ||
    cat.includes('therapy') ||
    cat.includes('medical') ||
    cat.includes('hospital')
  )
    return 'Healthcare & Nursing Jobs';
  // Catering & Food
  if (
    cat.includes('food') ||
    cat.includes('catering') ||
    cat.includes('chef') ||
    cat.includes('cook') ||
    cat.includes('restaurant')
  )
    return 'Catering & Food';
  // Sales
  if (
    cat.includes('sales') ||
    cat.includes('account manager') ||
    cat.includes('business development')
  )
    return 'Sales';
  // Construction & Trades
  if (
    cat.includes('construction') ||
    cat.includes('trades') ||
    cat.includes('electrician') ||
    cat.includes('plumber') ||
    cat.includes('carpenter')
  )
    return 'Construction & Trades';
  // Teaching
  if (
    cat.includes('teaching') ||
    cat.includes('teacher') ||
    cat.includes('education') ||
    cat.includes('tutor') ||
    cat.includes('school')
  )
    return 'Teaching jobs';
  // Driving
  if (
    cat.includes('driving') ||
    cat.includes('driver') ||
    cat.includes('truck') ||
    cat.includes('delivery')
  )
    return 'Driving Jobs';
  // Copywriting/Writing
  if (
    cat.includes('copywriting') ||
    cat.includes('writing') ||
    cat.includes('writer') ||
    cat.includes('editor') ||
    cat.includes('publishing')
  )
    return 'Copywriting';
  // Design
  if (cat.includes('design') || cat.includes('ux') || cat.includes('ui') || cat.includes('graphic'))
    return 'UX/UI & Design';
  // Customer Service
  if (
    cat.includes('customer service') ||
    cat.includes('support') ||
    cat.includes('call center') ||
    cat.includes('virtual assistant') ||
    cat.includes('appointment setter')
  )
    return 'Customer Service';
  // Human Resources
  if (cat.includes('human resources') || cat.includes('hr')) return 'Other';
  // Finance / Legal
  if (
    cat.includes('finance') ||
    cat.includes('legal') ||
    cat.includes('accountant') ||
    cat.includes('lawyer') ||
    cat.includes('paralegal')
  )
    return 'Finance / Legal';
  // Web Dev / Tech
  if (
    cat.includes('developer') ||
    cat.includes('software') ||
    cat.includes('tech') ||
    cat.includes('it') ||
    cat.includes('programming') ||
    cat.includes('engineer')
  )
    return 'Web Dev / Tech';

  // --- Secondary mapping from title/description if category is unclear ---
  // Healthcare & Nursing
  if (text.match(/\bnurse|nursing|healthcare|therapy|medical|hospital|rn\b/))
    return 'Healthcare & Nursing Jobs';
  // Catering & Food
  if (text.match(/\bfood|catering|chef|cook|restaurant\b/)) return 'Catering & Food';
  // Sales
  if (text.match(/\bsales|account manager|business development\b/)) return 'Sales';
  // Construction & Trades
  if (text.match(/\bconstruction|trades|electrician|plumber|carpenter\b/))
    return 'Construction & Trades';
  // Teaching
  if (text.match(/\bteaching|teacher|education|tutor|school\b/)) return 'Teaching jobs';
  // Driving
  if (text.match(/\bdriving|driver|truck|delivery\b/)) return 'Driving Jobs';
  // Copywriting/Writing
  if (text.match(/\bcopywriting|writing|writer|editor|publishing\b/)) return 'Copywriting';
  // Design
  if (text.match(/\bdesign|ux|ui|graphic\b/)) return 'UX/UI & Design';
  // Customer Service
  if (text.match(/\bcustomer service|support|call center|virtual assistant|appointment setter\b/))
    return 'Customer Service';
  // Human Resources
  if (text.match(/\bhuman resources|\bhr\b/)) return 'Other';
  // Finance / Legal
  if (text.match(/\bfinance|legal|accountant|lawyer|paralegal\b/)) return 'Finance / Legal';
  // Web Dev / Tech
  if (text.match(/\bdeveloper|software|tech|it|programming|engineer\b/)) return 'Web Dev / Tech';

  // Fallback
  return 'Other';
}
