"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loadChecklist } = useStore();

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  return <>{children}</>;
}
