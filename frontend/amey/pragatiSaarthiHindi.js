/**
 * PRAKALP-DRISHTI — PRAGATI-SAARTHI Report-Specific Hindi Translation & Numeral Engine
 *
 * Dedicated to translating ALL content within the Pragati Saarthi Cabinet Report
 * into Rajbhasha Hindi with 100% fidelity:
 *  - Converts ASCII numerals (0-9) to Devanagari numerals (०-९) for amounts, percentages,
 *    dates, metrics, IDs, and indicators.
 *  - Translates project titles, sectors, states, agencies, units, and technical acronyms.
 *  - Ensures NO English words or numerals are left behind in the report view.
 */

const HINDI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

/**
 * Converts all English digits in a string or number to Devanagari numerals.
 */
export function toHindiDigits(input) {
  if (input === null || input === undefined) return '';
  return String(input).replace(/[0-9]/g, (d) => HINDI_DIGITS[Number(d)]);
}

/**
 * Format timestamp (e.g. "2026-09-26 13:45:24 IST") into Hindi digits & timezone.
 */
export function formatHindiTimestamp(ts) {
  if (!ts) return '';
  let str = String(ts);
  str = str.replace(/\bIST\b/g, 'भारतीय मानक समय');
  return toHindiDigits(str);
}

/**
 * Fact ID translation for Drawer (e.g. fact_cost_701126 -> तथ्य_लागत_७०११२६)
 */
export function translateFactId(id) {
  if (!id) return '';
  let str = String(id);
  str = str.replace(/^fact_cost_?/i, 'तथ्य_लागत_');
  str = str.replace(/^fact_progress_?/i, 'तथ्य_प्रगति_');
  str = str.replace(/^fact_overrun_?/i, 'तथ्य_अतिव्यय_');
  str = str.replace(/^fact_p50_completion_?/i, 'तथ्य_पी५०_पूर्णता_');
  str = str.replace(/^fact_target_prob_?/i, 'तथ्य_लक्षित_संभावना_');
  str = str.replace(/^fact_vitta_alloc_?/i, 'तथ्य_वित्त_आवंटन_');
  str = str.replace(/^fact_/i, 'तथ्य_');
  return toHindiDigits(str);
}

/**
 * Fact label dictionary for audit tokens.
 */
const FACT_LABEL_MAP = {
  'Sanctioned Capex (Latest Revised)': 'स्वीकृत पूंजीगत व्यय (नवीनतम संशोधित)',
  'Physical Progress (MoSPI Ground Audit)': 'भौतिक प्रगति (एमओएसपीआई स्थलीय लेखापरीक्षा)',
  'True Capex Overrun vs DPR': 'डीपीआर की तुलना में वास्तविक पूंजीगत अतिव्यय',
  'KAAL-CHAKRA P50 Expected Completion Date': 'काल-चक्र पी५० प्रत्याशित पूर्णता तिथि',
  'Confidence of Meeting Contractor Target Date': 'ठेकेदार लक्षित तिथि तक पूर्णता का विश्वास',
  'Optimized National Allocation (Stochastic LP, CVaR90)': 'अनुकूलित राष्ट्रीय आवंटन (स्टोकेस्टिक एलपी, सीवीएआर९०)',
};

export function translateFactLabel(label, lang = 'en') {
  if (!label || lang !== 'hi') return label;
  if (FACT_LABEL_MAP[label]) return FACT_LABEL_MAP[label];
  return translateReportText(label, 'hi');
}

/**
 * Translates and formats dynamic fact values (currency, percentages, dates, numbers) to Hindi.
 */
export function translateFactValue(val, lang = 'en') {
  if (!val || lang !== 'hi') return val;
  let str = String(val);

  // Month names
  const months = [
    [/January/gi, 'जनवरी'], [/Jan/gi, 'जनवरी'],
    [/February/gi, 'फ़रवरी'], [/Feb/gi, 'फ़रवरी'],
    [/March/gi, 'मार्च'], [/Mar/gi, 'मार्च'],
    [/April/gi, 'अप्रैल'], [/Apr/gi, 'अप्रैल'],
    [/May/gi, 'मई'],
    [/June/gi, 'जून'], [/Jun/gi, 'जून'],
    [/July/gi, 'जुलाई'], [/Jul/gi, 'जुलाई'],
    [/August/gi, 'अगस्त'], [/Aug/gi, 'अगस्त'],
    [/September/gi, 'सितंबर'], [/Sept/gi, 'सितंबर'], [/Sep/gi, 'सितंबर'],
    [/October/gi, 'अक्टूबर'], [/Oct/gi, 'अक्टूबर'],
    [/November/gi, 'नवंबर'], [/Nov/gi, 'नवंबर'],
    [/December/gi, 'दिसंबर'], [/Dec/gi, 'दिसंबर'],
  ];
  for (const [pattern, repl] of months) {
    str = str.replace(pattern, repl);
  }

  // Currency / Unit
  str = str.replace(/\bCr\.?\b/gi, 'करोड़');
  str = str.replace(/\bCrore\b/gi, 'करोड़');
  str = str.replace(/\bINR\b/gi, 'रुपये');
  str = str.replace(/\bLakh\b/gi, 'लाख');

  // Convert digits to Devanagari
  return toHindiDigits(str);
}

