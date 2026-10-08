"use client";

import { useEffect, useState } from "react";
import { LeafIcon } from "@/components/icons";

export function ProviderBadge() {
  const [provider, setProvider] = useState("Gemma");
  useEffect(() => {
    fetch("/api/provider").then((response) => response.json()).then((data: { provider?: string }) => data.provider && setProvider(data.provider)).catch(() => undefined);
  }, []);
  return <span className="provider-badge"><LeafIcon width={15} /> Powered by {provider}</span>;
}
