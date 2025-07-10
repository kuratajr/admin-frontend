import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

interface GroupSwitchProps {
    tabs: string[]
    currentTab: string
    setCurrentTab: (tab: string) => void
}

export const GroupSwitch = ({ tabs, currentTab, setCurrentTab }: GroupSwitchProps) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "rounded-[50px] flex items-center gap-1 dark:text-white border dark:border-none text-black cursor-pointer dark:[text-shadow:_0_1px_0_rgb(0_0_0_/_20%)] dark:bg-stone-800 bg-white p-[10px] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]",
                    {
                        "shadow-[inset_0_1px_0_rgba(0,0,0,0.2)] dark:bg-stone-700 bg-stone-200": isOpen,
                    },
                )}
            >
                <span className="text-[10px] font-bold whitespace-nowrap">{currentTab}</span>
                <ChevronDown className="size-[13px]" />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg z-50 min-w-[120px]">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setCurrentTab(tab)
                                setIsOpen(false)
                            }}
                            className={cn(
                                "w-full text-left px-3 py-2 text-sm hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors",
                                {
                                    "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300": currentTab === tab,
                                },
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
} 