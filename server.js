import express from 'express'
import mysql from 'mysql2/promise'
import cors from 'cors'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'

dotenv.config()

const app = express()

// ── CORS Configuration ────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174').split(',').map(s => s.trim())
app.use(cors({ 
  origin: (origin, cb) => (!origin || ALLOWED_ORIGINS.includes(origin)) ? cb(null, true) : cb(null, false), 
  credentials: true 
}))
app.use(express.json())

const pools = {}
process.env.DB_NAMES.split(',').forEach(db => {
  pools[db.trim()] = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: db.trim()
  })
})

// ── Test ──────────────────────────────────────────────────────────────────────
app.get('/api/:db/test', async (req, res) => {
  const { db } = req.params
  if (!pools[db]) return res.status(400).json({ error: `Database '${db}' not configured` })
  try {
    await pools[db].query('SELECT 1')
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Summary ───────────────────────────────────────────────────────────────────
app.get('/api/:db/summary/:table', async (req, res) => {
  const { db, table } = req.params
  if (!pools[db]) return res.status(400).json({ error: `Database '${db}' not configured` })
  try {
    const p = pools[db]
    const [[categories], [bySetType], [byCardType], [byPassFail], [byMfgBrand], [byCardType2], [byCardList]] = await Promise.all([
      p.query(`SELECT Category, SUM(PriceInfo) AS PriceInfo, COUNT(*) AS TotalSets, SUM(CardList) AS CardList, SUM(TotalCards) AS TotalCards, SUM(TotalValue) AS TotalValue, SUM(NoValue) AS NoValue FROM \`${table}\` GROUP BY Category ORDER BY Category`),
      p.query(`SELECT SetTypeStatus AS label, COUNT(CASE WHEN PriceInfo=0 THEN 1 END) AS pi0, COUNT(CASE WHEN PriceInfo=1 THEN 1 END) AS pi1, COUNT(*) AS total FROM \`${table}\` GROUP BY SetTypeStatus ORDER BY FIELD(SetTypeStatus,'New','Completed','Duplicate'), SetTypeStatus`),
      p.query(`SELECT CardTypeStatus AS label, COUNT(CASE WHEN PriceInfo=0 THEN 1 END) AS pi0, COUNT(CASE WHEN PriceInfo=1 THEN 1 END) AS pi1, COUNT(*) AS total FROM \`${table}\` GROUP BY CardTypeStatus ORDER BY CardTypeStatus`),
      p.query(`SELECT PassFail AS label, COUNT(CASE WHEN PriceInfo=0 THEN 1 END) AS pi0, COUNT(CASE WHEN PriceInfo=1 THEN 1 END) AS pi1, COUNT(*) AS total FROM \`${table}\` GROUP BY PassFail ORDER BY PassFail`),
      p.query(`SELECT MFGBrandStatus AS label, COUNT(CASE WHEN PriceInfo=0 THEN 1 END) AS pi0, COUNT(CASE WHEN PriceInfo=1 THEN 1 END) AS pi1, COUNT(*) AS total FROM \`${table}\` GROUP BY MFGBrandStatus ORDER BY MFGBrandStatus`),
      p.query(`SELECT COALESCE(CardType,'(Unspecified)') AS label, COUNT(CASE WHEN PriceInfo=0 THEN 1 END) AS pi0, COUNT(CASE WHEN PriceInfo=1 THEN 1 END) AS pi1, COUNT(*) AS total FROM \`${table}\` GROUP BY COALESCE(CardType,'(Unspecified)') ORDER BY total DESC`),
      p.query(`SELECT CardList AS label, COUNT(CASE WHEN PriceInfo=0 THEN 1 END) AS pi0, COUNT(CASE WHEN PriceInfo=1 THEN 1 END) AS pi1, COUNT(*) AS total FROM \`${table}\` GROUP BY CardList ORDER BY total DESC`),
    ])
    res.json({ categories, bySetType, byCardType, byPassFail, byMfgBrand, byCardType2, byCardList })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Numbers Update ────────────────────────────────────────────────────────────
app.get('/api/:db/numbers/:table', async (req, res) => {
  const { db, table } = req.params
  if (!pools[db]) return res.status(400).json({ error: `Database '${db}' not configured` })
  const { page = 1, perpage = 100, fpriceinfo = '', fcards = '', fpassfail = '', fsearch = '' } = req.query
  const limit = Math.min(parseInt(perpage), 200)
  const offset = (parseInt(page) - 1) * limit
  const where = []
  const params = []
  if (fpriceinfo === '1') { where.push('PriceInfo = ?'); params.push(1) }
  if (fcards === '0')     { where.push('TotalCards = 0') }
  if (fcards === 'gt0')   { where.push('TotalCards > 0') }
  const passfailOpts = ['Pass','Fail','PassPrice','PassPrice0','Complete','Duplicate','Error']
  if (fpassfail && passfailOpts.includes(fpassfail)) { where.push('PassFail = ?'); params.push(fpassfail) }
  if (fsearch) { where.push('SetName LIKE ?'); params.push(`%${fsearch}%`) }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : ''
  try {
    const [[rows], [countResult]] = await Promise.all([
      pools[db].query(`SELECT id, SetName, PriceInfo, TotalValue, TotalCards, Memorabilia, Rookie, Autograph, Serial, PassFail, Link FROM \`${table}\` ${whereSql} ORDER BY SetName ASC LIMIT ? OFFSET ?`, [...params, limit, offset]),
      pools[db].query(`SELECT COUNT(*) AS total FROM \`${table}\` ${whereSql}`, params),
    ])
    res.json({ rows, total: countResult[0].total, page: parseInt(page), perpage: limit })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/:db/numbers/:table/:id', async (req, res) => {
  const { db, table, id } = req.params
  const { column, value } = req.body
  if (!pools[db]) return res.status(400).json({ error: `Database '${db}' not configured` })
  const allowed = ['PriceInfo','TotalValue','TotalCards','Memorabilia','Rookie','Autograph','Serial','PassFail']
  if (!allowed.includes(column)) return res.status(400).json({ error: 'Invalid column' })
  try {
    if (column === 'PassFail' && value === 'Duplicate') {
      await pools[db].query(`DELETE FROM \`${table}\` WHERE id = ? LIMIT 1`, [id])
      return res.json({ deleted: true })
    }
    let val = value
    if (column === 'PriceInfo') val = value == 1 ? 1 : 0
    else if (column !== 'PassFail') val = parseInt(value) || 0
    await pools[db].query(`UPDATE \`${table}\` SET \`${column}\` = ? WHERE id = ? LIMIT 1`, [val, id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Card Type Update ──────────────────────────────────────────────────────────
app.get('/api/:db/cardtype/:table', async (req, res) => {
  const { db, table } = req.params
  if (!pools[db]) return res.status(400).json({ error: `Database '${db}' not configured` })
  const { page = 1, perpage = 50, fsearch = '', fstatus = 'New', fcardtype = '' } = req.query
  const limit = Math.min(parseInt(perpage), 200)
  const offset = (parseInt(page) - 1) * limit
  const where = []
  const params = []
  if (fstatus && ['New','Completed'].includes(fstatus)) { where.push('CardTypeStatus = ?'); params.push(fstatus) }
  if (fcardtype && ['Base','Parallel','Insert'].includes(fcardtype)) { where.push('CardType = ?'); params.push(fcardtype) }
  if (fsearch) { where.push('SetName LIKE ?'); params.push(`%${fsearch}%`) }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : ''
  try {
    const [[rows], [countResult], [typeCounts]] = await Promise.all([
      pools[db].query(`SELECT id, SetName, CardType, ParallelInsertVariation, InsertName, TotalCards, CardTypeStatus, Link FROM \`${table}\` ${whereSql} ORDER BY SetName ASC LIMIT ? OFFSET ?`, [...params, limit, offset]),
      pools[db].query(`SELECT COUNT(*) AS total FROM \`${table}\` ${whereSql}`, params),
      pools[db].query(`SELECT CardType, COUNT(*) AS cnt FROM \`${table}\` ${whereSql} GROUP BY CardType`, params),
    ])
    res.json({ rows, total: countResult[0].total, typeCounts, page: parseInt(page), perpage: limit })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/:db/cardtype/:table/:id', async (req, res) => {
  const { db, table, id } = req.params
  const { column, value } = req.body
  if (!pools[db]) return res.status(400).json({ error: `Database '${db}' not configured` })
  const allowed = ['CardType','ParallelInsertVariation','InsertName','TotalCards','CardTypeStatus']
  if (!allowed.includes(column)) return res.status(400).json({ error: 'Invalid column' })
  try {
    let val = value
    if (column === 'TotalCards') val = parseInt(value) || 0
    if (column === 'CardType' && !['Base','Parallel','Insert'].includes(val)) val = 'Base'
    if (column === 'CardTypeStatus' && !['New','Completed'].includes(val)) val = 'New'
    await pools[db].query(`UPDATE \`${table}\` SET \`${column}\` = ? WHERE id = ? LIMIT 1`, [val, id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Set Type Update ──────────────────────────────────────────────────────────
app.get('/api/:db/settype/:table', async (req, res) => {
  const { db, table } = req.params
  if (!pools[db]) return res.status(400).json({ error: `Database '${db}' not configured` })
  const { page = 1, perpage = 50, fsearch = '', fstatus = 'New', fsettype = '', fcategory = '' } = req.query
  const limit = Math.min(parseInt(perpage), 200)
  const offset = (parseInt(page) - 1) * limit
  const where = []
  const params = []
  if (fstatus && ['New','Completed'].includes(fstatus)) { where.push('SetTypeStatus = ?'); params.push(fstatus) }
  if (fsearch) { where.push('SetName LIKE ?'); params.push(`%${fsearch}%`) }
  if (fsettype) { where.push('SetType = ?'); params.push(fsettype) }
  if (fcategory) { where.push('Category = ?'); params.push(fcategory) }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : ''
  try {
    const [[rows], [countResult], [setTypeCounts], [categoryCounts], [distinctSetTypes], [distinctCategories]] = await Promise.all([
      pools[db].query(`SELECT id, SetName, SetType, Category, SetTypeStatus, Link FROM \`${table}\` ${whereSql} ORDER BY SetName ASC LIMIT ? OFFSET ?`, [...params, limit, offset]),
      pools[db].query(`SELECT COUNT(*) AS total FROM \`${table}\` ${whereSql}`, params),
      pools[db].query(`SELECT SetType, COUNT(*) AS cnt FROM \`${table}\` ${whereSql} GROUP BY SetType ORDER BY cnt DESC`, params),
      pools[db].query(`SELECT Category, COUNT(*) AS cnt FROM \`${table}\` ${whereSql} GROUP BY Category ORDER BY cnt DESC`, params),
      pools[db].query(`SELECT DISTINCT SetType FROM \`${table}\` WHERE SetType IS NOT NULL AND SetType != '' ORDER BY SetType`),
      pools[db].query(`SELECT DISTINCT Category FROM \`${table}\` WHERE Category IS NOT NULL AND Category != '' ORDER BY Category`),
    ])
    res.json({ rows, total: countResult[0].total, setTypeCounts, categoryCounts, distinctSetTypes, distinctCategories, page: parseInt(page), perpage: limit })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/:db/settype/:table/:id', async (req, res) => {
  const { db, table, id } = req.params
  const { column, value } = req.body
  if (!pools[db]) return res.status(400).json({ error: `Database '${db}' not configured` })
  const allowed = ['SetType', 'Category', 'SetTypeStatus']
  if (!allowed.includes(column)) return res.status(400).json({ error: 'Invalid column' })
  try {
    let val = value
    if (column === 'SetTypeStatus' && !['New','Completed'].includes(val)) val = 'New'
    await pools[db].query(`UPDATE \`${table}\` SET \`${column}\` = ? WHERE id = ? LIMIT 1`, [val, id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── MFG Brand Update ─────────────────────────────────────────────────────────
app.get('/api/:db/mfgbrand/:table', async (req, res) => {
  const { db, table } = req.params
  if (!pools[db]) return res.status(400).json({ error: `Database '${db}' not configured` })
  const { page = 1, perpage = 100, fsearch = '', fstatus = 'New', fmanufacturer = '', fbrand = '' } = req.query
  const limit = Math.min(parseInt(perpage), 200)
  const offset = (parseInt(page) - 1) * limit
  const where = []
  const params = []
  if (fstatus && ['New','Completed'].includes(fstatus)) { where.push('MFGBrandStatus = ?'); params.push(fstatus) }
  if (fsearch) { where.push('SetName LIKE ?'); params.push(`%${fsearch}%`) }
  if (fmanufacturer) { where.push('Manufacturer = ?'); params.push(fmanufacturer) }
  if (fbrand) { where.push('Brand = ?'); params.push(fbrand) }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : ''
  try {
    const [[rows], [countResult], [mfgCounts], [brandCounts], [distinctMfg], [distinctBrands], [pairs]] = await Promise.all([
      pools[db].query(`SELECT id, SetName, Manufacturer, Brand, TotalCards, MFGBrandStatus, Link FROM \`${table}\` ${whereSql} ORDER BY SetName ASC LIMIT ? OFFSET ?`, [...params, limit, offset]),
      pools[db].query(`SELECT COUNT(*) AS total FROM \`${table}\` ${whereSql}`, params),
      pools[db].query(`SELECT Manufacturer, COUNT(*) AS cnt FROM \`${table}\` ${whereSql} GROUP BY Manufacturer ORDER BY cnt DESC`, params),
      pools[db].query(`SELECT Brand, COUNT(*) AS cnt FROM \`${table}\` ${whereSql} GROUP BY Brand ORDER BY cnt DESC`, params),
      pools[db].query(`SELECT DISTINCT Manufacturer FROM \`${table}\` WHERE Manufacturer IS NOT NULL AND Manufacturer != '' ORDER BY Manufacturer`),
      pools[db].query(`SELECT DISTINCT Brand FROM \`${table}\` WHERE Brand IS NOT NULL AND Brand != '' ORDER BY Brand`),
      pools[db].query(`SELECT Manufacturer, Brand, COUNT(*) AS cnt FROM \`${table}\` WHERE Manufacturer IS NOT NULL AND Manufacturer != '' AND Brand IS NOT NULL AND Brand != '' GROUP BY Manufacturer, Brand ORDER BY cnt DESC LIMIT 20`),
    ])
    res.json({ rows, total: countResult[0].total, mfgCounts, brandCounts, distinctMfg, distinctBrands, pairs, page: parseInt(page), perpage: limit })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/:db/mfgbrand/:table/:id', async (req, res) => {
  const { db, table, id } = req.params
  const { column, value } = req.body
  if (!pools[db]) return res.status(400).json({ error: `Database '${db}' not configured` })
  const allowed = ['Manufacturer', 'Brand', 'TotalCards', 'MFGBrandStatus']
  if (!allowed.includes(column)) return res.status(400).json({ error: 'Invalid column' })
  try {
    let val = value
    if (column === 'TotalCards') val = parseInt(value) || 0
    if (column === 'MFGBrandStatus' && !['New','Completed'].includes(val)) val = 'New'
    await pools[db].query(`UPDATE \`${table}\` SET \`${column}\` = ? WHERE id = ? LIMIT 1`, [val, id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Year Summary ─────────────────────────────────────────────────────────────
app.get('/api/:db/yearsummary/:table', async (req, res) => {
  const { db, table } = req.params
  if (!pools[db]) return res.status(400).json({ error: `Database '${db}' not configured` })
  const { page = 1, perpage = 50, fyear = '' } = req.query
  const limit = Math.min(parseInt(perpage), 200)
  const offset = (parseInt(page) - 1) * limit
  const where = []
  const params = []
  if (fyear) { where.push('Year = ?'); params.push(fyear) }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : ''
  try {
    const [[rows], [countResult], [totals]] = await Promise.all([
      pools[db].query(`SELECT Year, COUNT(*) AS SetTypeCount, SUM(TotalCards) AS TotalCards, SUM(TotalValue) AS TotalValue FROM \`${table}\` ${whereSql} GROUP BY Year ORDER BY Year ASC LIMIT ? OFFSET ?`, [...params, limit, offset]),
      pools[db].query(`SELECT COUNT(DISTINCT Year) AS total FROM \`${table}\` ${whereSql}`, params),
      pools[db].query(`SELECT COUNT(*) AS SetTypeCount, SUM(TotalCards) AS TotalCards, SUM(TotalValue) AS TotalValue FROM \`${table}\``),
    ])
    res.json({ rows, total: countResult[0].total, totals: totals[0], page: parseInt(page), perpage: limit })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Card List Update ──────────────────────────────────────────────────────────
app.get('/api/:db/cardlist/:table', async (req, res) => {
  const { db, table } = req.params
  if (!pools[db]) return res.status(400).json({ error: `Database '${db}' not configured` })
  const { page = 1, perpage = 100, fsearch = '', fcards = '', fcardlist = '' } = req.query
  const limit = Math.min(parseInt(perpage), 200)
  const offset = (parseInt(page) - 1) * limit
  const where = []
  const params = []
  if (fsearch) { where.push('SetName LIKE ?'); params.push(`%${fsearch}%`) }
  if (fcards === '0')   { where.push('TotalCards = 0') }
  if (fcards === 'gt0') { where.push('TotalCards > 0') }
  if (fcardlist === '0') { where.push('CardList = 0') }
  if (fcardlist === '1') { where.push('CardList = 1') }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : ''
  try {
    const [[rows], [countResult], [summary]] = await Promise.all([
      pools[db].query(`SELECT id, SetName, CardList, TotalCards, Checklist FROM \`${table}\` ${whereSql} ORDER BY SetName ASC LIMIT ? OFFSET ?`, [...params, limit, offset]),
      pools[db].query(`SELECT COUNT(*) AS total FROM \`${table}\` ${whereSql}`, params),
      pools[db].query(`SELECT SUM(CardList) AS totalCardList, COUNT(*) AS totalSets, SUM(TotalCards) AS totalCards, SUM(CASE WHEN Checklist IS NOT NULL AND Checklist != '' THEN 1 ELSE 0 END) AS hasChecklist FROM \`${table}\``),
    ])
    res.json({ rows, total: countResult[0].total, summary: summary[0], page: parseInt(page), perpage: limit })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/:db/cardlist/:table/:id', async (req, res) => {
  const { db, table, id } = req.params
  const { column, value } = req.body
  if (!pools[db]) return res.status(400).json({ error: `Database '${db}' not configured` })
  const allowed = ['CardList', 'TotalCards']
  if (!allowed.includes(column)) return res.status(400).json({ error: 'Invalid column' })
  try {
    let val = value
    if (column === 'CardList') val = value == 1 ? 1 : 0
    if (column === 'TotalCards') val = parseInt(value) || 0
    await pools[db].query(`UPDATE \`${table}\` SET \`${column}\` = ? WHERE id = ? LIMIT 1`, [val, id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Login History ─────────────────────────────────────────────────────────────
app.get('/api/auth/loginhistory', async (req, res) => {
  const { page = 1, perpage = 50, email = '', status = '' } = req.query
  const limit = Math.min(parseInt(perpage), 200)
  const offset = (parseInt(page) - 1) * limit
  const where = []
  const params = []
  if (email)  { where.push('l.email LIKE ?'); params.push(`%${email}%`) }
  if (status) { where.push('l.status = ?'); params.push(status) }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : ''
  try {
    const [[rows], [countResult]] = await Promise.all([
      pools['Auth'].query(`SELECT l.id, l.user_id, l.email, l.login_time, l.logout_time, l.ip_address, l.user_agent, l.status, l.duration, u.display_name FROM login_log l LEFT JOIN users u ON u.id = l.user_id ${whereSql} ORDER BY l.login_time DESC LIMIT ? OFFSET ?`, [...params, limit, offset]),
      pools['Auth'].query(`SELECT COUNT(*) AS total FROM login_log l ${whereSql}`, params),
    ])
    res.json({ rows, total: countResult[0].total })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Auth ──────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
  try {
    const [[users]] = await Promise.all([
      pools['Auth'].query('SELECT * FROM users WHERE email = ? LIMIT 1', [email])
    ])
    const user = users[0]
    if (!user) return res.status(401).json({ error: 'Invalid email or password' })
    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) return res.status(401).json({ error: 'Invalid email or password' })
    res.json({
      id: user.id,
      name: user.display_name || user.full_name || user.email,
      email: user.email,
      role: user.role === 'Admin' ? 'admin' : 'user',
      owner: user.display_name || user.full_name || '',
      mustResetPassword: !!user.must_reset_password
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/auth/users', async (req, res) => {
  try {
    const [users] = await pools['Auth'].query('SELECT id, email, display_name, full_name, role, must_reset_password, created_at FROM users ORDER BY created_at DESC')
    res.json(users.map(u => ({
      id: u.id,
      name: u.display_name || u.full_name || u.email,
      email: u.email,
      role: u.role === 'Admin' ? 'admin' : 'user',
      owner: u.display_name || u.full_name || '',
      mustResetPassword: !!u.must_reset_password
    })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/auth/users', async (req, res) => {
  const { name, email, password, role, owner } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
  try {
    const hash = await bcrypt.hash(password, 10)
    const dbRole = role === 'admin' ? 'Admin' : 'Standard'
    await pools['Auth'].query('INSERT INTO users (email, password_hash, display_name, full_name, role) VALUES (?, ?, ?, ?, ?)', [email, hash, name || owner || '', owner || name || '', dbRole])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/auth/users/:id', async (req, res) => {
  const { id } = req.params
  const { name, email, password, role, owner } = req.body
  try {
    const dbRole = role === 'admin' ? 'Admin' : 'Standard'
    if (password) {
      const hash = await bcrypt.hash(password, 10)
      await pools['Auth'].query('UPDATE users SET email=?, display_name=?, full_name=?, role=?, password_hash=? WHERE id=?', [email, name || owner || '', owner || name || '', dbRole, hash, id])
    } else {
      await pools['Auth'].query('UPDATE users SET email=?, display_name=?, full_name=?, role=? WHERE id=?', [email, name || owner || '', owner || name || '', dbRole, id])
    }
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/auth/users/:id', async (req, res) => {
  const { id } = req.params
  try {
    await pools['Auth'].query('DELETE FROM users WHERE id = ?', [id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── My Cards - Add Card ─────────────────────────────────────────────────────
app.post('/api/mycards/add', async (req, res) => {
  const { owner, Sport, Year, Card, Name, Number, Type, RookieCard, SerielNumbered, Qty, UngradedPrice, Cost, SerialNumber, ProductType, PurchaseName } = req.body
  if (!owner || !Sport || !Year || !Card || !Name) return res.status(400).json({ error: 'Sport, Year, Card, and Name are required' })
  try {
    const [result] = await pools['IndCards'].query(
      'INSERT INTO CardValue (Owner, Sport, Year, Card, Name, Number, Type, RookieCard, SerielNumbered, Qty, UngradedPrice, Cost, SerialNumber, ProductType, PurchaseName) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [owner, Sport, Year, Card, Name, Number || '', Type || '', RookieCard ? 1 : 0, SerielNumbered || 0, Qty || 1, UngradedPrice || 0, Cost || 0, SerialNumber || 0, ProductType || '', PurchaseName || '']
    )
    res.json({ ok: true, id: result.insertId })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/mycards/card/:id', async (req, res) => {
  const { id } = req.params
  const { owner } = req.query
  if (!owner) return res.status(400).json({ error: 'Owner required' })
  try {
    await pools['IndCards'].query('DELETE FROM CardValue WHERE ID = ? AND LOWER(Owner) LIKE CONCAT(LOWER(?), \'%\') LIMIT 1', [id, owner])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/mycards/numbersuggest', async (req, res) => {
  const { owner, sport, card } = req.query
  if (!owner || !sport || !card) return res.json([])
  try {
    const [rows] = await pools['IndCards'].query(
      'SELECT DISTINCT Number FROM CardValue WHERE LOWER(Owner) LIKE CONCAT(LOWER(?), \'%\') AND LOWER(Sport) = LOWER(?) AND LOWER(Card) = LOWER(?) AND Number IS NOT NULL ORDER BY Number LIMIT 20',
      [owner, sport, card]
    )
    res.json(rows.map(r => r.Number))
  } catch (err) {
    res.json([])
  }
})

app.get('/api/mycards/recent', async (req, res) => {
  const { owner, limit = 10 } = req.query
  if (!owner) return res.status(400).json({ error: 'Owner required' })
  try {
    const [rows] = await pools['IndCards'].query(
      'SELECT ID, Sport, Year, Card, Name, Type, UngradedPrice, Cost FROM CardValue WHERE LOWER(Owner) LIKE CONCAT(LOWER(?), \'%\') ORDER BY ID DESC LIMIT ?',
      [owner, parseInt(limit)]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/mycards/suggest', async (req, res) => {
  const { owner, q = '', sport = '' } = req.query
  if (!owner || !q) return res.json([])
  try {
    const where = ['LOWER(Owner) LIKE CONCAT(LOWER(?), \'%\')', 'LOWER(Name) LIKE CONCAT(\'%\', LOWER(?), \'%\')']
    const params = [owner, q]
    if (sport) { where.push('LOWER(Sport) = LOWER(?)'); params.push(sport) }
    const [rows] = await pools['IndCards'].query(
      `SELECT DISTINCT Name FROM CardValue WHERE ${where.join(' AND ')} ORDER BY Name LIMIT 8`,
      params
    )
    res.json(rows.map(r => r.Name))
  } catch (err) {
    res.json([])
  }
})

// ── My Cards - Individual Cards ───────────────────────────────────────────
app.get('/api/mycards/individual', async (req, res) => {
  const { owner, sport = '', name = '', page = 1, perpage = 50, sort = 'Card', dir = 'desc' } = req.query
  if (!owner) return res.status(400).json({ error: 'Owner required' })
  if (!pools['IndCards']) return res.status(400).json({ error: 'IndCards not configured' })
  const allowedSorts = { Year: 'Year', Card: 'Card', Name: 'Name', Number: 'Number', Qty: 'Qty', Value: 'UngradedPrice', Cost: 'Cost' }
  const sortCol = allowedSorts[sort] ?? 'Card'
  const sortDir = dir === 'asc' ? 'ASC' : 'DESC'
  const limit = Math.min(parseInt(perpage), 200)
  const offset = (parseInt(page) - 1) * limit
  const where = [`LOWER(Owner) LIKE CONCAT(LOWER(?), '%')`]
  const params = [owner]
  if (sport && sport !== 'All') { where.push('LOWER(Sport) = LOWER(?)'); params.push(sport) }
  if (name) { where.push(`LOWER(Name) LIKE CONCAT('%', LOWER(?), '%')`); params.push(name) }
  const whereSql = 'WHERE ' + where.join(' AND ')
  try {
    const [[rows], [countResult], [stats]] = await Promise.all([
      pools['IndCards'].query(`SELECT ID, Year, Card, Name, Number, Type, RookieCard, SerielNumbered, Qty, UngradedPrice, Cost, Sport FROM CardValue ${whereSql} ORDER BY ${sortCol} ${sortDir}, Number LIMIT ? OFFSET ?`, [...params, limit, offset]),
      pools['IndCards'].query(`SELECT COUNT(*) AS total FROM CardValue ${whereSql}`, params),
      pools['IndCards'].query(`SELECT COUNT(*) AS total, SUM(CASE WHEN RookieCard=1 THEN 1 ELSE 0 END) AS rookies, SUM(CASE WHEN SerielNumbered>0 THEN 1 ELSE 0 END) AS serial, SUM(UngradedPrice) AS value_sum, SUM(Cost) AS cost_sum FROM CardValue ${whereSql}`, params),
    ])
    res.json({ rows, total: countResult[0].total, stats: stats[0], page: parseInt(page), perpage: limit })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/mycards/individual/:id', async (req, res) => {
  const { id } = req.params
  const { column, value, owner } = req.body
  if (!pools['IndCards']) return res.status(400).json({ error: 'IndCards not configured' })
  const allowed = { Year: 'int', Card: 'string', Name: 'string', Number: 'string', Type: 'string', RookieCard: 'int', SerielNumbered: 'int', Qty: 'int', UngradedPrice: 'float', Cost: 'float' }
  if (!allowed[column]) return res.status(400).json({ error: 'Invalid column' })
  try {
    let val = value
    if (allowed[column] === 'int') val = parseInt(value) || 0
    else if (allowed[column] === 'float') val = parseFloat(value) || 0
    else val = String(value).trim().slice(0, 255)
    await pools['IndCards'].query(`UPDATE CardValue SET \`${column}\` = ? WHERE ID = ? AND LOWER(Owner) LIKE CONCAT(LOWER(?), '%') LIMIT 1`, [val, id, owner])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── My Cards - All Summary ──────────────────────────────────────────────────
app.get('/api/mycards/summary', async (req, res) => {
  const { owner } = req.query
  if (!owner) return res.status(400).json({ error: 'Owner required' })
  if (!pools['IndCards']) return res.status(400).json({ error: 'IndCards database not configured' })
  try {
    const [[rows], [totals]] = await Promise.all([
      pools['IndCards'].query(`SELECT Sport, COUNT(*) AS TotalCards, SUM(UngradedPrice) AS TotalValue, SUM(Cost) AS TotalCost FROM CardValue WHERE Owner = ? GROUP BY Sport ORDER BY Sport`, [owner]),
      pools['IndCards'].query(`SELECT COUNT(*) AS TotalCards, SUM(UngradedPrice) AS TotalValue, SUM(Cost) AS TotalCost FROM CardValue WHERE Owner = ?`, [owner]),
    ])
    res.json({ rows, totals: totals[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Analysis ─────────────────────────────────────────────────────────────────
app.get('/api/analysis/crosssport', async (req, res) => {
  const sportMap = [
    { key: 'baseball',   db: 'Baseball',   table: 'BaseballSets',   label: 'Baseball',    icon: '⚾' },
    { key: 'basketball', db: 'Basketball', table: 'BKSets',         label: 'Basketball',  icon: '🏀' },
    { key: 'football',   db: 'Football',   table: 'FootballSets',   label: 'Football',    icon: '🏈' },
    { key: 'soccer',     db: 'Soccer',     table: 'Sets',           label: 'Soccer',      icon: '⚽' },
    { key: 'hockey',     db: 'Hockey',     table: 'HockeySets',     label: 'Hockey',      icon: '🏒' },
    { key: 'mma',        db: 'MMA',        table: 'MMASets',        label: 'MMA',         icon: '🥊' },
    { key: 'wrestling',  db: 'Wrestling',  table: 'WrestlingSets',  label: 'Wrestling',   icon: '🤼' },
    { key: 'racing',     db: 'Racing',     table: 'RCSets',         label: 'Racing',      icon: '🏎️' },
    { key: 'miscSports', db: 'MiscSports', table: 'MiscSportsSets', label: 'Misc Sports', icon: '🏅' },
    { key: 'multiSport', db: 'MultiSport', table: 'MultiSportSets', label: 'Multi Sport', icon: '🎽' },
    { key: 'boxing',     db: 'Boxing',     table: 'BXSets',         label: 'Boxing',      icon: '🥋' },
    { key: 'cricket',    db: 'Cricket',    table: 'CricketSets',    label: 'Cricket',     icon: '🏏' },
    { key: 'formula1',   db: 'Formula1',   table: 'F1Sets',         label: 'Formula 1',   icon: '🏁' },
    { key: 'golf',       db: 'Golf',       table: 'GolfSets',       label: 'Golf',        icon: '⛳' },
    { key: 'rugby',      db: 'Rugby',      table: 'RugbySets',      label: 'Rugby',       icon: '🏉' },
    { key: 'softball',   db: 'Softball',   table: 'SoftballSets',   label: 'Softball',    icon: '🥎' },
    { key: 'tennis',     db: 'Tennis',     table: 'TennisSets',     label: 'Tennis',      icon: '🎾' },
    { key: 'gaming',     db: 'Gaming',     table: 'GamingSets',     label: 'Gaming',      icon: '🎮' },
    { key: 'magic',      db: 'Magic',      table: 'MagicSets',      label: 'Magic',       icon: '🧙' },
    { key: 'pokemon',    db: 'Pokemon',    table: 'PokemonSets',    label: 'Pokemon',     icon: '⚡' },
    { key: 'nonsports',  db: 'NonSports',  table: 'NonSportsSets',  label: 'Non-Sports',  icon: '🃏' },
    { key: 'yugioh',     db: 'Yugioh',     table: 'YugiohSets',     label: 'Yu-Gi-Oh',    icon: '👁️' },
    { key: 'funko',      db: 'Funko',      table: 'FunkoSets',      label: 'Funko',       icon: '🧸' },
  ]
  try {
    const results = await Promise.all(
      sportMap.map(async s => {
        if (!pools[s.db]) return { ...s, totalSets: 0, totalCards: 0, totalValue: 0, cardListCount: 0, error: 'Not configured' }
        try {
          const [[row]] = await pools[s.db].query(`SELECT COUNT(*) AS totalSets, SUM(TotalCards) AS totalCards, SUM(TotalValue) AS totalValue, SUM(CardList) AS cardListCount FROM \`${s.table}\``)
          return { ...s, totalSets: Number(row.totalSets ?? 0), totalCards: Number(row.totalCards ?? 0), totalValue: Number(row.totalValue ?? 0), cardListCount: Number(row.cardListCount ?? 0) }
        } catch {
          return { ...s, totalSets: 0, totalCards: 0, totalValue: 0, cardListCount: 0, error: true }
        }
      })
    )
    res.json(results)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── PriceInfo Analysis ───────────────────────────────────────────────────────
app.get('/api/analysis/priceinfo', async (req, res) => {
  const sportMap = [
    { key: 'baseball',   db: 'Baseball',   table: 'BaseballSets',   label: 'Baseball',    icon: '⚾' },
    { key: 'basketball', db: 'Basketball', table: 'BKSets',         label: 'Basketball',  icon: '🏀' },
    { key: 'football',   db: 'Football',   table: 'FootballSets',   label: 'Football',    icon: '🏈' },
    { key: 'soccer',     db: 'Soccer',     table: 'Sets',           label: 'Soccer',      icon: '⚽' },
    { key: 'hockey',     db: 'Hockey',     table: 'HockeySets',     label: 'Hockey',      icon: '🏒' },
    { key: 'mma',        db: 'MMA',        table: 'MMASets',        label: 'MMA',         icon: '🥊' },
    { key: 'wrestling',  db: 'Wrestling',  table: 'WrestlingSets',  label: 'Wrestling',   icon: '🤼' },
    { key: 'racing',     db: 'Racing',     table: 'RCSets',         label: 'Racing',      icon: '🏎️' },
    { key: 'miscSports', db: 'MiscSports', table: 'MiscSportsSets', label: 'Misc Sports', icon: '🏅' },
    { key: 'multiSport', db: 'MultiSport', table: 'MultiSportSets', label: 'Multi Sport', icon: '🎽' },
    { key: 'boxing',     db: 'Boxing',     table: 'BXSets',         label: 'Boxing',      icon: '🥋' },
    { key: 'cricket',    db: 'Cricket',    table: 'CricketSets',    label: 'Cricket',     icon: '🏏' },
    { key: 'formula1',   db: 'Formula1',   table: 'F1Sets',         label: 'Formula 1',   icon: '🏁' },
    { key: 'golf',       db: 'Golf',       table: 'GolfSets',       label: 'Golf',        icon: '⛳' },
    { key: 'rugby',      db: 'Rugby',      table: 'RugbySets',      label: 'Rugby',       icon: '🏉' },
    { key: 'softball',   db: 'Softball',   table: 'SoftballSets',   label: 'Softball',    icon: '🥎' },
    { key: 'tennis',     db: 'Tennis',     table: 'TennisSets',     label: 'Tennis',      icon: '🎾' },
    { key: 'gaming',     db: 'Gaming',     table: 'GamingSets',     label: 'Gaming',      icon: '🎮' },
    { key: 'magic',      db: 'Magic',      table: 'MagicSets',      label: 'Magic',       icon: '🧙' },
    { key: 'pokemon',    db: 'Pokemon',    table: 'PokemonSets',    label: 'Pokemon',     icon: '⚡' },
    { key: 'nonsports',  db: 'NonSports',  table: 'NonSportsSets',  label: 'Non-Sports',  icon: '🃏' },
    { key: 'yugioh',     db: 'Yugioh',     table: 'YugiohSets',     label: 'Yu-Gi-Oh',    icon: '👁️' },
    { key: 'funko',      db: 'Funko',      table: 'FunkoSets',      label: 'Funko',       icon: '🧸' },
  ]
  try {
    const results = await Promise.all(
      sportMap.map(async s => {
        if (!pools[s.db]) return { ...s, total: 0, priced: 0, unpriced: 0, pct: 0, error: 'Not configured' }
        try {
          const [rows] = await pools[s.db].query(
            `SELECT PriceInfo, COUNT(*) AS cnt FROM \`${s.table}\` GROUP BY PriceInfo`
          )
          const priced   = rows.find(r => r.PriceInfo == 1)?.cnt ?? 0
          const unpriced = rows.find(r => r.PriceInfo == 0)?.cnt ?? 0
          const total    = Number(priced) + Number(unpriced)
          return { ...s, total, priced: Number(priced), unpriced: Number(unpriced), pct: total > 0 ? Math.round((priced / total) * 100) : 0 }
        } catch {
          return { ...s, total: 0, priced: 0, unpriced: 0, pct: 0, error: true }
        }
      })
    )
    res.json(results)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── CardList Analysis ───────────────────────────────────────────────────────
app.get('/api/analysis/cardlist', async (req, res) => {
  const sportMap = [
    { key: 'baseball',   db: 'Baseball',   table: 'BaseballSets',   label: 'Baseball',    icon: '⚾' },
    { key: 'basketball', db: 'Basketball', table: 'BKSets',         label: 'Basketball',  icon: '🏀' },
    { key: 'football',   db: 'Football',   table: 'FootballSets',   label: 'Football',    icon: '🏈' },
    { key: 'soccer',     db: 'Soccer',     table: 'Sets',           label: 'Soccer',      icon: '⚽' },
    { key: 'hockey',     db: 'Hockey',     table: 'HockeySets',     label: 'Hockey',      icon: '🏒' },
    { key: 'mma',        db: 'MMA',        table: 'MMASets',        label: 'MMA',         icon: '🥊' },
    { key: 'wrestling',  db: 'Wrestling',  table: 'WrestlingSets',  label: 'Wrestling',   icon: '🤼' },
    { key: 'racing',     db: 'Racing',     table: 'RCSets',         label: 'Racing',      icon: '🏎️' },
    { key: 'miscSports', db: 'MiscSports', table: 'MiscSportsSets', label: 'Misc Sports', icon: '🏅' },
    { key: 'multiSport', db: 'MultiSport', table: 'MultiSportSets', label: 'Multi Sport', icon: '🎽' },
    { key: 'boxing',     db: 'Boxing',     table: 'BXSets',         label: 'Boxing',      icon: '🥋' },
    { key: 'cricket',    db: 'Cricket',    table: 'CricketSets',    label: 'Cricket',     icon: '🏏' },
    { key: 'formula1',   db: 'Formula1',   table: 'F1Sets',         label: 'Formula 1',   icon: '🏁' },
    { key: 'golf',       db: 'Golf',       table: 'GolfSets',       label: 'Golf',        icon: '⛳' },
    { key: 'rugby',      db: 'Rugby',      table: 'RugbySets',      label: 'Rugby',       icon: '🏉' },
    { key: 'softball',   db: 'Softball',   table: 'SoftballSets',   label: 'Softball',    icon: '🥎' },
    { key: 'tennis',     db: 'Tennis',     table: 'TennisSets',     label: 'Tennis',      icon: '🎾' },
    { key: 'gaming',     db: 'Gaming',     table: 'GamingSets',     label: 'Gaming',      icon: '🎮' },
    { key: 'magic',      db: 'Magic',      table: 'MagicSets',      label: 'Magic',       icon: '🧙' },
    { key: 'pokemon',    db: 'Pokemon',    table: 'PokemonSets',    label: 'Pokemon',     icon: '⚡' },
    { key: 'nonsports',  db: 'NonSports',  table: 'NonSportsSets',  label: 'Non-Sports',  icon: '🃏' },
    { key: 'yugioh',     db: 'Yugioh',     table: 'YugiohSets',     label: 'Yu-Gi-Oh',    icon: '👁️' },
    { key: 'funko',      db: 'Funko',      table: 'FunkoSets',      label: 'Funko',       icon: '🧸' },
  ]
  try {
    const results = await Promise.all(
      sportMap.map(async s => {
        if (!pools[s.db]) return { ...s, total: 0, listed: 0, unlisted: 0, pct: 0, error: 'Not configured' }
        try {
          const [rows] = await pools[s.db].query(
            `SELECT CardList, COUNT(*) AS cnt FROM \`${s.table}\` GROUP BY CardList`
          )
          const listed   = rows.find(r => r.CardList == 1)?.cnt ?? 0
          const unlisted = rows.find(r => r.CardList == 0)?.cnt ?? 0
          const total    = Number(listed) + Number(unlisted)
          return { ...s, total, listed: Number(listed), unlisted: Number(unlisted), pct: total > 0 ? Math.round((listed / total) * 100) : 0 }
        } catch {
          return { ...s, total: 0, listed: 0, unlisted: 0, pct: 0, error: true }
        }
      })
    )
    res.json(results)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Affiliate Cards ──────────────────────────────────────────────────────────
app.get('/api/affiliate/cards', async (req, res) => {
  try {
    await pools['Auth'].query(`CREATE TABLE IF NOT EXISTS affiliate_cards (
      id INT AUTO_INCREMENT PRIMARY KEY,
      page VARCHAR(50) NOT NULL,
      icon VARCHAR(20) DEFAULT '',
      title VARCHAR(255) NOT NULL,
      description TEXT,
      cta VARCHAR(100) DEFAULT '',
      href TEXT NOT NULL,
      tag VARCHAR(50) DEFAULT '',
      sort_order INT DEFAULT 0
    )`)
    const [rows] = await pools['Auth'].query('SELECT * FROM affiliate_cards ORDER BY sort_order ASC, id ASC')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/affiliate/cards', async (req, res) => {
  const { page, icon, title, description, cta, href, tag } = req.body
  if (!title || !href) return res.status(400).json({ error: 'Title and href required' })
  try {
    const [result] = await pools['Auth'].query(
      'INSERT INTO affiliate_cards (page, icon, title, description, cta, href, tag) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [page, icon || '', title, description || '', cta || '', href, tag || '']
    )
    res.json({ ok: true, id: result.insertId })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/affiliate/cards/:id', async (req, res) => {
  const { id } = req.params
  const { page, icon, title, description, cta, href, tag } = req.body
  if (!title || !href) return res.status(400).json({ error: 'Title and href required' })
  try {
    await pools['Auth'].query(
      'UPDATE affiliate_cards SET page=?, icon=?, title=?, description=?, cta=?, href=?, tag=? WHERE id=?',
      [page, icon || '', title, description || '', cta || '', href, tag || '', id]
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/affiliate/cards/:id', async (req, res) => {
  const { id } = req.params
  try {
    await pools['Auth'].query('DELETE FROM affiliate_cards WHERE id = ?', [id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Project Tracker ──────────────────────────────────────────────────────────
const PT_SHIRT_WEIGHTS = { XS: 1, S: 3, M: 8, L: 20, XL: 40 }
const PT_SHIRT_LABEL = score =>
  score <= 10 ? 'XS' : score <= 25 ? 'S' : score <= 50 ? 'M' : score <= 100 ? 'L' : 'XL'

async function ensureProjectTracker(pool) {
  await pool.query(`ALTER TABLE tasks MODIFY COLUMN status ENUM('Idea','Backlog','In Progress','In Review','Done') DEFAULT 'Idea'`).catch(() => {})
  await pool.query(`CREATE TABLE IF NOT EXISTS projects (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, status ENUM('Active','On Hold','Completed','Cancelled') DEFAULT 'Active', shirt_size ENUM('XS','S','M','L','XL') DEFAULT 'XS', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`)
  await pool.query(`CREATE TABLE IF NOT EXISTS releases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    version VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    description TEXT,
    release_date DATE,
    status ENUM('Planning','In Progress','Released') DEFAULT 'Planning',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)
  await pool.query(`CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    release_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('Enhancement','Bug','Change Request') DEFAULT 'Enhancement',
    status ENUM('Backlog','In Progress','In Review','Done') DEFAULT 'Backlog',
    priority ENUM('Low','Medium','High','Critical') DEFAULT 'Medium',
    shirt_size ENUM('XS','S','M','L','XL') DEFAULT 'S',
    assignee VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)
}

async function recalcProjectShirt(pool, projectId) {
  const [tasks] = await pool.query('SELECT shirt_size FROM tasks WHERE project_id = ?', [projectId])
  const score = tasks.reduce((sum, t) => sum + (PT_SHIRT_WEIGHTS[t.shirt_size] ?? 3), 0)
  await pool.query('UPDATE projects SET shirt_size = ? WHERE id = ?', [PT_SHIRT_LABEL(score), projectId])
}

app.get('/api/pt/projects', async (req, res) => {
  try {
    await ensureProjectTracker(pools['ProjectTracker'])
    const [rows] = await pools['ProjectTracker'].query(`
      SELECT p.*, COUNT(DISTINCT t.id) AS task_count,
        SUM(t.status = 'Done') AS done_count, COUNT(DISTINCT r.id) AS release_count
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      LEFT JOIN releases r ON r.project_id = p.id
      GROUP BY p.id ORDER BY p.created_at DESC`)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/pt/projects', async (req, res) => {
  const { name, description, status } = req.body
  if (!name) return res.status(400).json({ error: 'Name required' })
  try {
    const [r] = await pools['ProjectTracker'].query(
      'INSERT INTO projects (name, description, status) VALUES (?, ?, ?)',
      [name, description || '', status || 'Active']
    )
    res.json({ ok: true, id: r.insertId })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/pt/projects/:id', async (req, res) => {
  const { name, description, status } = req.body
  try {
    await pools['ProjectTracker'].query(
      'UPDATE projects SET name=?, description=?, status=? WHERE id=?',
      [name, description || '', status, req.params.id]
    )
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/pt/projects/:id', async (req, res) => {
  try {
    await pools['ProjectTracker'].query('DELETE FROM projects WHERE id=?', [req.params.id])
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/pt/releases', async (req, res) => {
  const { project_id } = req.query
  try {
    const where = project_id ? 'WHERE r.project_id = ?' : ''
    const params = project_id ? [project_id] : []
    const [rows] = await pools['ProjectTracker'].query(`
      SELECT r.*, COUNT(t.id) AS task_count, SUM(t.status='Done') AS done_count
      FROM releases r LEFT JOIN tasks t ON t.release_id = r.id
      ${where} GROUP BY r.id ORDER BY r.created_at DESC`, params)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/pt/releases', async (req, res) => {
  const { project_id, version, name, description, release_date, status } = req.body
  if (!project_id || !version) return res.status(400).json({ error: 'project_id and version required' })
  try {
    const [r] = await pools['ProjectTracker'].query(
      'INSERT INTO releases (project_id, version, name, description, release_date, status) VALUES (?,?,?,?,?,?)',
      [project_id, version, name || '', description || '', release_date || null, status || 'Planning']
    )
    res.json({ ok: true, id: r.insertId })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/pt/releases/:id', async (req, res) => {
  const { version, name, description, release_date, status } = req.body
  try {
    await pools['ProjectTracker'].query(
      'UPDATE releases SET version=?, name=?, description=?, release_date=?, status=? WHERE id=?',
      [version, name || '', description || '', release_date || null, status, req.params.id]
    )
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/pt/releases/:id', async (req, res) => {
  try {
    await pools['ProjectTracker'].query('DELETE FROM releases WHERE id=?', [req.params.id])
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/pt/tasks/bulk', async (req, res) => {
  const { ideas, project_id } = req.body
  if (!ideas?.length) return res.status(400).json({ error: 'No ideas provided' })
  try {
    for (const title of ideas) {
      if (!title.trim()) continue
      await pools['ProjectTracker'].query(
        'INSERT INTO tasks (project_id, title, type, status, priority, shirt_size) VALUES (?,?,?,?,?,?)',
        [project_id || null, title.trim(), 'Enhancement', 'Idea', 'Medium', 'S']
      )
    }
    if (project_id) await recalcProjectShirt(pools['ProjectTracker'], project_id)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/pt/tasks', async (req, res) => {
  const { project_id, release_id, status, type } = req.query
  const where = []; const params = []
  if (project_id) { where.push('project_id = ?'); params.push(project_id) }
  if (release_id)  { where.push('release_id = ?');  params.push(release_id) }
  if (status)      { where.push('status = ?');       params.push(status) }
  if (type)        { where.push('type = ?');         params.push(type) }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : ''
  try {
    const [rows] = await pools['ProjectTracker'].query(`SELECT * FROM tasks ${whereSql} ORDER BY created_at DESC`, params)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/pt/tasks', async (req, res) => {
  const { project_id, release_id, title, description, type, status, priority, shirt_size, assignee, est_hours, actual_hours } = req.body
  if (!project_id || !title) return res.status(400).json({ error: 'project_id and title required' })
  try {
    const [r] = await pools['ProjectTracker'].query(
      'INSERT INTO tasks (project_id, release_id, title, description, type, status, priority, shirt_size, assignee, est_hours, actual_hours) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [project_id, release_id || null, title, description || '', type || 'Enhancement', status || 'Idea', priority || 'Medium', shirt_size || 'S', assignee || 'Eric', est_hours || null, actual_hours || null]
    )
    await recalcProjectShirt(pools['ProjectTracker'], project_id)
    res.json({ ok: true, id: r.insertId })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/pt/tasks/:id', async (req, res) => {
  const { project_id, release_id, title, description, type, status, priority, shirt_size, assignee, est_hours, actual_hours } = req.body
  try {
    await pools['ProjectTracker'].query(
      'UPDATE tasks SET project_id=?, release_id=?, title=?, description=?, type=?, status=?, priority=?, shirt_size=?, assignee=?, est_hours=?, actual_hours=? WHERE id=?',
      [project_id, release_id || null, title, description || '', type, status, priority, shirt_size, assignee || 'Eric', est_hours || null, actual_hours || null, req.params.id]
    )
    await recalcProjectShirt(pools['ProjectTracker'], project_id)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/pt/tasks/:id', async (req, res) => {
  try {
    const [[task]] = await pools['ProjectTracker'].query('SELECT project_id FROM tasks WHERE id=?', [req.params.id])
    await pools['ProjectTracker'].query('DELETE FROM tasks WHERE id=?', [req.params.id])
    if (task) await recalcProjectShirt(pools['ProjectTracker'], task.project_id)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/pt/analysis', async (req, res) => {
  try {
    const [[projectStats], [tasksByType], [tasksByStatus], [tasksByPriority], [tasksByShirt], [releaseStats], [projectsWithShirt]] = await Promise.all([
      pools['ProjectTracker'].query(`SELECT status, COUNT(*) AS cnt FROM projects GROUP BY status`),
      pools['ProjectTracker'].query(`SELECT type, COUNT(*) AS cnt FROM tasks GROUP BY type`),
      pools['ProjectTracker'].query(`SELECT status, COUNT(*) AS cnt FROM tasks GROUP BY status`),
      pools['ProjectTracker'].query(`SELECT priority, COUNT(*) AS cnt FROM tasks GROUP BY priority`),
      pools['ProjectTracker'].query(`SELECT shirt_size, COUNT(*) AS cnt FROM tasks GROUP BY shirt_size`),
      pools['ProjectTracker'].query(`SELECT r.status, COUNT(DISTINCT r.id) AS releases, COUNT(t.id) AS tasks FROM releases r LEFT JOIN tasks t ON t.release_id = r.id GROUP BY r.status`),
      pools['ProjectTracker'].query(`SELECT p.id, p.name, p.status, p.shirt_size, COUNT(DISTINCT t.id) AS task_count, SUM(t.status='Done') AS done_count FROM projects p LEFT JOIN tasks t ON t.project_id = p.id GROUP BY p.id ORDER BY p.name`),
    ])
    res.json({ projectStats, tasksByType, tasksByStatus, tasksByPriority, tasksByShirt, releaseStats, projectsWithShirt })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── Generic Query ─────────────────────────────────────────────────────────────
app.get('/api/:db/query', async (req, res) => {
  const { db } = req.params
  const { sql } = req.query
  if (!pools[db]) return res.status(400).json({ error: 'Unknown database' })
  try {
    const [rows] = await pools[db].query(sql)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    res.json({ status: 'ok', databases: Object.keys(pools) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3002
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log('Loaded databases:', Object.keys(pools))
  console.log('Host:', process.env.DB_HOST)
  console.log('User:', process.env.DB_USER)
})
