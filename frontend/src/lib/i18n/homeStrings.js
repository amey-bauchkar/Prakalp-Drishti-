/**
 * PRAKALP-DRISHTI — Bilingual Translations for Landing / Home Page (amey/index.jsx)
 * Supports all 5 landing slides and empirical model showcase cards in EN and HI.
 */

export const HOME_STRINGS = {
  en: {
    // ═══════════════════════════════════════════════════════════════
    // SLIDE 1: FRAMED SOVEREIGN BLUE HERO BOX
    // ═══════════════════════════════════════════════════════════════
    slide1_eyebrow_nip: 'National Infrastructure Pipeline',
    slide1_eyebrow_ccea: 'CCEA Sovereign Oversight',
    slide1_india_banner: 'भारत सरकार · Government of India',
    slide1_ministry_banner: 'सांख्यिकी एवं कार्यक्रम कार्यान्वयन मंत्रालय (MoSPI)',
    slide1_headline: "National Decision Intelligence for India's Infrastructure",
    slide1_subhead: 'PRAKALP-DRISHTI transforms national project monitoring from descriptive reporting into predictive, risk-aware decision intelligence for sovereign policymakers and project administrators.',
    slide1_btn_enter: 'Enter Decision Hub',
    slide1_btn_explore: 'Explore Analytical Engines',
    slide1_m1_label: 'Monitored Projects',
    slide1_m2_label: 'Sanctioned Portfolio Capex',
    slide1_m3_label: 'Infrastructure Sectors',
    slide1_m4_label: 'Central Ministries',

    // ═══════════════════════════════════════════════════════════════
    // SLIDE 2: NATIONAL MANDATE & STATUTORY GOVERNANCE
    // ═══════════════════════════════════════════════════════════════
    slide2_azadi: 'Azadi Ka Amrit Mahotsav',
    slide2_gatishakti_sub: 'PM GatiShakti National Master Plan Integration',
    slide2_lede_a: 'Predictive decision support across',
    slide2_lede_b: "anchored to MoSPI's April 2026 reporting, calibrated on a",
    slide2_paimana_title: 'Statutory PAIMANA Repository',
    slide2_paimana_sub: 'Active Monitoring: 2,043 Projects (≥ ₹150 Cr)',
    slide2_paimana_div: 'DIID / IPMD Division · MoSPI',
    slide2_directives_title: 'Statutory Directives & Rules',
    slide2_ccea_rule_title: 'CCEA 20% Rule',
    slide2_ccea_rule_desc: 'Mandatory Cabinet Committee approval for cost overruns ≥ 20%.',
    slide2_cpwd_title: 'CPWD Clause 10CC',
    slide2_cpwd_desc: 'Formula-driven statutory material and labor escalation caps.',
    slide2_pib_title: 'PIB Clearances',
    slide2_pib_desc: 'Public Investment Board revised cost estimate guidelines.',
    slide2_rti_title: 'RTI Section 4',
    slide2_rti_desc: 'Proactive public transparency layer for sovereign capital outlays.',
    slide2_standard_guidelines: 'Standard: MoSPI Flash Guidelines',
    slide2_location_delhi: 'New Delhi',
    slide2_auto_badge: 'Autonomous Oversight',
    slide2_auto_sub: 'Outcome-Aware ML Architecture',
    slide2_rigor_title: 'Transforming Infrastructure Delivery Through Mathematical Rigor & Causal Analytics',
    slide2_rigor_desc: 'PRAKALP-DRISHTI bridges the critical gap between raw administrative project reports and actionable executive policy. Active projects provide current-state telemetry, while historical completed projects provide ground-truth outcome labels — enabling robust Conformal Prediction without outcome-censoring bias.',
    slide2_corpus_active: 'Active Ongoing',
    slide2_corpus_completed: 'Completed Labels',
    slide2_corpus_master: 'Master Corpus',
    slide2_explore_models: 'Explore Core Mathematical Models',
    slide2_engines_count: '7 Connected Engines',

    // ═══════════════════════════════════════════════════════════════
    // SLIDE 3: FIVE ANALYTICAL ENGINES
    // ═══════════════════════════════════════════════════════════════
    slide3_eyebrow: 'Independent Analytical Engines',
    slide3_title: 'Seven Engines. One Cohesive Decision Architecture.',
    slide3_subhead: 'Every engine is built on published methods, verified on the 2,207-project MoSPI corpus, and bounded by statutory rules.',
    slide3_govt_gate: 'Govt Official Only',

    mod_satya_title: 'Contract Compliance Forensics',
    mod_satya_desc: 'McCrary (2008) density-discontinuity test at the 20% CCEA revision threshold, with a two-bin ratio reported beside it. Audits CPWD Clause 10CC escalation against the statutory formula.',
    mod_satya_finding: 'p = 0.68 at 20%',
    mod_satya_finding_label: 'No Density Discontinuity',

    mod_artha_title: 'PSU Financial Solvency',
    mod_artha_desc: 'Screens executing PSUs against compiled debt-to-equity and Altman Z reference figures, tagged indicative rather than audited. Agencies with no published balance sheet are returned UNRATED, not scored.',
    mod_artha_finding: 'D/E · Altman Z',
    mod_artha_finding_label: 'Indicative Solvency Tiers',

    mod_varsha_title: 'Monsoon Weather Impact',
    mod_varsha_desc: 'Working-window scenario model: per-state monsoon downtime and rainfall elasticity are declared expert parameters, applied to a 20-year IMD departure record. Not a fitted regression.',
    mod_varsha_finding: '±15% scenario',
    mod_varsha_finding_label: 'Working-Window Stretch',

    mod_nivaran_title: 'Contract & Legal Risk',
    mod_nivaran_desc: 'Rule-based screening of CPWD GCC clause language and contractor dispute history for arbitration exposure.',
    mod_nivaran_finding: 'Clause audit',
    mod_nivaran_finding_label: 'Dispute Exposure Screen',

    mod_anumati_title: 'Statutory Clearances (PARIVESH)',
    mod_anumati_desc: '5-stage PARIVESH clearance pipeline tracking with a Regulatory Stagnation Index per stage.',
    mod_anumati_finding: '5-stage RSI',
    mod_anumati_finding_label: 'Clearance Pipeline',

    // ═══════════════════════════════════════════════════════════════
    // SLIDE 4: EMPIRICAL FINDINGS & EXECUTIVE BULLETINS
    // ═══════════════════════════════════════════════════════════════
    slide4_featured_badge: 'Featured Empirical Finding',
    slide4_cluster_title: 'CCEA 20% Cost Revision Density Analysis',
    slide4_cluster_desc: '1.65× more revisions land in 18.0%–19.9% than in 20.0%–21.9%, just below the threshold that triggers mandatory Cabinet Committee review — 28 projects against 17. At that sample size the 95% confidence interval is [0.90, 3.01], which spans 1.0, so this is a screening signal for audit triage, not a significant finding and not an allegation.',
    slide4_inspect_btn: 'Inspect Full SATYA-KAVACH Compliance Report',
    slide4_ratio_label: 'Boundary Bin-Mass Ratio',
    slide4_ratio_note: 'not significant at 5% — triage signal',

    slide4_b1_tag: 'Cabinet Flash',
    slide4_b1_title: 'Quarterly CCEA Cost Overrun Threshold Audit Published',
    slide4_b1_desc: '2,207 central projects evaluated. 307 projects identified with cumulative cost escalation exceeding 20%, mandating revised administrative approval submission.',

    slide4_b2_tag: 'Solvency Alert',
    slide4_b2_title: 'PSU Financial Leverage & Altman Z-Score Advisory',
    slide4_b2_desc: 'Artha-Netra model flags 4 executing public sector enterprises experiencing interest coverage ratio compression below 1.5x, signalling potential execution slowdowns.',

    slide4_b3_tag: 'Weather Advisory',
    slide4_b3_title: 'IMD Monsoon Anomaly Stretch Projections for Linear Projects',
    slide4_b3_desc: 'Varsha-Speed regression estimates 2 to 5 months additional slippage for coastal highway and railway packages impacted by +22% monsoon precipitation anomaly.',

    // ═══════════════════════════════════════════════════════════════
    // SLIDE 5: DECISION HUB ENTRY & PARTNERS
    // ═══════════════════════════════════════════════════════════════
    slide5_badge: 'Interactive Simulation Hub',
    slide5_title: 'Enter the Sovereign Decision Intelligence Hub',
    slide5_desc: 'Run Monte Carlo timeline forecasts, calculate capital lockup graphs, rebalance budgets with linear programming, and inspect empirical model benchmarks across all 2,207 projects.',
    slide5_btn: 'Launch Interactive Hub',
    slide5_partners_title: 'National Infrastructure & Government Partners',

    // Backward compatibility legacy keys
    hero_badge: 'SOVEREIGN MEGA-PROJECT DECISION INTELLIGENCE',
    hero_title_1: 'Predictive Delay Forensics & Capital Reallocation',
    hero_title_2: 'for 2,207 Central Sector Infrastructure Projects',
    hero_desc: 'Prakalp-Drishti transitions national infrastructure monitoring from retrospective status reporting into proactive, mathematically verified decision intelligence. Built for MoSPI & Cabinet Committee on Economic Affairs (CCEA).',
    btn_enter_hub: 'Enter Decision Hub',
    btn_public_portal: 'Public Citizen Portal (RTI §4)',
  },

  hi: {
    // ═══════════════════════════════════════════════════════════════
    // SLIDE 1: FRAMED SOVEREIGN BLUE HERO BOX
    // ═══════════════════════════════════════════════════════════════
    slide1_eyebrow_nip: 'राष्ट्रीय अवसंरचना पाइपलाइन',
    slide1_eyebrow_ccea: 'सीसीईए संप्रभु निगरानी',
    slide1_india_banner: 'भारत सरकार · Government of India',
    slide1_ministry_banner: 'सांख्यिकी एवं कार्यक्रम कार्यान्वयन मंत्रालय (MoSPI)',
    slide1_headline: 'भारत की अवसंरचना के लिए राष्ट्रीय निर्णय आसूचना',
    slide1_subhead: 'प्रकल्प-दृष्टि राष्ट्रीय परियोजना निगरानी को वर्णनात्मक रिपोर्टिंग से संप्रभु नीति निर्माताओं एवं प्रशासकों हेतु पूर्वानुमानात्मक, जोखिम-जागरूक निर्णय आसूचना में बदलता है।',
    slide1_btn_enter: 'निर्णय हब में प्रवेश करें',
    slide1_btn_explore: 'विश्लेषणात्मक इंजन देखें',
    slide1_m1_label: 'निगरानी की जा रही परियोजनाएं',
    slide1_m2_label: 'स्वीकृत पोर्टफोलियो पूंजीगत व्यय',
    slide1_m3_label: 'अवसंरचना क्षेत्र',
    slide1_m4_label: 'केंद्रीय मंत्रालय',

    // ═══════════════════════════════════════════════════════════════
    // SLIDE 2: NATIONAL MANDATE & STATUTORY GOVERNANCE
    // ═══════════════════════════════════════════════════════════════
    slide2_azadi: 'आज़ादी का अमृत महोत्सव',
    slide2_gatishakti_sub: 'पीएम गतिशक्ति राष्ट्रीय मास्टर प्लान एकीकरण',
    slide2_lede_a: 'पूर्वानुमानात्मक निर्णय समर्थन:',
    slide2_lede_b: 'एमओएसपीआई की अप्रैल २०२६ रिपोर्टिंग पर आधारित, कैलिब्रेटेड',
    slide2_paimana_title: 'सांविधिक पैमाना (PAIMANA) भंडार',
    slide2_paimana_sub: 'सक्रिय निगरानी: २,०४३ परियोजनाएं (≥ ₹१५० करोड़)',
    slide2_paimana_div: 'डीआईआईडी / आईपीएमडी प्रभाग · सांख्यिकी मंत्रालय',
    slide2_directives_title: 'सांविधिक निर्देश एवं नियम',
    slide2_ccea_rule_title: 'सीसीईए २०% नियम',
    slide2_ccea_rule_desc: '२०% या अधिक लागत वृद्धि के लिए अनिवार्य कैबिनेट समिति अनुमोदन।',
    slide2_cpwd_title: 'सीपीडब्ल्यूडी खंड १०सीसी',
    slide2_cpwd_desc: 'सूत्र-संचालित सांविधिक सामग्री एवं श्रम मूल्यवृद्धि सीमाएं।',
    slide2_pib_title: 'पीआईबी स्वीकृतियां',
    slide2_pib_desc: 'पब्लिक इन्वेस्टमेंट बोर्ड संशोधित लागत अनुमान दिशानिर्देश।',
    slide2_rti_title: 'आरटीआई धारा ४',
    slide2_rti_desc: 'संप्रभु पूंजी परिव्यय हेतु सक्रिय सार्वजनिक पारदर्शिता स्तर।',
    slide2_standard_guidelines: 'मानक: सांख्यिकी मंत्रालय फ्लैश दिशानिर्देश',
    slide2_location_delhi: 'नई दिल्ली',
    slide2_auto_badge: 'स्वायत्त निगरानी',
    slide2_auto_sub: 'परिणाम-जागरूक एमएल वास्तुकला',
    slide2_rigor_title: 'गणितीय सटीकता और कारणात्मक एनालिटिक्स द्वारा अवसंरचना वितरण का रूपांतरण',
    slide2_rigor_desc: 'प्रकल्प-दृष्टि प्रशासनिक रिपोर्टों और कार्रवाई योग्य नीति के बीच अंतर को पाटता है। सक्रिय परियोजनाएं वर्तमान टेलीमेट्री प्रदान करती हैं, जबकि पूर्ण परियोजनाएं ग्राउंड-ट्रुथ परिणाम प्रदान करती हैं — जिससे परिणाम-सेंसरिंग पूर्वाग्रह के बिना मजबूत कन्फॉर्मल प्रेडिक्शन सक्षम होता है।',
    slide2_corpus_active: 'सक्रिय चालू',
    slide2_corpus_completed: 'पूर्ण परियोजनाएं',
    slide2_corpus_master: 'मास्टर संग्रह',
    slide2_explore_models: 'प्रमुख गणितीय मॉडल देखें',
    slide2_engines_count: '७ परस्पर जुड़े इंजन',

    // ═══════════════════════════════════════════════════════════════
    // SLIDE 3: FIVE ANALYTICAL ENGINES
    // ═══════════════════════════════════════════════════════════════
    slide3_eyebrow: 'स्वतंत्र विश्लेषणात्मक इंजन',
    slide3_title: 'सात इंजन। एक सुसंगत निर्णय वास्तुकला।',
    slide3_subhead: 'प्रत्येक इंजन प्रकाशित विधियों पर निर्मित, २,२०७ परियोजनाओं पर सत्यापित और सांविधिक नियमों द्वारा सीमित है।',
    slide3_govt_gate: 'केवल सरकारी अधिकारी',

    mod_satya_title: 'अनुबंध अनुपालन फोरेंसिक',
    mod_satya_desc: '२०% सीसीईए सीमा पर मैकक्रैरी घनत्व-असंततता परीक्षण। सांविधिक सूत्र के विरुद्ध सीपीडब्ल्यूडी खंड १०सीसी मूल्यवृद्धि की जांच करता है।',
    mod_satya_finding: 'p = 0.68 (२०% पर)',
    mod_satya_finding_label: 'कोई घनत्व असंततता नहीं',

    mod_artha_title: 'पीएसयू वित्तीय शोधनक्षमता',
    mod_artha_desc: 'ऋण-से-इक्विटी और ऑल्टमैन जेड संदर्भ आंकड़ों के आधार पर निष्पादनकारी पीएसयू की जांच करता है। गैर-प्रकाशित बैलेंस शीट वाली एजेंसियों को UNRATED चिह्नित किया जाता है।',
    mod_artha_finding: 'D/E · ऑल्टमैन Z',
    mod_artha_finding_label: 'संकेतक शोधनक्षमता स्तर',

    mod_varsha_title: 'मानसून मौसम प्रभाव',
    mod_varsha_desc: 'कार्य-अवधि परिदृश्य मॉडल: प्रति-राज्य मानसून डाउनटाइम और वर्षा लोच को २०-वर्षीय आईएमडी रिकॉर्ड पर लागू करता है।',
    mod_varsha_finding: '±१५% परिदृश्य',
    mod_varsha_finding_label: 'कार्य-अवधि विस्तार',

    mod_nivaran_title: 'अनुबंध एवं विधिक जोखिम',
    mod_nivaran_desc: 'मध्यस्थता जोखिम हेतु सीपीडब्ल्यूडी जीसीसी खंड भाषा और संविदाकार विवाद इतिहास की नियम-आधारित जांच।',
    mod_nivaran_finding: 'खंड लेखापरीक्षा',
    mod_nivaran_finding_label: 'विवाद जोखिम स्क्रीन',

    mod_anumati_title: 'सांविधिक स्वीकृतियां (परिवेश)',
    mod_anumati_desc: 'प्रति चरण नियामक ठहराव सूचकांक के साथ ५-चरणीय परिवेश स्वीकृति पाइपलाइन ट्रैकिंग।',
    mod_anumati_finding: '५-चरणीय आरएसआई',
    mod_anumati_finding_label: 'स्वीकृति पाइपलाइन',

    // ═══════════════════════════════════════════════════════════════
    // SLIDE 4: EMPIRICAL FINDINGS & EXECUTIVE BULLETINS
    // ═══════════════════════════════════════════════════════════════
    slide4_featured_badge: 'प्रमुख अनुभवजन्य निष्कर्ष',
    slide4_cluster_title: 'सीसीईए २०% लागत संशोधन घनत्व विश्लेषण',
    slide4_cluster_desc: 'अनिवार्य कैबिनेट समिति समीक्षा को ट्रिगर करने वाली सीमा से ठीक नीचे, २०.०%–२१.९% की तुलना में १८.०%–१९.९% में १.६५ गुना अधिक संशोधन आते हैं — १७ के मुकाबले २८ परियोजनाएं। ९५% विश्वास अंतराल [०.९०, ३.०१] है, अतः यह ऑडिट ट्राइएज हेतु एक स्क्रीनिंग संकेत है।',
    slide4_inspect_btn: 'पूर्ण सत्य-कवच अनुपालन रिपोर्ट देखें',
    slide4_ratio_label: 'सीमा बिन-द्रव्यमान अनुपात',
    slide4_ratio_note: '५% पर सांख्यिकीय रूप से महत्वपूर्ण नहीं — ट्राइएज संकेत',

    slide4_b1_tag: 'कैबिनेट फ्लैश',
    slide4_b1_title: 'त्रैमासिक सीसीईए लागत अतिव्यय सीमा ऑडिट प्रकाशित',
    slide4_b1_desc: '२,२०७ केंद्रीय परियोजनाओं का मूल्यांकन। २०% से अधिक संचयी लागत वृद्धि वाली ३०७ परियोजनाओं की पहचान की गई, जिसके लिए संशोधित प्रशासनिक स्वीकृति अनिवार्य है।',

    slide4_b2_tag: 'शोधनक्षमता अलर्ट',
    slide4_b2_title: 'पीएसयू वित्तीय लीवरेज एवं ऑल्टमैन जेड-स्कोर परामर्श',
    slide4_b2_desc: 'अर्थ-नेत्र मॉडल ने १.५x से नीचे ब्याज कवरेज अनुपात वाले ४ सार्वजनिक क्षेत्र के उपक्रमों को चिह्नित किया, जो संभावित निष्पादन मंदी का संकेत है।',

    slide4_b3_tag: 'मौसम परामर्श',
    slide4_b3_title: 'रेखीय परियोजनाओं हेतु आईएमडी मानसून विसंगति विस्तार प्रक्षेपण',
    slide4_b3_desc: 'वर्षा-स्पीड मॉडल +२२% मानसून वर्षा विसंगति से प्रभावित तटीय राजमार्ग और रेलवे पैकेजों के लिए २ से ५ महीने के अतिरिक्त विलंब का अनुमान लगाता है।',

    // ═══════════════════════════════════════════════════════════════
    // SLIDE 5: DECISION HUB ENTRY & PARTNERS
    // ═══════════════════════════════════════════════════════════════
    slide5_badge: 'इंटरैक्टिव सिमुलेशन हब',
    slide5_title: 'संप्रभु निर्णय आसूचना हब में प्रवेश करें',
    slide5_desc: 'मोंटे कार्लो समयसीमा पूर्वानुमान चलाएं, पूंजी अवरोध रेखाचित्रों की गणना करें, रैखिक प्रोग्रामिंग से बजट पुनर्संतुलित करें और सभी २,२०७ परियोजनाओं में मॉडल बेंचमार्क देखें।',
    slide5_btn: 'इंटरैक्टिव हब प्रारंभ करें',
    slide5_partners_title: 'राष्ट्रीय अवसंरचना एवं सरकारी साझेदार',

    // Backward compatibility legacy keys
    hero_badge: 'स्वायत्त वृहद-परियोजना निर्णय आसूचना',
    hero_title_1: 'अग्रिम विलंब अन्वेषण एवं पूंजी पुनरावंटन',
    hero_title_2: '२,२०७ केंद्रीय क्षेत्र अवसंरचना परियोजनाओं हेतु',
    hero_desc: 'प्रकल्प-दृष्टि राष्ट्रीय परियोजना निगरानी को पिछली स्थिति की रिपोर्टिंग से बदलकर अग्रिम, गणितीय रूप से सत्यापित निर्णय आसूचना में परिवर्तित करती है। सांख्यिकी मंत्रालय एवं आर्थिक मामलों की मंत्रिमंडलीय समिति (CCEA) हेतु निर्मित।',
    btn_enter_hub: 'निर्णय केंद्र में प्रवेश करें',
    btn_public_portal: 'सार्वजनिक नागरिक पोर्टल (आरटीआई §4)',
  }
};
