import { useEffect, useState } from "react";
import { publicApi } from "@/services/api";

interface PublicConfig {
  auth_phrase: string;
  min_enrollment_samples: number;
}

/** Non-sensitive server config needed before the user is authenticated
 * (the login page must know the enrollment phrase to render the typing
 * capture box). Fetched once and cached for the session. */
export function usePublicConfig() {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    publicApi
      .config()
      .then((data) => {
        if (!cancelled) setConfig(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load server configuration.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { config, error, isLoading: config === null && error === null };
}
