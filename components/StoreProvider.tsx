"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loadChecklist, loadUser, loadSpecies } = useStore();

  useEffect(() => {
    loadChecklist();
    loadUser();
    loadSpecies();
  }, [loadChecklist, loadUser, loadSpecies]);

  return <>{children}</>;
}
