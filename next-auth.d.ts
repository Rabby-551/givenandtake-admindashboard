// next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      accessToken: string;
      role: string;
      _id: string;
      email: string;
    };
  }

  interface User {
    accessToken: string;
    role: string;
    _id: string;
    email: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user: {
      accessToken: string;
      role: string;
      _id: string;
      email: string;
    };
  }
}
