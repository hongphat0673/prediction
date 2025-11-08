import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contractConfig'
import { ethers } from 'ethers'

function CreateSessionModal({ onClose, onSuccess, showNotification }) {
  const [formData, setFormData] = useState({
    name: '',
    endTime: '',
    minPrediction: '',
    maxPrediction: '',
  })
  const [options, setOptions] = useState(['', ''])

  const { data: hash, writeContract, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Watch for success
  useEffect(() => {
    if (isSuccess) {
      onSuccess()
    }
  }, [isSuccess, onSuccess])

  // Watch for errors
  useEffect(() => {
    if (error) {
      console.error('Transaction error:', error)
      showNotification('Error: ' + (error.message || 'Transaction failed'), 'error')
    }
  }, [error, showNotification])

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      // Validate inputs
      if (!formData.name || !formData.endTime || !formData.minPrediction || !formData.maxPrediction) {
        showNotification('Please fill in all fields', 'error')
        return
      }

      if (options.filter(o => o.trim()).length < 2) {
        showNotification('Please provide at least 2 options', 'error')
        return
      }

      // Convert end time to Unix timestamp
      const endTimeTimestamp = Math.floor(new Date(formData.endTime).getTime() / 1000)

      if (endTimeTimestamp <= Math.floor(Date.now() / 1000)) {
        showNotification('End time must be in the future', 'error')
        return
      }

      // Convert USDC amounts to proper format (6 decimals)
      const minPrediction = ethers.parseUnits(formData.minPrediction, 6)
      const maxPrediction = ethers.parseUnits(formData.maxPrediction, 6)

      if (minPrediction >= maxPrediction) {
        showNotification('Max prediction must be greater than min prediction', 'error')
        return
      }

      // Filter empty options
      const filteredOptions = options.filter(o => o.trim())

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'createSession',
        args: [
          formData.name,
          BigInt(endTimeTimestamp),
          minPrediction,
          maxPrediction,
          filteredOptions,
        ],
      })
    } catch (error) {
      console.error('Error creating session:', error)
      showNotification('Error creating session: ' + error.message, 'error')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleOptionChange = (index, value) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const addOption = () => {
    setOptions([...options, ''])
  }

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create Prediction Session</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Session Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Bitcoin Price Prediction"
              required
            />
          </div>

          <div className="form-group">
            <label>End Time *</label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              required
            />
            <small>When will predictions close?</small>
          </div>

          <div className="input-row">
            <div className="form-group">
              <label>Min Prediction (USDC) *</label>
              <input
                type="number"
                name="minPrediction"
                value={formData.minPrediction}
                onChange={handleInputChange}
                placeholder="10"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label>Max Prediction (USDC) *</label>
              <input
                type="number"
                name="maxPrediction"
                value={formData.maxPrediction}
                onChange={handleInputChange}
                placeholder="1000"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Prediction Options *</label>
            <small>Add at least 2 options for users to choose from</small>
            <div className="options-input">
              {options.map((option, index) => (
                <div key={index} className="option-input-row">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      className="button button-danger"
                      onClick={() => removeOption(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="button button-secondary"
                onClick={addOption}
              >
                + Add Option
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button
              type="submit"
              className="button button-primary"
              disabled={isPending || isConfirming}
              style={{ flex: 1 }}
            >
              {isPending || isConfirming ? 'Creating...' : 'Create Session'}
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

export default CreateSessionModal
