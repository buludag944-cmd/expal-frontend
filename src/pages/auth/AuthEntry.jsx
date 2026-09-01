import React from "react";
import { isNativeApp } from "../../lib/platform";
import MobileAuthLanding from "./MobileAuthLanding";
import WebAuthLanding from "./WebAuthLanding";

/** Native app (Capacitor): full-screen mobile landing. Browser: split web landing. */
export default function AuthEntry() {
  return isNativeApp() ? <MobileAuthLanding /> : <WebAuthLanding />;
}