/**
 * Agency mapping to Rajbhasha Hindi.
 */
const AGENCY_MAP = {
  'AAI': 'भारतीय विमानपत्तन प्राधिकरण (एएआई)',
  'NHAI': 'भारतीय राष्ट्रीय राजमार्ग प्राधिकरण (एनएचएआई)',
  'RVNL': 'रेल विकास निगम लिमिटेड (आरवीएनएल)',
  'NTPC': 'एनटीपीसी',
  'PGCIL': 'पावरग्रिड (पीजीसीआईएल)',
  'POWERGRID': 'पावरग्रिड',
  'BHEL': 'भेल',
  'IOCL': 'इंडियन ऑयल (आईओसीएल)',
  'ONGC': 'ओएनजीसी',
  'GAIL': 'गेल',
  'DFCCIL': 'डीएफसीसीआईएल',
  'NCRTC': 'एनसीआरटीसी',
  'NHPC': 'एनएचपीसी',
  'SJVN': 'एसजेवीएन',
  'IRCON': 'इरकॉन',
  'BRO': 'सीमा सड़क संगठन (बीआरओ)',
  'DMRC': 'दिल्ली मेट्रो (डीएमआरसी)',
  'CIL': 'कोल इंडिया',
  'BPCL': 'बीपीसीएल',
  'HPCL': 'एचपीसीएल',
  'OIL': 'ऑयल इंडिया',
  'MRVC': 'मुंबई रेलवे विकास कॉर्पोरेशन',
  'KRCL': 'कोंकण रेलवे कॉर्पोरेशन',
  'National': 'राष्ट्रीय',
  'MoF': 'वित्त मंत्रालय (MoF)',
  'Ministry of DoNER / MoSPI': 'पूर्वोत्तर क्षेत्र विकास मंत्रालय (DoNER) / एमओएसपीआई',
  'Ministry of DoNER': 'पूर्वोत्तर क्षेत्र विकास मंत्रालय (DoNER)',
  'ISRO / MoSPI Earth Observation Cell': 'इसरो / एमओएसपीआई पृथ्वी अवलोकन प्रकोष्ठ',
  'ISRO': 'इसरो',
  'MoSPI': 'एमओएसपीआई',
  'GUJARAT_METRO_RAIL_CORPORATION': 'गुजरात मेट्रो रेल निगम',
  'DELHI_METRO_RAIL_CORPORATION': 'दिल्ली मेट्रो रेल निगम',
  'MUMBAI_METRO_RAIL_CORPORATION': 'मुंबई मेट्रो रेल निगम',
  'MAHARASHTRA_METRO_RAIL_CORPORATION': 'महाराष्ट्र मेट्रो रेल निगम',
  'CHENNAI_METRO_RAIL_LIMITED': 'चेन्नई मेट्रो रेल लिमिटेड',
  'BANGALORE_METRO_RAIL_CORPORATION': 'बैंगलोर मेट्रो रेल निगम',
  'KOLKATA_METRO_RAIL_CORPORATION': 'कोलकाता मेट्रो रेल निगम',
};

export function translateAgencyName(agency, lang = 'en') {
  if (!agency || lang !== 'hi') return agency;
  if (AGENCY_MAP[agency]) return AGENCY_MAP[agency];
  return translateReportText(agency, 'hi');
}

/**
 * Common words dictionary for converting tokens and abbreviations.
 */
const COMMON_WORDS_MAP = {
  'GUJARAT': 'गुजरात', 'MAHARASHTRA': 'महाराष्ट्र', 'DELHI': 'दिल्ली', 'KARNATAKA': 'कर्नाटक',
  'TAMIL': 'तमिल', 'NADU': 'नाडु', 'BENGAL': 'बंगाल', 'KERALA': 'केरल', 'BIHAR': 'बिहार',
  'UTTAR': 'उत्तर', 'PRADESH': 'प्रदेश', 'MADHYA': 'मध्य', 'ANDHRA': 'आंध्र', 'RAJASTHAN': 'राजस्थान',
  'PUNJAB': 'पंजाब', 'HARYANA': 'हरियाणा', 'ODISHA': 'ओडिशा', 'ASSAM': 'असम', 'JHARKHAND': 'झारखंड',
  'METRO': 'मेट्रो', 'RAIL': 'रेल', 'CORPORATION': 'निगम', 'CORP': 'निगम',
  'LIMITED': 'लिमिटेड', 'LTD': 'लिमिटेड', 'PVT': 'प्राइवेट', 'PRIVATE': 'प्राइवेट',
  'AUTHORITY': 'प्राधिकरण', 'BOARD': 'बोर्ड', 'COMMISSION': 'आयोग', 'MINISTRY': 'मंत्रालय',
  'DEPARTMENT': 'विभाग', 'DIVISION': 'प्रभाग', 'GOVERNMENT': 'सरकार', 'GOVT': 'सरकार',
  'URBAN': 'शहरी', 'PUBLIC': 'सार्वजनिक', 'TRANSPORT': 'परिवहन',
  'I': '१', 'II': '२', 'III': '३', 'IV': '४', 'V': '५', 'VI': '६', 'VII': '७', 'VIII': '८', 'IX': '९', 'X': '१०',
};

