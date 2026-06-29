import "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    companyId: string;
    companyName: string;
  }

  interface Session {
    user: User & {
      id: string;
      email: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    companyId: string;
    companyName: string;
  }
}
