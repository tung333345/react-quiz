import { promises as fs } from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'api', 'data', 'db.json');

export default async function handler(req, res) {
  const method = req.method;
  let db;
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    db = JSON.parse(data);
  } catch (e) {
    res.status(500).json({ error: 'Cannot read database' });
    return;
  }

  if (method === 'GET') {
    const { id, code } = req.query;
    if (id) {
      const quiz = db.quizzes.find(q => q.id == id);
      if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
      return res.status(200).json(quiz);
    }
    if (code) {
      const quiz = db.quizzes.filter(q => q.code === code);
      return res.status(200).json(quiz);
    }
    return res.status(200).json(db.quizzes);
  }

  if (method === 'POST') {
    const quiz = req.body;
    db.quizzes.push(quiz);
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    return res.status(201).json(quiz);
  }

  if (method === 'PUT') {
    const { id } = req.query;
    const idx = db.quizzes.findIndex(q => q.id == id);
    if (idx === -1) return res.status(404).json({ error: 'Quiz not found' });
    db.quizzes[idx] = { ...db.quizzes[idx], ...req.body };
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    return res.status(200).json(db.quizzes[idx]);
  }

  if (method === 'DELETE') {
    const { id } = req.query;
    db.quizzes = db.quizzes.filter(q => q.id != id);
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    return res.status(204).end();
  }

  res.status(405).json({ error: 'Method not allowed' });
}