/**
 * Phonetic transliterator fallback for any remaining English word.
 */
const PHONETIC_MAP = [
  ['tion', 'शन'], ['sion', 'शन'], ['cial', 'शियल'], ['tial', 'शियल'],
  ['kh', 'ख'], ['gh', 'घ'], ['ch', 'च'], ['chh', 'छ'], ['jh', 'झ'],
  ['th', 'थ'], ['dh', 'ध'], ['ph', 'फ'], ['bh', 'भ'], ['sh', 'श'],
  ['shh', 'ष'], ['wh', 'व'], ['ck', 'क'], ['ng', 'ंग'], ['qu', 'क्व'],
  ['ee', 'ी'], ['oo', 'ू'], ['ai', 'ऐ'], ['au', 'औ'], ['ou', 'ौ'],
  ['ea', 'ी'], ['oa', 'ो'], ['ay', 'े'], ['ey', 'े'],
  ['a', 'ा'], ['b', 'ब'], ['c', 'क'], ['d', 'द'], ['e', 'े'],
  ['f', 'फ'], ['g', 'ग'], ['h', 'ह'], ['i', 'ि'], ['j', 'ज'],
  ['k', 'क'], ['l', 'ल'], ['m', 'म'], ['n', 'न'], ['o', 'ो'],
  ['p', 'प'], ['q', 'क'], ['r', 'र'], ['s', 'स'], ['t', 'ट'],
  ['u', 'ु'], ['v', 'व'], ['w', 'व'], ['x', 'क्स'], ['y', 'य'], ['z', 'ज़']
];

function transliterateWord(word) {
  let lower = word.toLowerCase();
  for (const [en, hi] of PHONETIC_MAP) {
    lower = lower.split(en).join(hi);
  }
  // If first character is a dependent vowel matra, replace with independent vowel
  if (lower.startsWith('ा')) lower = 'आ' + lower.slice(1);
  else if (lower.startsWith('ि') || lower.startsWith('ी')) lower = 'ई' + lower.slice(1);
  else if (lower.startsWith('ु') || lower.startsWith('ू')) lower = 'उ' + lower.slice(1);
  else if (lower.startsWith('े')) lower = 'ए' + lower.slice(1);
  else if (lower.startsWith('ो')) lower = 'ओ' + lower.slice(1);
  return lower;
}

/**
 * Comprehensive phrase & keyword dictionary for report text translation.
 */
