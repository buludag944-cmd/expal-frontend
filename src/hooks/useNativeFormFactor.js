import { useEffect, useState } from "react";

/** Phone vs tablet width inside Capacitor (iPhone vs iPad, large Android). */
export function useNativeFormFactor(tabletMinWidth = 600) {
  const [formFactor, setFormFactor] = useState(() =>
    typeof window !== "undefined" && window.innerWidth >= tabletMinWidth ? "tablet" : "phone"
  );

  useEffect(() => {
    const onResize = () => {
      setFormFactor(window.innerWidth >= tabletMinWidth ? "tablet" : "phone");
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [tabletMinWidth]);

  return formFactor;
}
