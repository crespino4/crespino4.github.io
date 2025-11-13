const express = require('express');
const { randomUUID } = require('crypto');

/**
 * /Users/jcrespin/Development/crespino4.github.io/CopilotAI/app.js
 *
 * Simple Node.js + Express boilerplate implementing Users + Groups CRUD APIs.
 *
 * Run:
 *   npm init -y
 *   npm install express
 *   node app.js
 *
 * The server listens on port 3000.
 */

const app = express();
const PORT = 3000;

// In-memory stores
let users = [];
let groups = [];

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// ----- Users API -----

// List users
app.get('/users', (req, res) => {
    res.json(users);
});

// Get single user
app.get('/users/:id', (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
});

// Create user
app.post('/users', (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ error: 'name and email are required' });
    }
    const newUser = { id: randomUUID(), name, email, createdAt: new Date().toISOString() };
    users.push(newUser);
    res.status(201).json(newUser);
});

// Update user (partial)
app.put('/users/:id', (req, res) => {
    const idx = users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });

    const { name, email } = req.body;
    if (!name && !email) {
        return res.status(400).json({ error: 'At least one of name or email must be provided' });
    }

    users[idx] = { ...users[idx], ...(name && { name }), ...(email && { email }), updatedAt: new Date().toISOString() };
    res.json(users[idx]);
});

// Delete user
app.delete('/users/:id', (req, res) => {
    const idx = users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    users.splice(idx, 1);
    res.status(204).send();
});

// ----- Groups API -----

// List groups
app.get('/groups', (req, res) => {
    res.json(groups);
});

// Get single group
app.get('/groups/:id', (req, res) => {
    const group = groups.find(g => g.id === req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
});

// Create group
app.post('/groups', (req, res) => {
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'name is required' });
    }
    const newGroup = {
        id: randomUUID(),
        name,
        description: description || '',
        members: [], // store user ids if needed
        createdAt: new Date().toISOString()
    };
    groups.push(newGroup);
    res.status(201).json(newGroup);
});

// Update group (partial)
app.put('/groups/:id', (req, res) => {
    const idx = groups.findIndex(g => g.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Group not found' });

    const { name, description, members } = req.body;
    if (!name && !description && typeof members === 'undefined') {
        return res.status(400).json({ error: 'At least one of name, description, or members must be provided' });
    }

    // If members provided, validate it's an array of user ids (optional)
    if (typeof members !== 'undefined' && !Array.isArray(members)) {
        return res.status(400).json({ error: 'members must be an array of user ids' });
    }

    groups[idx] = {
        ...groups[idx],
        ...(name && { name }),
        ...(description && { description }),
        ...(typeof members !== 'undefined' && { members }),
        updatedAt: new Date().toISOString()
    };
    res.json(groups[idx]);
});

// Delete group
app.delete('/groups/:id', (req, res) => {
    const idx = groups.findIndex(g => g.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Group not found' });
    groups.splice(idx, 1);
    res.status(204).send();
});

// Basic health check
app.get('/', (req, res) => res.send('Users & Groups API is running'));

// Start server
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});