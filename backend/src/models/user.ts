import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

export interface User {
  id: number;
  username: string;
  password: string;
}

export const UserModel = {
  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username }
    });
  },

  async create(username: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    return prisma.user.create({
      data: {
        username,
        password: hashedPassword
      }
    });
  },

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }
};