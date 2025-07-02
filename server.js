// server/server.js
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors(
  {
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.json());

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'portfolio_db'
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
pool.getConnection()
  .then(conn => {
    console.log('Connected to MySQL database');
    conn.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err);
  });

// Routes
// Get all projects
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Halo dari backend!' });
});

app.get('/api/projects', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM projects');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Get project by ID
app.get('/api/projects/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Add a new project
app.post('/api/projects', async (req, res) => {
  const { title, description, image_url, project_url, tags } = req.body;
  
  try {
    const [result] = await pool.query(
      'INSERT INTO projects (title, description, image_url, project_url, tags) VALUES (?, ?, ?, ?, ?)',
      [title, description, image_url, project_url, tags]
    );
    const [newProject] = await pool.query('SELECT * FROM projects WHERE id = ?', [result.insertId]);
    res.json(newProject[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Update a project
app.put('/api/projects/:id', async (req, res) => {
  const { title, description, image_url, project_url, tags } = req.body;
  
  try {
    await pool.query(
      'UPDATE projects SET title = ?, description = ?, image_url = ?, project_url = ?, tags = ? WHERE id = ?',
      [title, description, image_url, project_url, tags, req.params.id]
    );
    const [updatedProject] = await pool.query('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    res.json(updatedProject[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Delete a project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ msg: 'Project removed' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Get about information
app.get('/api/about', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM about LIMIT 1');
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'About information not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Update about information
app.put('/api/about', async (req, res) => {
  const { name, title, bio, image_url, email, phone, location } = req.body;
  
  try {
    // First check if record exists
    const [existing] = await pool.query('SELECT * FROM about LIMIT 1');
    
    if (existing.length === 0) {
      // Insert new record
      await pool.query(
        'INSERT INTO about (name, title, bio, image_url, email, phone, location) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, title, bio, image_url, email, phone, location]
      );
    } else {
      // Update existing record
      await pool.query(
        'UPDATE about SET name = ?, title = ?, bio = ?, image_url = ?, email = ?, phone = ?, location = ? WHERE id = ?',
        [name, title, bio, image_url, email, phone, location, existing[0].id]
      );
    }
    
    const [updatedAbout] = await pool.query('SELECT * FROM about LIMIT 1');
    res.json(updatedAbout[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Contact routes
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  
  try {
    await pool.query(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject, message]
    );
    res.json({ msg: 'Message sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.get('/api/contact-messages', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.put('/api/contact-messages/:id/mark-read', async (req, res) => {
  try {
    await pool.query('UPDATE contact_messages SET is_read = TRUE WHERE id = ?', [req.params.id]);
    res.json({ msg: 'Message marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.delete('/api/contact-messages/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
    res.json({ msg: 'Message deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Work Experience routes
app.get('/api/experiences', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM work_experiences ORDER BY start_date DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.post('/api/experiences', async (req, res) => {
  const { company, position, description, start_date, end_date, is_current } = req.body;
  
  try {
    const [result] = await pool.query(
      'INSERT INTO work_experiences (company, position, description, start_date, end_date, is_current) VALUES (?, ?, ?, ?, ?, ?)',
      [company, position, description, start_date, end_date, is_current]
    );
    const [newExperience] = await pool.query('SELECT * FROM work_experiences WHERE id = ?', [result.insertId]);
    res.json(newExperience[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.put('/api/experiences/:id', async (req, res) => {
  const { company, position, description, start_date, end_date, is_current } = req.body;
  
  try {
    await pool.query(
      'UPDATE work_experiences SET company = ?, position = ?, description = ?, start_date = ?, end_date = ?, is_current = ? WHERE id = ?',
      [company, position, description, start_date, end_date, is_current, req.params.id]
    );
    const [updatedExperience] = await pool.query('SELECT * FROM work_experiences WHERE id = ?', [req.params.id]);
    res.json(updatedExperience[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.delete('/api/experiences/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM work_experiences WHERE id = ?', [req.params.id]);
    res.json({ msg: 'Experience removed' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});