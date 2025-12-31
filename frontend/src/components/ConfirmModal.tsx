import './ConfirmModal.css'

interface ConfirmModalProps {
  isOpen: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
}

const ConfirmModal = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
  confirmText = '확인',
  cancelText = '취소',
}: ConfirmModalProps) => {
  if (!isOpen) return null

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        <p className="confirm-modal-message">{message}</p>
        <div className="confirm-modal-buttons">
          <button className="confirm-modal-button cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="confirm-modal-button confirm" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal

