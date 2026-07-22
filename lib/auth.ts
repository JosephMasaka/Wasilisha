import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;

          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            include: { company: true },
          });
          if (!user) return null;

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          );
          if (!isPasswordValid) return null;

          return {
            id: user.id,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
            companyName: user.company.name,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
});