import { createContext, useContext, useState } from "react";

interface MediaLibraryContextType {
  selectedFiles: Set<string>;
  isSelectionMode: boolean;
  toggleFileSelection: (id: string) => void;
  toggleSelectionMode: () => void;
  clearSelection: () => void;
}

const MediaLibraryContext = createContext<MediaLibraryContextType | undefined>(undefined);

export function MediaLibraryProvider({ children }: { children: React.ReactNode }) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const toggleFileSelection = (id: string) => {
    const newSelectedFiles = new Set(selectedFiles);
    if (selectedFiles.has(id)) {
      newSelectedFiles.delete(id);
    } else {
      newSelectedFiles.add(id);
    }
    setSelectedFiles(newSelectedFiles);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (!isSelectionMode) {
      setSelectedFiles(new Set());
    }
  };

  const clearSelection = () => {
    setSelectedFiles(new Set());
  };

  return (
    <MediaLibraryContext.Provider
      value={{
        selectedFiles,
        isSelectionMode,
        toggleFileSelection,
        toggleSelectionMode,
        clearSelection,
      }}
    >
      {children}
    </MediaLibraryContext.Provider>
  );
}

export function useMediaLibrary() {
  const context = useContext(MediaLibraryContext);
  if (context === undefined) {
    throw new Error("useMediaLibrary must be used within a MediaLibraryProvider");
  }
  return context;
}