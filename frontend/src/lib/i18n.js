/**
 * Bilingual Support Engine (English / हिन्दी)
 * Meets GIGW 3.0 Section 5.1 (Language Options on Government Portals).
 *
 * Persists the preferred language across sessions in localStorage.
 * Dispatches 'prakalp:languageChanged' event whenever the language toggles.
 */

const LANG_KEY = 'prakalp:a11y:lang';

export const DICTIONARY = {
  en: {
    // Navigation
    nav_home: 'HOME',
    nav_decision_hub: 'DECISION HUB',
    nav_nagrik: 'NAGRIK PORTAL',
    nav_admin: 'CORPUS ADMIN',
    nav_sign_out: 'Sign out',
    nav_login: 'LOGIN | REGISTER',

    // Masthead
    subtitle: 'Autonomous Infrastructure Decision Intelligence',
    ministry_name: 'Ministry of Statistics & Programme Implementation',

    // Accessibility Bar
    proto_badge: 'Prototype',
    proto_desc: 'built for Smart India Hackathon 2026 (PS SIH26103). Not an official Government of India service.',
    contrast_btn: 'Contrast',
    lang_toggle: 'हिन्दी',
    lang_title: 'Switch to Hindi / हिन्दी में देखें',

    // Status Badges

    // Citizen Dashboard
    sort_by: 'Sort by',

    // Executive Cockpit & Dossier
    export_dossier: 'Cabinet Dossier (Print/PDF)',
    quick_jump: 'Quick Jump',
    jump_sliders: 'Sliders',
    jump_forecast: 'Forecast (P50)',
    jump_satellite: 'Satellite',
    jump_directives: 'Directives',
    jump_copilot: 'Co-Pilot',
    realistic_finish: 'Realistic finish',
    chance_target: 'Chance of target',
    cost_movement: 'Cost movement',
    capital_locked: 'Capital locked',

    // Workspaces & Engines (MoSPI Decision Hub)

    // Institutional Verifications & Legal Terms
    merkle_verified: 'Merkle-verified',
    audit_certified: 'Audit Certified',
    system_operational: 'SYSTEM OPERATIONAL',
    // -- Footer link labels --
    ftlink_hyperlink: 'Hyperlinking policy & terms',
    ftlink_0: 'Nagrik Portal (Public Citizens)',
    ftlink_1: 'Decision Intelligence Hub',
    ftlink_2: 'Satya-Kavach (CCEA 20% Audit)',
    ftlink_3: 'Artha-Nivaran (PSU Financial Radar)',
    ftlink_4: 'Setu-Varsha (Climate Exposure)',
    ftlink_5: 'Karya-Dakshata (Agency Simulator)',
    ftlink_6: 'Website Policies & Disclaimer',
    ftlink_7: 'Privacy Policy (DPDP Act)',
    ftlink_8: 'Accessibility Statement (GIGW 3.0)',
    ftlink_9: 'Feedback & Grievance Redressal',
    // ── Footer ──
    ft_ministry_line: 'Ministry of Statistics & Programme Implementation · Govt. of India',
    ft_blurb: 'National infrastructure monitoring and decision-intelligence system for Central Sector projects of ₹150 crore and above. Supports statutory oversight, empirical risk analysis and delivery tracking.',
    ft_nodal_division: 'Nodal Division:',
    ft_nodal_division_val: 'Infrastructure & Project Monitoring Division (IPMD)',
    ft_built_for: 'Built for:',
    ft_built_for_val: 'Smart India Hackathon 2026 · Problem Statement SIH26103',
    ft_official_accounts: 'Official MoSPI accounts',
    ft_analytical_portals: 'Analytical portals',
    ft_government_portals: 'Government portals',
    ft_policies_help: 'Website policies & help',
    ft_deployment_target: 'Deployment target:',
    ft_intended_owner: 'Intended owner:',
    ft_copyright: 'Ministry of Statistics & Programme Implementation, Government of India.',

    // ── Pagination ──
    pg_filtered_projects: 'filtered projects',
    pg_total_corpus: 'total in the register',
    pg_page: 'Page',
    pg_first: 'First page',
    pg_prev: 'Previous page',
    pg_next: 'Next page',
    pg_last: 'Last page',

    sort_ascending: 'sorted ascending',
    sort_descending: 'sorted descending',
    // ── Remaining register chrome ──
    reg_export_csv: 'Export CSV ledger',
    reg_corpus_label: 'MoSPI Central Sector',
    reg_centroid_approx: 'Approximate location',
    reg_caption: 'Central Sector projects register. Column headers can be activated to change the sort order.',
    reg_showing_of: 'shown of',

    // ── Accessibility bar (screen-reader text) ──
    skip_to_content: 'Skip to main content',
    a11y_size_normal: 'Normal text size (100%)',
    a11y_size_large: 'Larger text size (115%)',
    a11y_size_larger: 'Largest text size (130%)',
    a11y_contrast_on: 'Higher contrast is on',
    a11y_contrast_off: 'Higher contrast is off',
    a11y_size_group: 'Text size',

    // ── Project spotlight card ──
    sp_physical_progress: 'Physical Progress',
    sp_executing_agency: 'Executing Agency',
    sp_original_sanction: 'Original Sanction Date',
    sp_ccea_baseline: 'CCEA Approval Baseline',
    sp_target_completion: 'Target Completion',
    sp_revised_target: 'Revised MoSPI Target',
    sp_schedule_deviation: 'Schedule Deviation',
    sp_against_plan: 'Against Approved Plan',
    sp_months_delay: 'Months Delay',
    sp_nil_delay: 'Nil Delay (On Track)',
    sp_milestone_track: 'Milestone Track',
    sp_realized: 'Realized',

    // ── Map panel ──
    map_sites_title: 'Pan-India project sites',
    map_georeferenced_n: 'georeferenced',
    map_unmapped_n: 'not georeferenced',
    map_geocoder: 'GeoNames 5-tier geocoding engine',

    // -- Decision Hub workspaces & engines --
    ws_radar: 'Portfolio Radar',
    ws_dossier: 'Project Dossier 360',
    ws_allocator: 'Capital Allocator',
    ws_governance: 'Governance & Validation',
    eng_watchlist: 'Early Warning Queue',
    eng_watchlist_desc: 'Ranked portfolio watchlist across all 2,207 projects',
    eng_satya_kavach: 'SATYA KAVACH',
    eng_satya_kavach_desc: '20% threshold proximity & Clause 10CC inflation audit',
    eng_setu_varsha: 'SETU VARSHA',
    eng_setu_varsha_desc: 'Weather shock, river basin & dependency graph',
    eng_unified_cockpit: 'Unified Risk Cockpit',
    eng_unified_cockpit_desc: 'Survival curve, expenditure trajectory & satellite geocodes',
    eng_kaal_chakra: 'KAAL CHAKRA',
    eng_kaal_chakra_desc: 'Conformalized Weibull finish date & delay quantification',
    eng_pragati_saarthi: 'PRAGATI SAARTHI',
    eng_pragati_saarthi_desc: 'Executive brief & cryptographically sealed SHA-256 audit trail',
    eng_vitta_vyuha: 'VITTA VYUHA',
    eng_vitta_vyuha_desc: 'HiGHS linear programming solver with 10% NER statutory floor',
    eng_karya_dakshata: 'KARYA DAKSHATA',
    eng_karya_dakshata_desc: 'Stress-test agency absorption rates and execution velocity',
    eng_nivaran: 'Nivaran Legal Radar',
    eng_nivaran_desc: 'Contract disputes, arbitration claims & court stay risks',
    eng_artha_nivaran: 'ARTHA NIVARAN',
    eng_artha_nivaran_desc: 'Altman Z-Score solvency, working capital & dispute exposure',
    eng_agency_index: 'Agency Track Record',
    eng_agency_index_desc: 'MoSPI agency efficiency index & satellite coordinate precision',
    eng_benchmark: 'Scientific Model Validation',
    eng_benchmark_desc: 'Empirical benchmark vs OLS and historical sector baselines',

    // ── Prototype notice (short form for narrow viewports) ──
    proto_desc_short: 'not an official Government of India service.',

    // ── Nagrik: hero & framing ──
    nagrik_eyebrow: 'CITIZEN CHARTER · OPEN DATA INITIATIVE · RTI ACT §4(1)(B)',
    nagrik_title: 'Public Infrastructure Transparency & Oversight',
    nagrik_lede: 'Every Central Government project over ₹150 crore, published in full. See where it is being built, what it was approved to cost, what it costs now, and whether it is running late.',
    nagrik_rti_note: 'This information is published under Section 4(1)(b) of the Right to Information Act, 2005 — you should not have to file an RTI request to see it.',
    nagrik_transparency: 'NAGRIK TRANSPARENCY',
    nagrik_rti_mandate: 'RTI ACT §4 MANDATE',
    nagrik_dossier: 'DOSSIER',
    total_approved_cost: 'Total approved cost',
    projects_published: 'projects published',
    register_unavailable: 'Register unavailable',

    // ── Nagrik: tabs ──
    tab_find: 'Find a project near you',
    tab_find_desc: 'Locations, progress and delays for every project',
    tab_money: 'Where the money went',
    tab_money_desc: 'What each project was approved for, and what it costs now',
    tab_permissions: 'Permissions and approvals',
    tab_permissions_desc: 'Forest, environment, wildlife and land clearances each project needed',
    tab_grievance: 'Citizen Grievance & Vigilance',
    tab_grievance_desc: 'File ground proof, report stalled worksites & track CPGRAMS 30-day resolution',
    projects_unit: 'projects',

    // ── Provenance strip ──
    prov_source: 'Source:',
    prov_source_val: 'MoSPI Central Sector project corpus (projects of ₹150 crore and above)',
    prov_loaded: 'Data loaded:',
    prov_loading: 'loading…',
    prov_unavailable: 'unavailable',
    prov_delay_basis: 'Delay is measured against each project\u2019s approved completion date',

    // ── Register: headings, columns, controls ──
    register_title: 'Central Sector Mega-Projects Master Public Tracking Register',
    register_subtitle_a: 'Published under Section 4(1)(b) of the Right to Information Act, 2005 — all',
    register_subtitle_b: 'Central Sector projects,',
    register_subtitle_c: 'approved',
    col_id: 'ID',
    col_name: 'Project name & sector',
    col_agency: 'Agency & state',
    col_cost: 'Approved / current cost',
    col_progress: 'Physical progress',
    col_delay: 'Delay',
    col_status: 'Status',
    col_action: 'Action',
    kpi_in_register: 'Projects in the register',
    kpi_needs_attention: 'Needs attention',
    kpi_needs_attention_sub: 'unfinished and more than 6 months late',
    kpi_on_schedule: 'On schedule',
    kpi_on_schedule_sub: 'no delay against the approved date',
    kpi_finished: 'Finished',
    kpi_finished_sub_a: 'of which',
    kpi_finished_sub_b: 'finished late',
    kpi_approved: 'approved',
    filter_all: 'All',
    search_register_ph: 'Search all projects…',
    search_register_label: 'Search the full register by project name, agency, sector, state or MoSPI code',
    search_directory_label: 'Search the project directory by name, agency, state or MoSPI code',
    search_directory_ph: 'Search by project name, agency, state or ID…',
    rows_label: 'Rows:',
    of_word: 'of',

    // ── Map ──
    map_click_marker: 'Click any marker to inspect dossier',
    map_prev: 'Prev',
    map_next: 'Next',

    // ── Empty / error states ──
    err_load_title: 'Project data could not be loaded',
    err_load_detail: 'The portal cannot reach the project database right now. Figures elsewhere on this page may be incomplete or out of date.',
    err_retry: 'Try again',
    err_no_match_title: 'No projects match these filters',
    err_no_match_detail: 'Try a broader search term, or clear the filters to see the full register.',
    err_clear_filters: 'Clear all filters',

    // ── Copilot ──
    copilot_input_label: 'Ask a question about this project',
    copilot_ask: 'Ask',
    copilot_transcript: 'Copilot conversation',

    // ── Decision Hub chrome ──
  },
  hi: {
    // Navigation
    nav_home: 'मुख्य पृष्ठ',
    nav_decision_hub: 'निर्णय केंद्र',
    nav_nagrik: 'नागरिक पोर्टल',
    nav_admin: 'प्रशासन',
    nav_sign_out: 'लॉग आउट',
    nav_login: 'लॉग इन | पंजीकरण',

    // Masthead
    subtitle: 'स्वायत्त अवसंरचना निर्णय आसूचना मंच',
    ministry_name: 'सांख्यिकी एवं कार्यक्रम कार्यान्वयन मंत्रालय',

    // Accessibility Bar
    proto_badge: 'प्रोटोटाइप',
    proto_desc: 'स्मार्ट इंडिया हैकाथॉन 2026 हेतु निर्मित। यह भारत सरकार की आधिकारिक सेवा नहीं है।',
    contrast_btn: 'कंट्रास्ट',
    lang_toggle: 'English',
    lang_title: 'अंग्रेजी में देखें / Switch to English',

    // Status Badges

    // Citizen Dashboard
    sort_by: 'क्रमबद्ध करें',

    // Executive Cockpit & Dossier
    export_dossier: 'मंत्रिमंडल डोज़ियर (प्रिंट/पीडीएफ)',
    quick_jump: 'त्वरित नेविगेशन',
    jump_sliders: 'सिमुलेशन',
    jump_forecast: 'पूर्वानुमान (P50)',
    jump_satellite: 'उपग्रह साक्ष्य',
    jump_directives: 'निर्देश',
    jump_copilot: 'सह-पायलट',
    realistic_finish: 'यथार्थवादी पूर्णता',
    chance_target: 'लक्ष्य प्राप्ति संभावना',
    cost_movement: 'लागत वृद्धि',
    capital_locked: 'अवरुद्ध पूंजी',

    // Workspaces & Engines (MoSPI Decision Hub)

    // Institutional Verifications & Legal Terms
    merkle_verified: 'मर्कल-प्रमाणित',
    audit_certified: 'लेखापरीक्षा प्रमाणित',
    system_operational: 'प्रणाली क्रियाशील',
    // -- Footer link labels --
    ftlink_hyperlink: 'हाइपरलिंकिंग नीति एवं शर्तें',
    ftlink_0: 'नागरिक पोर्टल (आम नागरिक)',
    ftlink_1: 'निर्णय आसूचना केंद्र',
    ftlink_2: 'सत्य-कवच (CCEA 20% लेखापरीक्षा)',
    ftlink_3: 'अर्थ-निवारण (पीएसयू वित्तीय राडार)',
    ftlink_4: 'सेतु-वर्षा (जलवायु जोखिम)',
    ftlink_5: 'कार्य-दक्षता (एजेंसी सिमुलेटर)',
    ftlink_6: 'वेबसाइट नीतियां एवं अस्वीकरण',
    ftlink_7: 'गोपनीयता नीति (डीपीडीपी अधिनियम)',
    ftlink_8: 'सुगम्यता विवरण (GIGW 3.0)',
    ftlink_9: 'प्रतिक्रिया एवं शिकायत निवारण',
    // ── Footer ──
    ft_ministry_line: 'सांख्यिकी एवं कार्यक्रम कार्यान्वयन मंत्रालय · भारत सरकार',
    ft_blurb: '₹150 करोड़ एवं अधिक की केंद्रीय क्षेत्र परियोजनाओं हेतु राष्ट्रीय अवसंरचना अनुश्रवण एवं निर्णय-आसूचना प्रणाली। वैधानिक निगरानी, आनुभविक जोखिम विश्लेषण एवं निष्पादन अनुश्रवण में सहायक।',
    ft_nodal_division: 'नोडल प्रभाग:',
    ft_nodal_division_val: 'अवसंरचना एवं परियोजना अनुश्रवण प्रभाग (आईपीएमडी)',
    ft_built_for: 'निर्मित:',
    ft_built_for_val: 'स्मार्ट इंडिया हैकाथॉन 2026 · समस्या कथन SIH26103',
    ft_official_accounts: 'आधिकारिक मंत्रालय खाते',
    ft_analytical_portals: 'विश्लेषणात्मक पोर्टल',
    ft_government_portals: 'सरकारी पोर्टल',
    ft_policies_help: 'वेबसाइट नीतियां एवं सहायता',
    ft_deployment_target: 'नियोजन लक्ष्य:',
    ft_intended_owner: 'प्रस्तावित स्वामी:',
    ft_copyright: 'सांख्यिकी एवं कार्यक्रम कार्यान्वयन मंत्रालय, भारत सरकार।',

    // ── Pagination ──
    pg_filtered_projects: 'फ़िल्टर की गई परियोजनाएं',
    pg_total_corpus: 'रजिस्टर में कुल',
    pg_page: 'पृष्ठ',
    pg_first: 'प्रथम पृष्ठ',
    pg_prev: 'पिछला पृष्ठ',
    pg_next: 'अगला पृष्ठ',
    pg_last: 'अंतिम पृष्ठ',

    sort_ascending: 'आरोही क्रम में',
    sort_descending: 'अवरोही क्रम में',
    // ── Remaining register chrome ──
    reg_export_csv: 'सीएसवी रजिस्टर डाउनलोड करें',
    reg_corpus_label: 'सांख्यिकी मंत्रालय केंद्रीय क्षेत्र',
    reg_centroid_approx: 'अनुमानित अवस्थिति',
    reg_caption: 'केंद्रीय क्षेत्र परियोजना रजिस्टर। क्रम बदलने हेतु स्तंभ शीर्षक सक्रिय किए जा सकते हैं।',
    reg_showing_of: 'में से दिखाया जा रहा',

    // ── Accessibility bar (screen-reader text) ──
    skip_to_content: 'मुख्य सामग्री पर जाएं',
    a11y_size_normal: 'सामान्य अक्षर आकार (100%)',
    a11y_size_large: 'बड़ा अक्षर आकार (115%)',
    a11y_size_larger: 'सबसे बड़ा अक्षर आकार (130%)',
    a11y_contrast_on: 'उच्च कंट्रास्ट चालू है',
    a11y_contrast_off: 'उच्च कंट्रास्ट बंद है',
    a11y_size_group: 'अक्षर आकार',

    // ── Project spotlight card ──
    sp_physical_progress: 'भौतिक प्रगति',
    sp_executing_agency: 'कार्यान्वयन एजेंसी',
    sp_original_sanction: 'मूल स्वीकृति तिथि',
    sp_ccea_baseline: 'सीसीईए अनुमोदन आधाररेखा',
    sp_target_completion: 'लक्षित पूर्णता',
    sp_revised_target: 'संशोधित मंत्रालय लक्ष्य',
    sp_schedule_deviation: 'समय विचलन',
    sp_against_plan: 'स्वीकृत योजना के सापेक्ष',
    sp_months_delay: 'माह विलंब',
    sp_nil_delay: 'कोई विलंब नहीं (समय पर)',
    sp_milestone_track: 'मील-पत्थर प्रगति',
    sp_realized: 'पूर्ण',

    // ── Map panel ──
    map_sites_title: 'अखिल भारतीय परियोजना स्थल',
    map_georeferenced_n: 'भू-संदर्भित',
    map_unmapped_n: 'भू-संदर्भ रहित',
    map_geocoder: 'जियोनेम्स 5-स्तरीय भू-संदर्भन इंजन',

    // -- Decision Hub workspaces & engines --
    ws_radar: 'पोर्टफोलियो राडार',
    ws_dossier: 'परियोजना डोज़ियर 360',
    ws_allocator: 'पूंजी पुनरावंटन',
    ws_governance: 'शासन एवं सत्यापन',
    eng_watchlist: 'प्रारंभिक चेतावनी कतार',
    eng_watchlist_desc: '२,२०७ परियोजनाओं में शीघ्र चेतावनी प्राथमिकता सूची',
    eng_satya_kavach: 'SATYA KAVACH',
    eng_satya_kavach_desc: 'CCEA २०% सीमा निकटता एवं Clause 10CC मूल्य वृद्धि',
    eng_setu_varsha: 'SETU VARSHA',
    eng_setu_varsha_desc: 'मौसम आघात, नदी बेसिन एवं परियोजना संक्रामकता',
    eng_unified_cockpit: 'एकीकृत जोखिम कॉकपिट',
    eng_unified_cockpit_desc: 'उत्तरजीविता वक्र, व्यय प्रक्षेपवक्र एवं उपग्रह साक्ष्य',
    eng_kaal_chakra: 'KAAL CHAKRA',
    eng_kaal_chakra_desc: 'वाइबुल फिनिश तिथि एवं परिमाणित विलंब जोखिम',
    eng_pragati_saarthi: 'PRAGATI SAARTHI',
    eng_pragati_saarthi_desc: 'कार्यकारी विवरण एवं क्रिप्टोग्राफिक मर्कल ऑडिट ट्रेल',
    eng_vitta_vyuha: 'VITTA VYUHA',
    eng_vitta_vyuha_desc: 'HiGHS लीनियर प्रोग्रामिंग सॉल्वर एवं १०% पूर्वोत्तर सांविधिक कोटा',
    eng_karya_dakshata: 'KARYA DAKSHATA',
    eng_karya_dakshata_desc: 'पूंजी अवशोषण एवं निष्पादन गति का विश्लेषण',
    eng_nivaran: 'निवारण विधिक राडार',
    eng_nivaran_desc: 'अनुबंध विवाद, मध्यस्थता दावे एवं न्यायालय स्थगन जोखिम',
    eng_artha_nivaran: 'ARTHA NIVARAN',
    eng_artha_nivaran_desc: 'ऑल्टमैन Z-स्कोर शोधनक्षमता एवं कानूनी विवाद',
    eng_agency_index: 'एजेंसी ट्रैक रिकॉर्ड',
    eng_agency_index_desc: 'मंत्रालय एजेंसी दक्षता सूचकांक एवं उपग्रह सटीकता',
    eng_benchmark: 'वैज्ञानिक मॉडल सत्यापन',
    eng_benchmark_desc: '२,२०७ परियोजनाओं पर OLS व आधारभूत तुलना',

    // ── Prototype notice (short form for narrow viewports) ──
    proto_desc_short: 'यह भारत सरकार की आधिकारिक सेवा नहीं है।',

    // ── Nagrik: hero & framing ──
    nagrik_title: 'सार्वजनिक अवसंरचना पारदर्शिता एवं निगरानी',
    nagrik_lede: '₹150 करोड़ से अधिक की प्रत्येक केंद्रीय परियोजना, पूर्ण विवरण सहित प्रकाशित। देखिए कि निर्माण कहाँ हो रहा है, स्वीकृत लागत क्या थी, वर्तमान लागत क्या है, और क्या परियोजना विलंबित है।',
    nagrik_rti_note: 'यह जानकारी सूचना का अधिकार अधिनियम, 2005 की धारा 4(1)(ख) के अंतर्गत प्रकाशित है — इसे देखने के लिए आपको आरटीआई आवेदन करने की आवश्यकता नहीं है।',
    nagrik_transparency: 'नागरिक पारदर्शिता',
    nagrik_rti_mandate: 'आरटीआई अधिनियम §4 अधिदेश',
    nagrik_dossier: 'विवरणिका',
    total_approved_cost: 'कुल स्वीकृत लागत',
    projects_published: 'परियोजनाएं प्रकाशित',
    register_unavailable: 'रजिस्टर अनुपलब्ध',

    // ── Nagrik: tabs ──
    tab_find: 'अपने निकट की परियोजना खोजें',
    tab_find_desc: 'प्रत्येक परियोजना की अवस्थिति, प्रगति एवं विलंब',
    tab_money: 'व्यय का विवरण',
    tab_money_desc: 'प्रत्येक परियोजना की स्वीकृत लागत और वर्तमान लागत',
    tab_permissions: 'अनुमतियां एवं स्वीकृतियां',
    tab_permissions_desc: 'वन, पर्यावरण, वन्यजीव एवं भूमि संबंधी आवश्यक स्वीकृतियां',
    tab_grievance: 'नागरिक शिकायत एवं सतर्कता',
    tab_grievance_desc: 'जमीनी साक्ष्य दर्ज करें, रुकी परियोजनाओं की रिपोर्ट दें एवं 30-दिवसीय समाधान ट्रैक करें',
    projects_unit: 'परियोजनाएं',

    // ── Provenance strip ──
    prov_source: 'स्रोत:',
    prov_source_val: 'सांख्यिकी मंत्रालय केंद्रीय क्षेत्र परियोजना संग्रह (₹150 करोड़ एवं अधिक की परियोजनाएं)',
    prov_loaded: 'आंकड़े प्राप्त:',
    prov_loading: 'लोड हो रहा है…',
    prov_unavailable: 'अनुपलब्ध',
    prov_delay_basis: 'विलंब की गणना प्रत्येक परियोजना की स्वीकृत पूर्णता तिथि के सापेक्ष की गई है',

    // ── Register: headings, columns, controls ──
    register_title: 'केंद्रीय क्षेत्र वृहद परियोजना सार्वजनिक अनुश्रवण रजिस्टर',
    register_subtitle_a: 'सूचना का अधिकार अधिनियम, 2005 की धारा 4(1)(ख) के अंतर्गत प्रकाशित — कुल',
    register_subtitle_b: 'केंद्रीय क्षेत्र परियोजनाएं,',
    register_subtitle_c: 'स्वीकृत',
    col_id: 'क्रमांक',
    col_name: 'परियोजना एवं क्षेत्र',
    col_agency: 'एजेंसी एवं राज्य',
    col_cost: 'स्वीकृत / वर्तमान लागत',
    col_progress: 'भौतिक प्रगति',
    col_delay: 'विलंब',
    col_status: 'स्थिति',
    col_action: 'कार्रवाई',
    kpi_in_register: 'रजिस्टर में परियोजनाएं',
    kpi_needs_attention: 'ध्यान अपेक्षित',
    kpi_needs_attention_sub: 'अपूर्ण एवं 6 माह से अधिक विलंबित',
    kpi_on_schedule: 'समय पर',
    kpi_on_schedule_sub: 'स्वीकृत तिथि के सापेक्ष कोई विलंब नहीं',
    kpi_finished: 'पूर्ण',
    kpi_finished_sub_a: 'जिनमें से',
    kpi_finished_sub_b: 'विलंब से पूर्ण हुईं',
    kpi_approved: 'स्वीकृत',
    filter_all: 'सभी',
    search_register_ph: 'सभी परियोजनाओं में खोजें…',
    search_register_label: 'परियोजना नाम, एजेंसी, क्षेत्र, राज्य अथवा कोड द्वारा संपूर्ण रजिस्टर में खोजें',
    search_directory_label: 'परियोजना नाम, एजेंसी, राज्य अथवा कोड द्वारा निर्देशिका में खोजें',
    search_directory_ph: 'परियोजना नाम, एजेंसी, राज्य अथवा क्रमांक से खोजें…',
    rows_label: 'पंक्तियां:',
    of_word: 'में से',

    // ── Map ──
    map_click_marker: 'विवरण देखने हेतु किसी चिह्न पर क्लिक करें',
    map_prev: 'पिछला',
    map_next: 'अगला',

    // ── Empty / error states ──
    err_load_title: 'परियोजना आंकड़े लोड नहीं हो सके',
    err_load_detail: 'पोर्टल इस समय परियोजना डेटाबेस तक नहीं पहुंच पा रहा है। इस पृष्ठ के अन्य आंकड़े अपूर्ण अथवा पुराने हो सकते हैं।',
    err_retry: 'पुनः प्रयास करें',
    err_no_match_title: 'इन फ़िल्टरों से कोई परियोजना मेल नहीं खाती',
    err_no_match_detail: 'व्यापक खोज शब्द आज़माएं, अथवा संपूर्ण रजिस्टर देखने हेतु फ़िल्टर हटाएं।',
    err_clear_filters: 'सभी फ़िल्टर हटाएं',

    // ── Copilot ──
    copilot_input_label: 'इस परियोजना के विषय में प्रश्न पूछें',
    copilot_ask: 'पूछें',
    copilot_transcript: 'सह-पायलट संवाद',

    // ── Decision Hub chrome ──
  }
};

export function toHindiDigits(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  const hindiDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return str.replace(/[0-9]/g, (d) => hindiDigits[d]);
}

export function getStoredLanguage() {
  try {
    return localStorage.getItem(LANG_KEY) || 'en';
  } catch {
    return 'en';
  }
}

export function setStoredLanguage(lang) {
  const safeLang = lang === 'hi' ? 'hi' : 'en';
  try {
    localStorage.setItem(LANG_KEY, safeLang);
    document.documentElement.setAttribute('lang', safeLang);
    window.dispatchEvent(new CustomEvent('prakalp:languageChanged', { detail: safeLang }));
  } catch {
    /* ignore storage errors */
  }
  return safeLang;
}

export function t(key, lang = null) {
  const currentLang = lang || getStoredLanguage();
  return DICTIONARY[currentLang]?.[key] || DICTIONARY['en']?.[key] || key;
}
