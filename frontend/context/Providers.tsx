"use client";

import { Web3Provider } from "./Web3Context/Web3Provider";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return <Web3Provider>{children}</Web3Provider>;
};
