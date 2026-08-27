const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const DATA_PATH = path.join(__dirname, 'data.json');
const PHOTOS_PATH = path.join(__dirname, '../frontend/public/photos');

app.use(cors());
app.use(express.json());

function readData() {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// GET tudo
app.get('/api/data', (req, res) => {
  res.json(readData());
});

// GET fotos
app.get('/api/photos', (req, res) => {
  const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  try {
    if (!fs.existsSync(PHOTOS_PATH)) {
      fs.mkdirSync(PHOTOS_PATH, { recursive: true });
    }
    const files = fs.readdirSync(PHOTOS_PATH)
      .filter(f => extensions.includes(path.extname(f).toLowerCase()))
      .map(f => `/photos/${f}`);
    res.json(files);
  } catch {
    res.json([]);
  }
});

// PUT settings
app.put('/api/settings', (req, res) => {
  const data = readData();
  data.settings = { ...data.settings, ...req.body };
  writeData(data);
  res.json(data.settings);
});

// GET goals
app.get('/api/goals', (req, res) => {
  const data = readData();
  res.json(data.goals);
});

// POST goal
app.post('/api/goals', (req, res) => {
  const data = readData();
  const goal = {
    id: 'g' + Date.now(),
    title: req.body.title || '',
    description: req.body.description || '',
    type: req.body.type || 'shared',
    status: 'not_started',
    progress: 0,
    note: '',
    history: [],
    createdAt: new Date().toISOString().split('T')[0]
  };
  data.goals.push(goal);
  writeData(data);
  res.json(goal);
});

// PUT goal
app.put('/api/goals/:id', (req, res) => {
  const data = readData();
  const idx = data.goals.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Objetivo não encontrado' });
  const old = data.goals[idx];
  const updated = { ...old, ...req.body };
  if (req.body.progress !== undefined && req.body.progress !== old.progress) {
    const now = new Date();
    const months = ['janeiro','fevereiro','março','abril','maio','junho',
                    'julho','agosto','setembro','outubro','novembro','dezembro'];
    updated.history = [
      ...(old.history || []),
      {
        month: months[now.getMonth()],
        progress: req.body.progress,
        note: req.body.historyNote || '',
        date: now.toISOString().split('T')[0]
      }
    ];
  }
  data.goals[idx] = updated;
  writeData(data);
  res.json(updated);
});

// DELETE goal
app.delete('/api/goals/:id', (req, res) => {
  const data = readData();
  data.goals = data.goals.filter(g => g.id !== req.params.id);
  writeData(data);
  res.json({ ok: true });
});

// GET months
app.get('/api/months', (req, res) => {
  const data = readData();
  res.json(data.months);
});

// PUT month
app.put('/api/months/:id', (req, res) => {
  const data = readData();
  const idx = data.months.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Mês não encontrado' });
  data.months[idx] = { ...data.months[idx], ...req.body };
  writeData(data);
  res.json(data.months[idx]);
});

// POST event to month
app.post('/api/months/:id/events', (req, res) => {
  const data = readData();
  const idx = data.months.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Mês não encontrado' });
  const event = {
    id: 'e' + Date.now(),
    text: req.body.text || '',
    createdAt: new Date().toISOString().split('T')[0]
  };
  data.months[idx].events.push(event);
  writeData(data);
  res.json(event);
});

// DELETE event from month
app.delete('/api/months/:monthId/events/:eventId', (req, res) => {
  const data = readData();
  const idx = data.months.findIndex(m => m.id === req.params.monthId);
  if (idx === -1) return res.status(404).json({ error: 'Mês não encontrado' });
  data.months[idx].events = data.months[idx].events.filter(e => e.id !== req.params.eventId);
  writeData(data);
  res.json({ ok: true });
});

// POST special moment to month
app.post('/api/months/:id/moments', (req, res) => {
  const data = readData();
  const idx = data.months.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Mês não encontrado' });
  const moment = {
    id: 'm' + Date.now(),
    text: req.body.text || '',
    createdAt: new Date().toISOString().split('T')[0]
  };
  data.months[idx].specialMoments.push(moment);
  writeData(data);
  res.json(moment);
});

// DELETE special moment from month
app.delete('/api/months/:monthId/moments/:momentId', (req, res) => {
  const data = readData();
  const idx = data.months.findIndex(m => m.id === req.params.monthId);
  if (idx === -1) return res.status(404).json({ error: 'Mês não encontrado' });
  data.months[idx].specialMoments = data.months[idx].specialMoments.filter(m => m.id !== req.params.momentId);
  writeData(data);
  res.json({ ok: true });
});

// GET discoveries
app.get('/api/discoveries', (req, res) => {
  const data = readData();
  res.json(data.discoveries || []);
});

// POST discovery
app.post('/api/discoveries', (req, res) => {
  const data = readData();
  if (!data.discoveries) data.discoveries = [];
  const item = {
    id:          'd' + Date.now(),
    category:    req.body.category || 'filmes',
    title:       req.body.title || '',
    description: req.body.description || '',
    done:        false,
    rating:      null,
    review:      '',
    createdAt:   new Date().toISOString().split('T')[0]
  };
  data.discoveries.push(item);
  writeData(data);
  res.json(item);
});

// PUT discovery
app.put('/api/discoveries/:id', (req, res) => {
  const data = readData();
  if (!data.discoveries) data.discoveries = [];
  const idx = data.discoveries.findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Item não encontrado' });
  data.discoveries[idx] = { ...data.discoveries[idx], ...req.body };
  writeData(data);
  res.json(data.discoveries[idx]);
});

// DELETE discovery
app.delete('/api/discoveries/:id', (req, res) => {
  const data = readData();
  if (!data.discoveries) data.discoveries = [];
  data.discoveries = data.discoveries.filter(d => d.id !== req.params.id);
  writeData(data);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});