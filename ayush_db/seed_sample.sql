-- STANDARD TERMS
INSERT INTO standard_terms(term_id, parent_id, code, word, short_definition, long_definition, reference, system)
VALUES
('SAT-0001', NULL, 'S-0001', 'Āmavāta', 'Joint disease due to Ama + Vata', 'Detailed long definition for Amavata...', 'NAMASTE_SAT', 'Ayurveda'),
('SAT-0002', NULL, 'S-0002', 'Madhumeha', 'Diabetes-like condition', 'Detailed long definition for Madhumeha...', 'NAMASTE_SAT', 'Ayurveda');

-- MORBIDITY CODES (AYURVEDA)
INSERT INTO morbidity_codes(code, sr_no, name_devnagari, name_diacritical, name_english, description, system, standard_term_id)
VALUES
('AYU-0001', 1, 'आमवात', 'Āmavāta', 'Amavata', 'Joint pain, swelling and stiffness due to Ama and Vata.', 'Ayurveda', (SELECT id FROM standard_terms WHERE term_id='SAT-0001')),
('AYU-0002', 2, 'मधुमेह', 'Madhumeha', 'Madhumeha', 'Clinical condition similar to diabetes mellitus.', 'Ayurveda', (SELECT id FROM standard_terms WHERE term_id='SAT-0002'));

-- SIDHHA example row (simplified)
INSERT INTO morbidity_codes(code, sr_no, term, word, translation, description, system)
VALUES
('SID-0001', 1, 'T-0001', 'Kāyil', 'Kāyil (example)', 'Siddha example disease description', 'Siddha');

-- UNANI example row
INSERT INTO morbidity_codes(code, sr_no, word, arabic_term, translation, description, system)
VALUES
('UNA-0001', 1, 'Ghar', 'غَر', 'Ghar (example)', 'Unani example disease description', 'Unani');

-- ICD sample rows
INSERT INTO icd_codes(icd_version, code, title, definition, synonyms, parent_code, uri)
VALUES
('ICD-11', 'FA20', 'Rheumatoid arthritis', 'Autoimmune inflammatory arthritis', 'RA; Rheumatoid disease', 'FA2', 'http://id.who.int/icd/entity/7192590'),
('ICD-11', '5A11', 'Type 2 diabetes mellitus', 'A metabolic disorder characterized by hyperglycaemia', 'T2DM; Diabetes mellitus type 2', '5A1', 'http://id.who.int/icd/entity/1234567');

-- MAPPINGS
INSERT INTO mappings(morbidity_id, icd_id, confidence, notes, created_by)
VALUES
((SELECT id FROM morbidity_codes WHERE code='AYU-0001'), (SELECT id FROM icd_codes WHERE code='FA20'), 'High', 'Amavata often maps to rheumatoid arthritis in practice', 'han'),
((SELECT id FROM morbidity_codes WHERE code='AYU-0002'), (SELECT id FROM icd_codes WHERE code='5A11'), 'High', 'Madhumeha ~ Type 2 diabetes (approx)', 'han');