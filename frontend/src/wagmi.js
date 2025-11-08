import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'Prediction Pool dApp',
  projectId: '8f64c64269d5f30ab7e0cbd5adf75f45', // WalletConnect Cloud Project ID
  chains: [base], // Base Mainnet
  ssr: false,
})
