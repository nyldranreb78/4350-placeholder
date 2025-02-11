import { Request, Response } from 'express';
import User from '../models/user';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

interface AuthenticatedRequest extends Request {
  user?: any; // Replace 'any' with a proper User type if available
}

async function register(req: Request, res: Response): Promise<void> {
  const { username, email, first_name, last_name, password, password_confirm } = req.body;

  if (!username || !email || !password || !password_confirm || !first_name || !last_name) {
    res.status(422).json({ message: 'Invalid fields' });
    return;
  }

  if (password !== password_confirm) {
    res.status(422).json({ message: 'Passwords do not match' });
    return;
  }

  const userExists = await User.exists({ email }).exec();
  if (userExists) {
    res.sendStatus(409);
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ email, username, password: hashedPassword, first_name, last_name });
    res.sendStatus(201);
  } catch (error) {
    res.status(400).json({ message: "Could not register" });
  }
}

async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(422).json({ message: 'Invalid fields' });
    return;
  }

  const user = await User.findOne({ email }).exec();
  if (!user) {
    res.status(401).json({ message: "Email or password is incorrect" });
    return;
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    res.status(401).json({ message: "Email or password is incorrect" });
    return;
  }

  const accessToken = jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: '1800s' });

  const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET as string, { expiresIn: '1d' });

  user.refresh_token = refreshToken;
  await user.save();

  res.cookie('refresh_token', refreshToken, { httpOnly: true, sameSite: 'none', secure: true, maxAge: 24 * 60 * 60 * 1000 });
  res.json({ access_token: accessToken });
}

async function logout(req: Request, res: Response): Promise<void> {
  const cookies = req.cookies;
  if (!cookies?.refresh_token) {
    res.sendStatus(204);
    return;
  }

  const refreshToken = cookies.refresh_token;
  const user = await User.findOne({ refresh_token: refreshToken }).exec();

  if (!user) {
    res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'none', secure: true });
    res.sendStatus(204);
    return;
  }

  // Properly remove refresh_token
  await User.updateOne({ _id: user.id }, { $unset: { refresh_token: 1 } });

  res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'none', secure: true });
  res.sendStatus(204);
}

async function refresh(req: Request, res: Response): Promise<void> {
  const cookies = req.cookies;
  if (!cookies?.refresh_token) {
    res.sendStatus(401);
    return;
  }

  const refreshToken = cookies.refresh_token;
  const user = await User.findOne({ refresh_token: refreshToken }).exec();

  if (!user) {
    res.sendStatus(403);
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string) as { id: string };
    if (user.id !== decoded.id) {
      res.sendStatus(403);
      return;
    }

    const accessToken = jwt.sign({ id: decoded.id }, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: '1800s' });

    res.json({ access_token: accessToken });
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(403).json({ message: "Invalid refresh token" });
  }
}

async function user(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.status(200).json(req.user);
}

const authControllers = { register, login, logout, refresh, user };
export default authControllers;
