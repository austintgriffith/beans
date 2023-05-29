import React, { useEffect, useState } from "react";
import { Routes, useLocation } from "react-router-dom";

import "./FadeTransitionRoutes.css";

export const FadeTransitionRoutes: React.FC<React.PropsWithChildren> = ({ children }) => {
  const location = useLocation();

  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<"fadeIn" | "fadeOut">("fadeIn");

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) setTransitionStage("fadeOut");
  }, [location, displayLocation]);

  return (
    <div
      className={transitionStage}
      onAnimationEnd={() => {
        if (transitionStage === "fadeOut") {
          setTransitionStage("fadeIn");
          setDisplayLocation(location);
        }
      }}
    >
      <Routes location={displayLocation}>{children}</Routes>
    </div>
  );
};
