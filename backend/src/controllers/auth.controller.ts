import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth';
import * as AuthService from '../services/auth.service';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';

export async function register(req: AuthRequest, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  try {
    const { username, password, role } = req.body;
    const existing = await AuthService.findUserByUsername(username);
    if (existing) {
      res.status(409).json({ message: 'Korisničko ime već postoji.' });
      return;
    }
    const user = await AuthService.createUser(username, password, role);
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Greška na serveru prilikom registracije.' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  try {
    const { username, password } = req.body;
    const user = await AuthService.findUserByUsername(username);
    if (!user) {
      res.status(401).json({ message: 'Pogrešan username ili password.' });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ message: 'Pogrešan username ili password.' });
      return;
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Greška na serveru prilikom prijave.' });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Niste autentifikovani.' });
    return;
  }
  try {
    const userFromDb = await AuthService.findUserById(req.user.id);
    if (!userFromDb) {
        res.status(404).json({ message: 'Korisnik nije pronađen.' });
        return;
    }
    res.json(userFromDb);
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Greška na serveru prilikom dohvatanja podataka o korisniku.' });
  }
}