const PHRASE_REPLACEMENTS = [
  // Full project names & metro packages
  ['Ahmedabad Metro Rail Project [Phase-I]', 'अहमदाबाद मेट्रो रेल परियोजना [चरण-१]'],
  ['Ahmedabad Metro Rail Project', 'अहमदाबाद मेट्रो रेल परियोजना'],
  ['Development of Dholera International Greenfield Airport , Gujarat', 'धोलेरा अंतर्राष्ट्रीय ग्रीनफील्ड हवाई अड्डा विकास, गुजरात'],
  ['Development of Dholera International Greenfield Airport, Gujarat', 'धोलेरा अंतर्राष्ट्रीय Greenfield हवाई अड्डा विकास, गुजरात'],
  ['Development of Dholera International Greenfield Airport', 'धोलेरा अंतर्राष्ट्रीय ग्रीनफील्ड हवाई अड्डा विकास'],
  ['Dholera International Greenfield Airport , Gujarat', 'धोलेरा अंतर्राष्ट्रीय ग्रीनफील्ड हवाई अड्डा, गुजरात'],
  ['Dholera International Greenfield Airport', 'धोलेरा अंतर्राष्ट्रीय ग्रीनफील्ड हवाई अड्डा'],

  // Entities & PSUs
  ['GUJARAT_METRO_RAIL_CORPORATION', 'गुजरात मेट्रो रेल निगम'],
  ['DELHI_METRO_RAIL_CORPORATION', 'दिल्ली मेट्रो रेल निगम'],
  ['MUMBAI_METRO_RAIL_CORPORATION', 'मुंबई मेट्रो रेल निगम'],
  ['MAHARASHTRA_METRO_RAIL_CORPORATION', 'महाराष्ट्र मेट्रो रेल निगम'],
  ['CHENNAI_METRO_RAIL_LIMITED', 'चेन्नई मेट्रो रेल लिमिटेड'],
  ['BANGALORE_METRO_RAIL_CORPORATION', 'बैंगलोर मेट्रो रेल निगम'],
  ['KOLKATA_METRO_RAIL_CORPORATION', 'कोलकाता मेट्रो रेल निगम'],

  // Sectors
  ['Urban Public Transport', 'शहरी सार्वजनिक परिवहन'],
  ['Public Transport', 'सार्वजनिक परिवहन'],
  ['Urban Transport', 'शहरी परिवहन'],
  ['Aviation & Aviation Infrastructure', 'नागर विमानन एवं विमानन अवसंरचना'],
  ['Civil Aviation', 'नागर विमानन'],
  ['Road Transport and Highways', 'सड़क परिवहन एवं राजमार्ग'],
  ['Road Transport & Highways', 'सड़क परिवहन एवं राजमार्ग'],
  ['Railways', 'रेलवे'],
  ['Power', 'विद्युत'],
  ['Petroleum', 'पेट्रोलियम'],
  ['Coal', 'कोयला'],
  ['Shipping', 'पोत परिवहन'],
  ['Ports and Shipping', 'पत्तन एवं पोत परिवहन'],
  ['Steel', 'इस्पात'],
  ['Urban Development', 'शहरी विकास'],
  ['Water Resources', 'जल संसाधन'],
  ['Atomic Energy', 'परमाणु ऊर्जा'],
  ['Not specified', 'अनिर्दिष्ट'],
  ['Unspecified', 'अनिर्दिष्ट'],
  ['Not Specified', 'अनिर्दिष्ट'],

  // Project keywords
  ['Metro Rail Project', 'मेट्रो रेल परियोजना'],
  ['Metro Rail', 'मेट्रो रेल'],
  ['High Speed Rail', 'हाई स्पीड रेल'],
  ['Freight Corridor', 'माल ढुलाई गलियारा'],
  ['Expressway', 'एक्सप्रेसवे'],
  ['National Highway', 'राष्ट्रीय राजमार्ग'],
  ['Multipurpose Project', 'बहुउद्देशीय परियोजना'],
  ['Irrigation Project', 'सिंचाई परियोजना'],
  ['Thermal Power Project', 'थर्मल पावर परियोजना'],
  ['Hydro Electric Project', 'जलविद्युत परियोजना'],
  ['Solar Power Project', 'सौर ऊर्जा परियोजना'],
  ['Solar Park', 'सौर पार्क'],

  // Phases and Stages with Roman Numerals
  ['[Phase-I]', '[चरण-१]'],
  ['[Phase-II]', '[चरण-२]'],
  ['[Phase-III]', '[चरण-३]'],
  ['[Phase-IV]', '[चरण-४]'],
  ['[Phase-V]', '[चरण-५]'],
  ['Phase-I', 'चरण-१'],
  ['Phase-II', 'चरण-२'],
  ['Phase-III', 'चरण-३'],
  ['Phase-IV', 'चरण-४'],
  ['Phase-V', 'चरण-५'],
  ['Stage-I', 'चरण-१'],
  ['Stage-II', 'चरण-२'],
  ['Stage-III', 'चरण-३'],
  ['Stage-IV', 'चरण-४'],
  ['Package-I', 'पैकेज-१'],
  ['Package-II', 'पैकेज-२'],
  ['Package-III', 'पैकेज-३'],

  // Infrastructure works
  ['Construction of New Integrated Terminal Building', 'नए एकीकृत टर्मिनल भवन का निर्माण'],
  ['Construction of New Domestic Terminal Building', 'नए घरेलू टर्मिनल भवन का निर्माण'],
  ['Construction of New Passenger Terminal Building', 'नए यात्री टर्मिनल भवन का निर्माण'],
  ['Construction of New Terminal Building', 'नए टर्मिनल भवन का निर्माण'],
  ['Construction of Terminal Building', 'टर्मिनल भवन का निर्माण'],
  ['Construction of NTB complex', 'नए टर्मिनल भवन (एनटीबी) परिसर का निर्माण'],
  ['Construction of New', 'नए निर्माण:'],
  ['Construction of', 'निर्माण:'],
  ['Development of', 'विकास:'],
  ['C/o', 'निर्माण:'],

  // Aviation
  ['Domestic Operations', 'घरेलू परिचालन'],
  ['Passenger Terminal Building', 'यात्री टर्मिनल भवन'],
  ['Terminal Building', 'टर्मिनल भवन'],
  ['Domestic Terminal', 'घरेलू टर्मिनल'],
  ['International Greenfield Airport', 'अंतर्राष्ट्रीय ग्रीनफील्ड हवाई अड्डा'],
  ['Greenfield Airport', 'ग्रीनफील्ड हवाई अड्डा'],
  ['Greenfield', 'ग्रीनफील्ड'],
  ['International Airport', 'अंतर्राष्ट्रीय हवाई अड्डा'],
  ['Airport', 'हवाई अड्डा'],
  ['Runway', 'रनवे'],
  ['Apron Expansion', 'एप्रन विस्तार'],
  ['Apron', 'एप्रन'],
  ['Second Link Taxi Track', 'द्वितीय लिंक टैक्सी ट्रैक'],
  ['Taxi Track', 'टैक्सी ट्रैक'],
  ['Taxiway', 'टैक्सीवे'],
  ['On Design & Build Basis', 'डिज़ाइन एवं निर्माण आधार पर'],
  ['Miscellaneous Works', 'विविध कार्य'],
  ['Miscellaneous works', 'विविध कार्य'],
  ['allied structures', 'संबद्ध संरचनाएं'],

  // Cities
  ['Ahmedabad', 'अहमदाबाद'],
  ['Mumbai', 'मुंबई'],
  ['Delhi', 'दिल्ली'],
  ['Kolkata', 'कोलकाता'],
  ['Chennai', 'चेन्नई'],
  ['Bengaluru', 'बेंगलुरु'],
  ['Hyderabad', 'हैदराबाद'],
  ['Pune', 'पुणे'],
  ['Surat', 'सूरत'],
  ['Jaipur', 'जयपुर'],
  ['Lucknow', 'लखनऊ'],
  ['Kanpur', 'कानपुर'],
  ['Nagpur', 'नागपुर'],
  ['Indore', 'इंदौर'],
  ['Thane', 'ठाणे'],
  ['Bhopal', 'भोपाल'],
  ['Visakhapatnam', 'विशाखापट्टनम'],
  ['Vadodara', 'वडोदरा'],
  ['Dholera', 'धोलेरा'],
  ['Patna', 'पटना'],
  ['Rajahmundry', 'राजमुंदरी'],
  ['Belagavi', 'बेलगावी'],
  ['Hubli', 'हुबली'],
  ['Kadapa', 'कडपा'],
  ['Udaipur', 'उदयपुर'],
  ['Vijayawada', 'विजयवाड़ा'],
  ['Jodhpur', 'जोधपुर'],
  ['Prayagraj', 'प्रयागराज'],
  ['CA Jammu', 'सीए जम्मू'],
  ['Jammu', 'जम्मू'],
  ['Leh', 'लेह'],
  ['Calicut', 'कालीकट'],
  ['Keshod', 'केशोद'],
  ['Imphal', 'इम्फाल'],

  // States
  ['Gujarat', 'गुजरात'],
  ['Maharashtra', 'महाराष्ट्र'],
  ['Bihar', 'बिहार'],
  ['Andhra Pradesh', 'आंध्र प्रदेश'],
  ['Karnataka', 'कर्नाटक'],
  ['Rajasthan', 'राजस्थान'],
  ['Uttar Pradesh', 'उत्तर प्रदेश'],
  ['Jammu & Kashmir', 'जम्मू एवं कश्मीर'],
  ['Jammu and Kashmir', 'जम्मू एवं कश्मीर'],
  ['Ladakh', 'लद्दाख'],
  ['Kerala', 'केरल'],
  ['Manipur', 'मणिपुर'],
  ['Assam', 'असम'],
  ['West Bengal', 'पश्चिम बंगाल'],
  ['Odisha', 'ओडिशा'],
  ['Jharkhand', 'झारखंड'],
  ['Madhya Pradesh', 'मध्य प्रदेश'],
  ['Tamil Nadu', 'तमिलनाडु'],
  ['Telangana', 'तेलंगाना'],
  ['Punjab', 'पंजाब'],
  ['Haryana', 'हरियाणा'],
  ['Himachal Pradesh', 'हिमाचल प्रदेश'],
  ['Uttarakhand', 'उत्तराखंड'],
  ['Chhattisgarh', 'छत्तीसगढ़'],
  ['Goa', 'गोवा'],
  ['Tripura', 'त्रिपुरा'],
  ['Meghalaya', 'मेघालय'],
  ['Mizoram', 'मिजोरम'],
  ['Nagaland', 'नागालैंड'],
  ['Arunachal Pradesh', 'अरुणाचल प्रदेश'],
  ['Sikkim', 'सिक्किम'],

  // Technical Acronyms
  ['(KAAL-CHAKRA)', ''],
  ['KAAL-CHAKRA', 'काल-चक्र'],
  ['(SETU-GRAPH)', ''],
  ['SETU-GRAPH', 'सेतु-ग्राफ'],
  ['SETU-VARSHA', 'सेतु-वर्षा'],
  ['VITTA-VYUHA', 'वित्त-व्यूह'],
  ['PRAGATI-SAARTHI', 'प्रगति-सारथी'],
  ['MoSPI', 'एमओएसपीआई'],
  ['PMO', 'पीएमओ'],
  ['IST', 'भारतीय मानक समय'],
  ['(P10)', '(पी१०)'],
  ['P10', 'पी१०'],
  ['(P50)', '(पी५०)'],
  ['P50', 'पी५०'],
  ['(P95)', '(पी९५)'],
  ['P95', 'पी९५'],
  ['DPR', 'डीपीआर'],
  ['AFT', 'एएफटी'],
  ['CQR', 'सीक्यूआर'],
  ['CVaR90', 'सीवीएआर९०'],
  ['HiGHS', 'हाईजीएचएस'],
  ['NER', 'पूर्वोत्तर क्षेत्र'],
  ['DoNER', 'डोनर'],
  ['ISRO', 'इसरो'],
  ['AAI', 'भारतीय विमानपत्तन प्राधिकरण (एएआई)'],
  ['NHAI', 'भारतीय राष्ट्रीय राजमार्ग प्राधिकरण (एनएचएआई)'],
  ['RVNL', 'रेल विकास निगम लिमिटेड (आरवीएनएल)'],
  ['NTPC', 'एनटीपीसी'],
  ['National', 'राष्ट्रीय'],
  ['MoF', 'वित्त मंत्रालय (MoF)'],
  ['Ministry of DoNER / MoSPI', 'पूर्वोत्तर क्षेत्र विकास मंत्रालय (DoNER) / एमओएसपीआई'],
  ['ISRO / MoSPI Earth Observation Cell', 'इसरो / एमओएसपीआई पृथ्वी अवलोकन प्रकोष्ठ'],

  // Directives & Actions
  ['Mandate Stage-Gate Review for Critical Delay Acceleration', 'गंभीर विलंब निवारण हेतु चरण-वार समीक्षा अनिवार्य करें'],
  ['Ring-Fence 10% Capex Allocation under NER Statutory Rule', 'पूर्वोत्तर क्षेत्र वैधानिक नियम के तहत १०% पूंजीगत आवंटन सुरक्षित करें'],
  ['Deploy Dual-Epoch Satellite Corroboration on Discrepant Milestones', 'विसंगतिपूर्ण कार्य प्रगति पर द्वि-कालिक उपग्रह सत्यापन तैनात करें'],
  ['HIGH PRIORITY', 'उच्च प्राथमिकता'],
  ['MEDIUM PRIORITY', 'मध्यम प्राथमिकता'],
  ['LOW PRIORITY', 'निम्न प्राथमिकता'],
  ['HIGH', 'उच्च'],
  ['MEDIUM', 'मध्यम'],
  ['LOW', 'निम्न'],
  ['PRIORITY', 'प्राथमिकता'],

  // Section Headers
  ['1. Probabilistic Survival & Target Date Confidence', '१. संभाव्य समय-सीमा एवं लक्षित पूर्णता विश्वास'],
  ['2. Systemic Supply-Chain Contagion & Float Analysis', '२. प्रणालीगत आपूर्ति-श्रृंखला प्रभाव एवं फ्लोट विश्लेषण'],
  ['3. VITTA-VYUHA Capital Allocation & Shadow Price Duals', '३. वित्त-व्यूह पूंजी आवंटन एवं छाया मूल्य (द्वैत)'],

  // Currencies, Units & Sentences
  ['Crore INR', 'करोड़ रुपये'],
  ['Crores INR', 'करोड़ रुपये'],
  ['INR Cr', 'करोड़ रुपये'],
  ['Cr INR', 'करोड़ रुपये'],
  ['Cr', 'करोड़'],
  ['Crore', 'करोड़'],
  ['Crores', 'करोड़'],
  ['INR', 'रुपये'],
  ['Lakh', 'लाख'],
  ['Lakhs', 'लाख'],
  ['connected nodes', 'संबद्ध घटक'],
  ['connected node', 'संबद्ध घटक'],
  ['nodes', 'घटक'],
  ['node', 'घटक'],
  ['months', 'माह'],
  ['month', 'माह'],
  ['years', 'वर्ष'],
  ['year', 'वर्ष'],
  ['days', 'दिन'],
  ['day', 'दिन'],
  ['(Closure Error)', '(संवृत त्रुटि)'],
  ['Closure Error', 'संवृत त्रुटि'],
  ['π(Budget)', 'π(बजट)'],
  ['(Well within <5% research threshold)', '(<५% शोध सीमा के अंतर्गत)'],
  ['Well within <5% research threshold', '<५% शोध सीमा के अंतर्गत'],
  ['research threshold', 'शोध सीमा'],
  ['Review of', 'समीक्षा:'],
  ['executed by', 'क्रियान्वित:'],
  ['Total sanctioned capex is', 'कुल स्वीकृत पूंजीगत व्यय:'],
  ['survival analysis estimates', 'उत्तरजीविता विश्लेषण के अनुसार'],
  ['completion by', 'तक पूर्णता:'],
  ['with only a', 'तथा पूर्ण होने की संभावना मात्र'],
  ['probability of meeting the official contractor target date', 'आधिकारिक लक्षित तिथि तक पूर्ण होने की संभावना मात्र'],
  ['Upstream supply-chain dependency cascade locks', 'आपूर्ति-श्रृंखला निर्भरता विश्लेषण के तहत अवरुद्ध पूंजी:'],
  ['across', 'कुल संबद्ध'],
  ['Official Contractor Target:', 'आधिकारिक लक्षित तिथि:'],
  ['KAAL-CHAKRA Projected Quantiles:', 'काल-चक्र प्रक्षेपित शतमक:'],
  ['Rebaselining Detection:', 'पुनर्निर्धारण पहचान:'],
  ['Baseline reset count =', 'आधारभूत पुनरावृत्ति संख्या ='],
  ['Total Connected Network Nodes:', 'कुल संबद्ध नेटवर्क घटक:'],
  ['Active Float-Absorbed Delays:', 'सक्रिय फ्लोट-अवशोषित विलंब:'],
  ['Delays within free float are absorbed without downstream penalty.', 'फ्री-फ्लोट के भीतर होने वाले विलंब अग्रगामी परियोजनाओं को प्रभावित किए बिना अवशोषित होते हैं।'],
  ['Total Systemic Locked Capital:', 'कुल प्रणालीगत अवरुद्ध पूंजी:'],
  ['Allocated Capex:', 'आवंटित पूंजीगत व्यय:'],
  ['out of', 'में से'],
  ['pool.', 'पूल।'],
  ['Portfolio completion propensity:', 'पोर्टफोलियो पूर्णता प्रवृत्ति:'],
  ['priority index', 'प्राथमिकता सूचकांक'],
  ['Marginal Value of Budget Relaxation', 'अतिरिक्त बजट आवंटन का सीमांत प्रतिफल'],
  ['Linearization Closure Diagnostic:', 'रैखिक संवृत त्रुटि:'],
  ['Estimated Capital Safeguarded:', 'सुरक्षित अनुमानित पूंजी:'],
  ['PROJECT #', 'परियोजना #'],
  ['Project #', 'परियोजना #'],
  ['Metro', 'मेट्रो'],
  ['Rail', 'रेल'],
  ['Project', 'परियोजना'],
  ['Transport', 'परिवहन'],
  ['Public', 'सार्वजनिक'],
  ['Urban', 'शहरी'],
];

