import React, { useCallback, useEffect, useState } from "react";
import { Routes, useLocation } from "react-router-dom";

import "./FadeTransitionRoutes.css";

export const FadeTransitionRoutes: React.FC<React.PropsWithChildren> = ({ children }) => {
  const location = useLocation();

  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<"fadeIn" | "fadeOut">("fadeIn");

  const next = useCallback(() => {
    setTransitionStage("fadeIn");
    setDisplayLocation(location);
  }, [location]);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      // If redirected from wildcard, skip animation
      if (location.state?.redirect) next();
      else setTransitionStage("fadeOut");
    }
  }, [location.pathname, displayLocation.pathname]);

  return (
    <div
      className={transitionStage}
      onAnimationEnd={() => {
        if (transitionStage === "fadeOut") next();
      }}
    >
      <Routes location={displayLocation}>{children}</Routes>
    </div>
  );
};
