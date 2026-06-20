import { Role } from "@/types/db";
import "next-auth";

declare module "next-auth" {
  interface User {
    role?: Role;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
  }
}
