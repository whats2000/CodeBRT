import { useEffect, useRef } from 'react';

export const useDragAndDrop = (onDrop: (files: FileList) => void) => {
  const dropRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      const files = event.dataTransfer?.files;

      if (!files) {
        return;
      }

      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith('image/'),
      );
      if (imageFiles.length > 0) {
        const fileList = new DataTransfer();
        imageFiles.forEach((file) => fileList.items.add(file));
        onDrop(fileList.files);
      }
    };

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
    };

    const element = dropRef.current;
    if (element) {
      element.addEventListener('drop', handleDrop);
      element.addEventListener('dragover', handleDragOver);
    } else {
      console.error('Element is null');
    }

    return () => {
      if (element) {
        element.removeEventListener('drop', handleDrop);
        element.removeEventListener('dragover', handleDragOver);
      }
    };
  }, [onDrop]);

  return dropRef;
};
