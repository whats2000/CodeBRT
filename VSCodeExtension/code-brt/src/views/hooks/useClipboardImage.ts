import { useEffect } from 'react';

export const useClipboardImage = (onPaste: (files: FileList) => void) => {
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (event.clipboardData) {
        const items = event.clipboardData.items;
        const files: File[] = [];

        console.log('items', ...items);

        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
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
