import { create } from "zustand"

export const SORT_TYPES = [
    "default",
    "name",
    "uptime",
    "system",
    "cpu",
    "mem",
    "disk",
    "up",
    "down",
    "up total",
    "down total",
] as const

export const SORT_ORDERS = ["asc", "desc"] as const

export type SortType = (typeof SORT_TYPES)[number]
export type SortOrder = (typeof SORT_ORDERS)[number]

interface SortState {
    sortType: SortType
    sortOrder: SortOrder
    setSortType: (type: SortType) => void
    setSortOrder: (order: SortOrder) => void
}

export const useSort = create<SortState>((set) => ({
    sortType: "default",
    sortOrder: "desc",
    setSortType: (sortType) => set({ sortType }),
    setSortOrder: (sortOrder) => set({ sortOrder }),
})) 