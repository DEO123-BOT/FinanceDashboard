import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { users, IUser } from '../models/User';

export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user_id, password } = req.body;

    const user: IUser | undefined = users.find(
      (u) => u.user_id === user_id && u.password === password
    );

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET!, {
      expiresIn: '1h',
    });

    res.status(200).json({ token });
  } catch (error) {
    next(error);
  }
};
