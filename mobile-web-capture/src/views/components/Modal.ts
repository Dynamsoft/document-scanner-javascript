// utils/modal.ts
export interface ModalConfig {
  title: string;
  placeholder?: string;
  initialValue?: string;
  confirmText?: string;
  onConfirm: (value: string) => void;
}

export function showModal(config: ModalConfig) {
  const modalContainer = document.createElement("div");
  modalContainer.className = "mwc-modal-overlay";
  modalContainer.innerHTML = `
    <div class="mwc-modal">
      <div class="mwc-modal-title">${config.title}</div>
      <input 
        type="text" 
        class="mwc-modal-input" 
        placeholder="${config.placeholder || ""}"
        value="${config.initialValue || ""}"
        maxlength="100"
      >
      <div class="mwc-modal-actions">
        <button class="mwc-modal-btn cancel">Cancel</button>
        <button class="mwc-modal-btn confirm">${config.confirmText || "OK"}</button>
      </div>
    </div>
  `;

  // Add styles
  const styleSheet = document.createElement("style");
  styleSheet.textContent = MODAL_STYLES;
  document.head.appendChild(styleSheet);

  // Add to document
  document.body.appendChild(modalContainer);

  // Get elements
  const input = modalContainer.querySelector(".mwc-modal-input") as HTMLInputElement;
  const confirmBtn = modalContainer.querySelector(".confirm");
  const cancelBtn = modalContainer.querySelector(".cancel");

  input?.focus();

  confirmBtn?.addEventListener("click", () => {
    config.onConfirm(input.value.trim());
    modalContainer.remove();
  });

  cancelBtn?.addEventListener("click", () => {
    modalContainer.remove();
  });

  input?.addEventListener("input", (e) => {
    const target = e.target as HTMLInputElement;
    let value = target.value.replace(/[^a-zA-Z0-9-_ ]/g, "");
    if (value.startsWith(" ")) {
      value = value.trimStart();
    }
    target.value = value;
  });

  // Enter key confirms
  input?.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      config.onConfirm(input.value.trim());
      modalContainer.remove();
    }
  });
}

const MODAL_STYLES = `
.mwc-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.mwc-modal {
  background-color: white;
  padding: 24px;
  border-radius: 8px;
  width: 90%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mwc-modal-title {
  font-size: 18px;
  font-family: Verdana;
}

.mwc-modal-input {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  font-family: Verdana;
}

.mwc-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.mwc-modal-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-family: Verdana;
  font-size: 14px;
  cursor: pointer;
}

.mwc-modal-btn.cancel {
  background-color: #f5f5f5;
  color: #333;
}

.mwc-modal-btn.confirm {
  background-color: #FE8E14;
  color: white;
}
`;
