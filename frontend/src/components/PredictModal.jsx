import { useState, useEffect } from 'react'
import { useContractWrite, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI, USDC_ADDRESSES, USDC_ABI } from '../contractConfig'
import { ethers } from 'ethers'

function PredictModal({ session, onClose, onSuccess, showNotification }) {
  const { address, chain } = useAccount()
  const [selectedOption, setSelectedOption] = useState(null)
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState('select') // select, approve, predict
  const [usdcBalance, setUsdcBalance] = useState('0')
  const [allowance, setAllowance] = useState('0')

  const usdcAddress = USDC_ADDRESSES[chain?.id] || USDC_ADDRESSES[8453]

  const { data: approveHash, writeContract: approveUSDC, isPending: isApproving } = useContractWrite()
  const { data: predictHash, writeContract: placePrediction, isPending: isPredicting } = useContractWrite()

  const { isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })
  const { isSuccess: predictSuccess } = useWaitForTransactionReceipt({ hash: predictHash })

  useEffect(() => {
    if (address) {
      checkUSDCBalance()
      checkAllowance()
    }
  }, [address])

  useEffect(() => {
    if (approveSuccess) {
      showNotification('USDC approved successfully!', 'success')
      checkAllowance()
      setStep('predict')
    }
  }, [approveSuccess])

  useEffect(() => {
    if (predictSuccess) {
      onSuccess()
    }
  }, [predictSuccess])

  const checkUSDCBalance = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const usdcContract = new ethers.Contract(usdcAddress, USDC_ABI, provider)
      const balance = await usdcContract.balanceOf(address)
      setUsdcBalance(ethers.formatUnits(balance, 6))
    } catch (error) {
      console.error('Error checking USDC balance:', error)
    }
  }

  const checkAllowance = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const usdcContract = new ethers.Contract(usdcAddress, USDC_ABI, provider)
      const currentAllowance = await usdcContract.allowance(address, CONTRACT_ADDRESS)
      setAllowance(ethers.formatUnits(currentAllowance, 6))
    } catch (error) {
      console.error('Error checking allowance:', error)
    }
  }

  const formatUSDC = (amount) => {
    return ethers.formatUnits(amount, 6)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (selectedOption === null) {
      showNotification('Please select an option', 'error')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      showNotification('Please enter a valid amount', 'error')
      return
    }

    const amountBigInt = ethers.parseUnits(amount, 6)

    // Validate amount range
    if (amountBigInt < session.minPrediction) {
      showNotification(`Minimum prediction is ${formatUSDC(session.minPrediction)} USDC`, 'error')
      return
    }

    if (amountBigInt > session.maxPrediction) {
      showNotification(`Maximum prediction is ${formatUSDC(session.maxPrediction)} USDC`, 'error')
      return
    }

    // Check balance
    if (parseFloat(amount) > parseFloat(usdcBalance)) {
      showNotification('Insufficient USDC balance', 'error')
      return
    }

    // Check if approval is needed
    if (parseFloat(amount) > parseFloat(allowance)) {
      setStep('approve')
      // Approve USDC
      approveUSDC({
        address: usdcAddress,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, amountBigInt],
      })
    } else {
      setStep('predict')
      // Place prediction
      placePrediction({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'placePrediction',
        args: [BigInt(session.id), BigInt(selectedOption), amountBigInt],
      })
    }
  }

  const getStepMessage = () => {
    if (step === 'approve') {
      return 'Approving USDC...'
    } else if (step === 'predict') {
      return 'Placing prediction...'
    }
    return null
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Place Prediction</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>{session.name}</h3>
          <div style={{ color: '#888', fontSize: '0.9rem' }}>
            <div>Pool: {formatUSDC(session.totalPool)} USDC</div>
            <div>Range: {formatUSDC(session.minPrediction)} - {formatUSDC(session.maxPrediction)} USDC</div>
            <div>Your USDC Balance: {usdcBalance} USDC</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Option *</label>
            <div className="options-container">
              {session.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`option-button ${selectedOption === option.id ? 'selected' : ''}`}
                  onClick={() => setSelectedOption(option.id)}
                >
                  <div className="option-name">{option.name}</div>
                  <div className="option-stats">
                    <span>{formatUSDC(option.totalAmount)} USDC</span>
                    <span>{option.predictorCount} predictors</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Prediction Amount (USDC) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min: ${formatUSDC(session.minPrediction)}, Max: ${formatUSDC(session.maxPrediction)}`}
              step="0.01"
              min={formatUSDC(session.minPrediction)}
              max={formatUSDC(session.maxPrediction)}
              required
            />
            <small>
              Enter amount between {formatUSDC(session.minPrediction)} and {formatUSDC(session.maxPrediction)} USDC
            </small>
          </div>

          {getStepMessage() && (
            <div className="info" style={{ marginBottom: '1rem' }}>
              {getStepMessage()}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button
              type="submit"
              className="button button-primary"
              disabled={isApproving || isPredicting}
              style={{ flex: 1 }}
            >
              {isApproving || isPredicting ? 'Processing...' : 'Place Prediction'}
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PredictModal
