// ayush-api/src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Basic search endpoint: searches morbidity by name or standard term
app.get('/search', async (req, res) => {
  try {
    const q = (req.query.term || '').trim();
    if (!q) return res.json({ results: [] });
    const like = '%' + q + '%';
    const sql = `
  SELECT m.morbidity_code,
         m.term_name,
         m.description,
         m.system,
         m.standard_term_id,
         m.standard_word,
         m.icd_code,
         m.icd_title
  FROM vw_morbidity_search m
  WHERE m.term_name ILIKE $1 OR m.standard_word ILIKE $1
  LIMIT 50
`;
    const r = await db.query(sql, [like]);
    res.json({ results: r.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Get mappings by morbidity code or icd code
app.get('/mappings', async (req, res) => {
  try {
    const { morbidity_code, icd_code } = req.query;
    if (morbidity_code) {
      const r = await db.query(`SELECT map.*, m.code as morbidity_code, i.code as icd_code, i.title as icd_title
                                FROM mappings map
                                JOIN morbidity_codes m ON map.morbidity_id = m.id
                                JOIN icd_codes i ON map.icd_id = i.id
                                WHERE m.code = $1`, [morbidity_code]);
      return res.json({ results: r.rows });
    }
    if (icd_code) {
      const r = await db.query(`SELECT map.*, m.code as morbidity_code, i.code as icd_code, i.title as icd_title
                                FROM mappings map
                                JOIN morbidity_codes m ON map.morbidity_id = m.id
                                JOIN icd_codes i ON map.icd_id = i.id
                                WHERE i.code = $1`, [icd_code]);
      return res.json({ results: r.rows });
    }
    // return recent mappings
    const r = await db.query(`SELECT map.*, m.code as morbidity_code, i.code as icd_code, i.title as icd_title
                               FROM mappings map
                               JOIN morbidity_codes m ON map.morbidity_id = m.id
                               JOIN icd_codes i ON map.icd_id = i.id
                               ORDER BY map.created_at DESC
                               LIMIT 50`);
    res.json({ results: r.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Get ICD details
app.get('/icd/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const r = await db.query('SELECT * FROM icd_codes WHERE code = $1', [code]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Create a mapping (simple endpoint for demo)
app.post('/mappings', async (req, res) => {
  try {
    const { morbidity_code, icd_code, confidence, notes, created_by } = req.body;
    if (!morbidity_code || !icd_code) return res.status(400).json({ error: 'morbidity_code and icd_code required' });

    // find ids
    const mres = await db.query('SELECT id FROM morbidity_codes WHERE code = $1', [morbidity_code]);
    const ires = await db.query('SELECT id FROM icd_codes WHERE code = $1', [icd_code]);
    if (mres.rowCount === 0 || ires.rowCount === 0) return res.status(400).json({ error: 'invalid codes' });

    const morbidity_id = mres.rows[0].id;
    const icd_id = ires.rows[0].id;

    const insert = await db.query(
      `INSERT INTO mappings(morbidity_id, icd_id, confidence, notes, created_by)
       VALUES($1,$2,$3,$4,$5)
       ON CONFLICT (morbidity_id, icd_id) DO UPDATE SET confidence = EXCLUDED.confidence, notes = EXCLUDED.notes, created_by = EXCLUDED.created_by, created_at = now()
       RETURNING *`,
      [morbidity_id, icd_id, confidence || 'Medium', notes || null, created_by || 'unknown']
    );

    res.json({ mapping: insert.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.listen(PORT, () => console.log(`AYUSH API listening on port ${PORT}`));