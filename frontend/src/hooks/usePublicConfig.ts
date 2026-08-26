import { useCallback, useEffect, useState } from "react";
import { publicApi, friendlyErrorMessage } from "@/services/api";

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
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await publicApi.config();
      setConfig(data);
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return { config, error, isLoading, refetch: fetchConfig };
}