/**
 * Translates any sentence or string in the report to Hindi and converts all English digits to Devanagari.
 * Guarantees zero English words and zero English numerals remain.
 */
export function translateReportText(text, lang = 'en') {
  if (!text || lang !== 'hi') return text;
  let str = String(text);

  // 1. Month conversions
  const months = [
    [/\bJanuary\b/gi, 'जनवरी'], [/\bJan\b/gi, 'जनवरी'],
    [/\bFebruary\b/gi, 'फ़रवरी'], [/\bFeb\b/gi, 'फ़रवरी'],
    [/\bMarch\b/gi, 'मार्च'], [/\bMar\b/gi, 'मार्च'],
    [/\bApril\b/gi, 'अप्रैल'], [/\bApr\b/gi, 'अप्रैल'],
    [/\bMay\b/g, 'मई'],
    [/\bJune\b/gi, 'जून'], [/\bJun\b/gi, 'जून'],
    [/\bJuly\b/gi, 'जुलाई'], [/\bJul\b/gi, 'जुलाई'],
    [/\bAugust\b/gi, 'अगस्त'], [/\bAug\b/gi, 'अगस्त'],
    [/\bSeptember\b/gi, 'सितंबर'], [/\bSept\b/gi, 'सितंबर'], [/\bSep\b/gi, 'सितंबर'],
    [/\bOctober\b/gi, 'अक्टूबर'], [/\bOct\b/gi, 'अक्टूबर'],
    [/\bNovember\b/gi, 'नवंबर'], [/\bNov\b/gi, 'नवंबर'],
    [/\bDecember\b/gi, 'दिसंबर'], [/\bDec\b/gi, 'दिसंबर'],
  ];
  for (const [pattern, repl] of months) {
    str = str.replace(pattern, repl);
  }

  // 2. Phrase replacements
  for (const [eng, hin] of PHRASE_REPLACEMENTS) {
    if (str.includes(eng)) {
      str = str.split(eng).join(hin);
    }
  }

  // 3. Entity names with underscores (e.g. GUJARAT_METRO_RAIL_CORPORATION)
  if (str.includes('_')) {
    str = str.replace(/[A-Za-z0-9]+(?:_[A-Za-z0-9]+)+/g, (compound) => {
      const parts = compound.split('_');
      const translatedParts = parts.map((part) => {
        const u = part.toUpperCase();
        if (COMMON_WORDS_MAP[u]) return COMMON_WORDS_MAP[u];
        return transliterateWord(part);
      });
      return translatedParts.join(' ');
    });
  }

  // 4. Any remaining English words/tokens
  str = str.replace(/[A-Za-z]+/g, (token) => {
    const u = token.toUpperCase();
    if (COMMON_WORDS_MAP[u]) return COMMON_WORDS_MAP[u];
    if (AGENCY_MAP[token] || AGENCY_MAP[u]) return AGENCY_MAP[token] || AGENCY_MAP[u];
    return transliterateWord(token);
  });

  // Clean redundant whitespace and double brackets
  str = str.replace(/\(\s*\)/g, '').trim();

  // 5. Convert all digits to Devanagari numerals
  return toHindiDigits(str);
}

