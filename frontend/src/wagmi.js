import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base, baseSepolia } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'Prediction Pool dApp',
  projectId: 'YOUR_PROJECT_ID', // Get from WalletConnect Cloud
  chains: [base, baseSepolia],
  ssr: false,
})
