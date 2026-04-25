"use client";

import { createContext, useContext } from "react";

export interface AdminUser {
  username: string;
  role: "superadmin" | "admin" | "editor";
  email: string;
  id: string;
}

export const AdminContext = createContext<AdminUser | null>(null);
export const useAdmin = () => useContext(AdminContext);
