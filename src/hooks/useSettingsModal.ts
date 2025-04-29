import { useEffect, useRef, useState } from "react";

export const useSettingsModal = () => {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const settingsDialogRef = useRef<HTMLDialogElement>(
    null
  ) as React.RefObject<HTMLDialogElement>;

  useEffect(() => {
    const dialog = settingsDialogRef.current;
    if (!dialog) return;

    if (isSettingsModalOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
    return () => {
      if (dialog && dialog.open) {
        dialog.close();
      }
    };
  }, [isSettingsModalOpen]);

  return {
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    settingsDialogRef,
  };
};
