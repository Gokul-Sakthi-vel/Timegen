import { useState, useCallback, useMemo, useEffect } from 'react';

/**
 * useSelection
 * Handles centralized multi-selection state for lists of items
 * @param items Array of item objects, each must have an 'id' property
 */
export function useSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  useEffect(() => {
    if (selectedIds.length === 0 && isSelectionMode) {
      setIsSelectionMode(false);
    }
  }, [selectedIds.length, isSelectionMode]);

  const isSelected = useCallback((id: string) => selectedIds.includes(id), [selectedIds]);

  const toggleItem = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(items.map((i) => i.id));
    setIsSelectionMode(true);
  }, [items]);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
    setIsSelectionMode(false);
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectedIds([]);
    setIsSelectionMode(false);
  }, []);

  const isAllSelected = useMemo(() => {
    if (items.length === 0) return false;
    return items.every((item) => selectedIds.includes(item.id));
  }, [items, selectedIds]);

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [isAllSelected, selectAll, deselectAll]);

  const selectSingle = useCallback((id: string) => {
    setSelectedIds([id]);
    setIsSelectionMode(true);
  }, []);

  return {
    selectedIds,
    setSelectedIds,
    isSelected,
    toggleItem,
    selectAll,
    deselectAll,
    exitSelectionMode,
    isSelectionMode,
    setIsSelectionMode,
    isAllSelected,
    toggleSelectAll,
    selectSingle,
    count: selectedIds.length,
  };
}
