require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = 5000;
const SECRET = 'secretkey0zosdi';

const DB_FILE = path.join(__dirname, 'db.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

fs.ensureDirSync(UPLOAD_DIR);
if (!fs.existsSync(DB_FILE)) {
  fs.writeJSONSync(DB_FILE, { users: [], claims: [] }, { spaces: 2 });
}

async function readDb() { return fs.readJSON(DB_FILE); }
async function writeDb(db) { return fs.writeJSON(DB_FILE, db, { spaces: 2 }); }

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(UPLOAD_DIR));

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

app.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const db = await readDb();
    if (db.users.find(u => u.username === username)) return res.status(400).json({ message: 'Username already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = { id: Date.now(), username, passwordHash, role };
    db.users.push(user);
    await writeDb(db);
    res.json({ message: 'Registration successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const db = await readDb();
    const user = db.users.find(u => u.username === username && u.role === role);
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET, { expiresIn: '4h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/claims', authenticateToken, upload.single('receipt'), async (req, res) => {
  if (req.user.role !== 'employee') return res.status(403).json({ message: 'Only employees can submit claims' });

  const { expense, amount } = req.body;
  if (!expense || !amount) return res.status(400).json({ message: 'Expense and amount required' });

  const db = await readDb();
  const claim = {
    id: Date.now(),
    userId: req.user.id,
    user: req.user.username,
    expense,
    amount: parseFloat(amount),
    status: 'Pending',
    receiptUrl: req.file ? `/uploads/${req.file.filename}` : null,
    createdAt: new Date().toISOString()
  };

  db.claims.push(claim);
  await writeDb(db);
  res.json({ message: 'Claim submitted', claim });
});

app.get('/claims', authenticateToken, async (req, res) => {
  const db = await readDb();
  if (req.user.role === 'employee') return res.json(db.claims.filter(c => c.userId === req.user.id));
  if (req.user.role === 'manager') return res.json(db.claims.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  return res.status(403).json({ message: 'Forbidden' });
});

app.put('/claims/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ message: 'Only managers can update claims' });

  const claimId = parseInt(req.params.id, 10);
  const { status } = req.body;

  const db = await readDb();
  const claim = db.claims.find(c => c.id === claimId);
  if (!claim) return res.status(404).json({ message: 'Claim not found' });

  claim.status = status;
  await writeDb(db);
  res.json({ message: `Claim ${status}`, claim });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));