/**
 * Slide-out Drawer localized text dictionary
 */
export const DRAWER_I18N = {
  en: {
    title: 'Data Source & Audit Proof',
    metricId: 'Metric ID:',
    verifiedDb: 'Verified Against Official Database',
    verificationDetails: 'Source Verification Details',
    queryHash: 'Query Verification Hash',
    datasetFingerprint: 'Dataset Snapshot Fingerprint',
    proofPath: 'Step-by-Step Proof Path',
    leafRecord: 'Verified Leaf Record (No Parent Hops)',
    securityKey: 'Audit Security Key',
    tamperTestTitle: 'Real-Time Cryptographic Merkle Verification Test',
    liveVerification: 'Live Verification',
    tamperPrompt: 'Try modifying the number below to test if the system automatically catches and rejects fake or edited data:',
    inputLabel: 'Enter Value to Test',
    validateBtn: 'Validate Lineage Hash',
    statusChecking: 'Checking proof against official database record...',
    statusAuthentic: 'AUTHENTIC RECORD: Value perfectly matches official verified database records.',
    statusTampered: (entered, audited) => `FAKE DATA DETECTED: Entered "${entered}" does not match audited value "${audited}". Edit rejected immediately!`,
    statusFailed: 'VERIFICATION FAILED: Source proof did not validate on the server.',
    statusError: (msg) => `Verification check error: ${msg}. Ensure backend is running.`,
    closeBtn: 'Close Drawer',
  },
  hi: {
    title: 'डेटा स्रोत एवं लेखापरीक्षा साक्ष्य',
    metricId: 'मीट्रिक पहचान:',
    verifiedDb: 'आधिकारिक डेटाबेस से सत्यापित',
    verificationDetails: 'स्रोत सत्यापन विवरण',
    queryHash: 'क्वेरी सत्यापन हैश',
    datasetFingerprint: 'डेटासेट स्नैपशॉट फिंगरप्रिंट',
    proofPath: 'चरण-दर-चरण प्रमाण पथ',
    leafRecord: 'सत्यापित लीफ रिकॉर्ड (कोई पैरेंट हॉप्स नहीं)',
    securityKey: 'लेखापरीक्षा सुरक्षा कुंजी',
    tamperTestTitle: 'रीयल-टाइम क्रिप्टोग्राफिक मर्कल सत्यापन परीक्षण',
    liveVerification: 'प्रत्यक्ष सत्यापन',
    tamperPrompt: 'यह जाँचने के लिए नीचे दिए गए मान को बदलकर देखें कि क्या प्रणाली जाली अथवा संपादित डेटा को स्वतः अस्वीकार करती है:',
    inputLabel: 'परीक्षण हेतु मान दर्ज करें',
    validateBtn: 'वंशावली हैश सत्यापित करें',
    statusChecking: 'आधिकारिक डेटाबेस रिकॉर्ड के विरुद्ध प्रमाण की जाँच जारी है...',
    statusAuthentic: 'प्रमाणिक रिकॉर्ड: मान आधिकारिक सत्यापित डेटाबेस रिकॉर्ड से पूर्णतः मेल खाता है।',
    statusTampered: (entered, audited) => `जाली डेटा की पहचान: दर्ज किया गया मान "${toHindiDigits(entered)}" लेखापरीक्षित मान "${toHindiDigits(audited)}" से मेल नहीं खाता। संपादन तत्काल अस्वीकृत!`,
    statusFailed: 'सत्यापन विफल: सर्वर पर स्रोत प्रमाण सत्यापित नहीं हुआ।',
    statusError: (msg) => `सत्यापन त्रुटि: ${msg}। सुनिश्चित करें कि बैकएंड चालू है।`,
    closeBtn: 'विवरण बंद करें',
  },
};
