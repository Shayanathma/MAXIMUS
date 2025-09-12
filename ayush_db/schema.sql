-- =====================================================
-- STANDARD TERMS
-- =====================================================
CREATE TABLE IF NOT EXISTS standard_terms (
    id SERIAL PRIMARY KEY,
    term_id VARCHAR(100) UNIQUE,
    parent_id VARCHAR(100),
    code VARCHAR(100),
    word TEXT,
    short_definition TEXT,
    long_definition TEXT,
    reference TEXT,
    system VARCHAR(50), -- e.g. Ayurveda, Siddha, Unani
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- MORBIDITY CODES
-- =====================================================
CREATE TABLE IF NOT EXISTS morbidity_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    sr_no INTEGER,
    name_devnagari TEXT,
    name_diacritical TEXT,
    name_english TEXT,
    description TEXT,
    term TEXT,
    word TEXT,
    translation TEXT,
    arabic_term TEXT,
    reference TEXT,
    system VARCHAR(50) NOT NULL,
    standard_term_id INT REFERENCES standard_terms(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- ICD CODES
-- =====================================================
CREATE TABLE IF NOT EXISTS icd_codes (
    id SERIAL PRIMARY KEY,
    icd_version VARCHAR(10), -- ICD-10 or ICD-11
    code VARCHAR(100) UNIQUE NOT NULL,
    title TEXT,
    definition TEXT,
    synonyms TEXT,
    parent_code VARCHAR(100),
    uri TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- MAPPINGS
-- =====================================================
CREATE TABLE IF NOT EXISTS mappings (
    id SERIAL PRIMARY KEY,
    morbidity_id INT NOT NULL REFERENCES morbidity_codes(id) ON DELETE CASCADE,
    icd_id INT NOT NULL REFERENCES icd_codes(id) ON DELETE CASCADE,
    confidence VARCHAR(20), -- High / Medium / Low
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (morbidity_id, icd_id)
);

-- =====================================================
-- INDEXES FOR FASTER LOOKUP
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_morbidity_code ON morbidity_codes(code);
CREATE INDEX IF NOT EXISTS idx_morbidity_name_english ON morbidity_codes(name_english);
CREATE INDEX IF NOT EXISTS idx_morbidity_word ON morbidity_codes(word);
CREATE INDEX IF NOT EXISTS idx_standard_word ON standard_terms(word);
CREATE INDEX IF NOT EXISTS idx_icd_code ON icd_codes(code);

-- Optional full-text search indexes for larger datasets
CREATE INDEX IF NOT EXISTS idx_morbidity_name_fts ON morbidity_codes USING gin(to_tsvector('english', name_english));
CREATE INDEX IF NOT EXISTS idx_standard_word_fts ON standard_terms USING gin(to_tsvector('english', word));

-- =====================================================
-- VIEW FOR SEARCH
-- Includes ICD mappings
-- =====================================================
CREATE OR REPLACE VIEW vw_morbidity_search AS
SELECT 
    m.id AS morbidity_id,
    m.code AS morbidity_code,
    COALESCE(m.name_english, m.word, m.name_diacritical) AS term_name,
    m.description,
    m.system,
    s.term_id AS standard_term_id,
    s.word AS standard_word,
    i.code AS icd_code,
    i.title AS icd_title
FROM morbidity_codes m
LEFT JOIN standard_terms s ON m.standard_term_id = s.id
LEFT JOIN mappings map ON map.morbidity_id = m.id
LEFT JOIN icd_codes i ON i.id = map.icd_id;