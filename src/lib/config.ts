import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { monadTestnet } from "./monad";

export const config = getDefaultConfig({
  appName: "MonadB2",
  projectId: "3cace2b820ccdafadc058028c731b60f",
  chains: [monadTestnet],
  ssr: true, // If your dApp uses server side rendering (SSR)
});
