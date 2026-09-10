import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'chitrabazaar-fallback-secret-key-32chars',
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'name@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          include: { studio: true },
        });

        if (!user) {
          throw new Error('No account found with this email address');
        }

        if (!user.passwordHash) {
          throw new Error('This account was created with Google. Please use Google Sign In.');
        }

        if (!user.isActive) {
          throw new Error('Your account has been deactivated. Please contact support.');
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error('Incorrect password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          studioId: user.studioId,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        if (!user.email) return false;
        const cleanEmail = user.email.toLowerCase().trim();

        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: cleanEmail },
          });

          if (!existingUser) {
            // Auto-provision new customer account for Google OAuth
            await prisma.user.create({
              data: {
                name: user.name || cleanEmail.split('@')[0],
                email: cleanEmail,
                image: user.image || null,
                role: Role.CUSTOMER,
                isActive: true,
              },
            });
          } else if (user.image && !existingUser.image) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { image: user.image },
            });
          }
        } catch (err) {
          console.error('Error during Google OAuth sign in callback:', err);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const cleanEmail = (user.email || token.email || '').toLowerCase().trim();
        if (cleanEmail) {
          const dbUser = await prisma.user.findUnique({
            where: { email: cleanEmail },
            select: { id: true, role: true, studioId: true, image: true, name: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.studioId = dbUser.studioId;
            token.picture = dbUser.image || user.image;
            token.name = dbUser.name;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.studioId = token.studioId as string | null | undefined;
        if (token.picture) {
          session.user.image = token.picture as string;
        }
      }
      return session;
    },
  },
};
