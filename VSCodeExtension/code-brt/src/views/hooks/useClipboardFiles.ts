import { useEffect } from 'react';

export const useClipboardFiles = (onPaste: (files: FileList) => void) => {
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (event.clipboardData) {
        const items = event.clipboardData.items;
        const files: File[] = [];

        for (let i = 0; i < items.length; i++) {
          // png, jpeg, jpg, gif, webp support only
          if (
            [
              'image/png',
              'image/jpeg',
              'image/jpg',
              'image/gif',
              'image/webp',
            ].includes(items[i].type)
          ) {
            const blob = items[i].getAsFile();
            if (blob) {
              files.push(blob);
            }
          }

          if (items[i].type === 'application/pdf') {
            const blob = items[i].getAsFile();
            if (blob) {
              files.push(blob);
            }
          }
        }

        if (files.length > 0) {
          const fileList = new DataTransfer();
          files.forEach((file) => fileList.items.add(file));
          onPaste(fileList.files);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [onPaste]);
};
