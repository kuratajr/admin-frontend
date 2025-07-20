import { swrFetcher } from "@/api/api"
import {
    deleteServer,
    getPort,
    startFn,
    stopFn,
    syncWorkspace,
    tokenFn,
    updatePort,
} from "@/api/server"
import { ActionButtonGroup } from "@/components/action-button-group"

import { CopyButton } from "@/components/copy-button"
import { GroupSwitch } from "@/components/group-switch"
import { HeaderButtonGroup } from "@/components/header-button-group"

import { ServerTab } from "@/components/server-tab"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { IconButton } from "@/components/xui/icon-button"
import { useServer } from "@/hooks/useServer"
import { SORT_ORDERS, SORT_TYPES, useSort } from "@/hooks/useSort"
import { cn} from "@/lib/utils"

import {
    ModelWorkspaceTaskResponse,
    ModelServerList as ServerList,
} from "@/types"
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import useSWR from "swr"

export default function ServerListPage() {
    const { t } = useTranslation()
    const { data, mutate, error, isLoading } = useSWR<ServerList[]>(
        "/api/v1/server-list",
        swrFetcher,
    )
    const { serverGroups } = useServer()
    const { sortType, sortOrder, setSortOrder, setSortType } = useSort()
    const [currentGroup, setCurrentGroup] = useState<string>("All")
    const [settingsOpen, setSettingsOpen] = useState<boolean>(false)

    useEffect(() => {
        if (error)
            toast(t("Error"), {
                description: t("Results.ErrorFetchingResource", { error: error.message }),
            })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error])

    const columns: ColumnDef<ServerList>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            header: "ID",
            accessorKey: "id",
            accessorFn: (row) => `${row.id}`,
        },
        {
            header: t("Name"),
            accessorKey: "name",
            accessorFn: (row) => row.name,
            cell: ({ row }) => {
                const s = row.original
                return <div className="max-w-60 whitespace-normal break-words">{s.name}</div>
            },
        },
        {
            header: t("Create Email"),
            accessorKey: "creator_email",
            accessorFn: (row) => row.creator_email,
            cell: ({ row }) => {
                const s = row.original
                return (
                    <div className="max-w-60 whitespace-normal break-words">{s.creator_email}</div>
                )
            },
        },
        {
            header: "Host",
            cell: ({ row }) => {
                const s = row.original
                return <CopyButton text={s.host} />
            },
        },
        {
            id: "actions",
            header: t("Actions"),
            cell: ({ row }) => {
                const s = row.original
                return (
                    <ActionButtonGroup
                        className="flex gap-2"
                        delete={{ fn: deleteServer, id: s.id, mutate: mutate }}
                        actions={{
                            start: () => startFn([s.id], "serverlist"),
                            stop: () => stopFn([s.id], "serverlist"),
                            token: async (tokenExp?: number, port?: number, mutate?: any) => {
                                const result = await tokenFn(
                                    {
                                        servers: [s.id],
                                        tokenExp: tokenExp ?? 24,
                                        port: port ?? -1,
                                    },
                                    "serverlist",
                                )
                                if (mutate) await mutate()
                                return result
                            },
                        }}
                        listPort={async (port?: number) => {
                            // Call getPort API with server id and port
                            return await getPort({ servers: [s.id], ports: [port ?? -1] })
                        }}
                        updatePort={async (port?: number[]) => {
                            // Call updatePort API with server id and port
                            return await updatePort({ servers: [s.id], ports: port ?? [] })
                        }}
                        data={s}
                    >
                        <></>
                    </ActionButtonGroup>
                )
            },
        },
    ]

    // Create group tabs for filtering
    const groupTabs = useMemo(() => {
        return ["All", ...(serverGroups?.map((sg) => sg.group.name).filter((name) => name) || [])]
    }, [serverGroups])

    // Filter and sort data
    const filteredAndSortedData = useMemo(() => {
        if (!data) return []

        let filteredData = data

        // Filter by group
        if (currentGroup !== "All") {
            filteredData = data.filter((server) => {
                return serverGroups?.some(
                    (sg) => sg.group.name === currentGroup && sg.servers?.includes(server.id),
                )
            })
        }

        // Sort data
        if (sortType !== "default") {
            filteredData = [...filteredData].sort((a, b) => {
                let comparison = 0

                switch (sortType) {
                    case "name":
                        comparison = a.name.localeCompare(b.name)
                        break
                    default:
                        comparison = 0
                }

                return sortOrder === "asc" ? comparison : -comparison
            })
        }

        return filteredData
    }, [data, currentGroup, serverGroups, sortType, sortOrder])

    const table = useReactTable({
        data: filteredAndSortedData,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    const selectedRows = table.getSelectedRowModel().rows

    return (
        <div className="px-3">
            <div className="flex mt-6 mb-4">
                {/* <h1 className="text-3xl font-bold tracking-tight">{t("Server")}</h1> */}
                <ServerTab className="flex-1 mr-4 sm:max-w-[40%]" />

                <div className="flex items-center gap-2 ml-auto">
                    <GroupSwitch
                        tabs={groupTabs}
                        currentTab={currentGroup}
                        setCurrentTab={setCurrentGroup}
                    />
                    <Popover onOpenChange={setSettingsOpen}>
                        <PopoverTrigger asChild>
                            <button
                                className={cn(
                                    "rounded-[50px] flex items-center gap-1 dark:text-white border dark:border-none text-black cursor-pointer dark:[text-shadow:_0_1px_0_rgb(0_0_0_/_20%)] dark:bg-stone-800 bg-white p-[10px] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]",
                                    {
                                        "shadow-[inset_0_1px_0_rgba(0,0,0,0.2)] dark:bg-stone-700 bg-stone-200":
                                            settingsOpen,
                                    },
                                )}
                            >
                                <span className="text-[10px] font-bold whitespace-nowrap">
                                    {sortType === "default" ? "Sort" : sortType.toUpperCase()}
                                </span>
                                {sortOrder === "asc" && sortType !== "default" ? (
                                    <ArrowUp className="size-[13px]" />
                                ) : sortOrder === "desc" && sortType !== "default" ? (
                                    <ArrowDown className="size-[13px]" />
                                ) : (
                                    <ArrowUpDown className="size-[13px]" />
                                )}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="p-4 w-[240px] rounded-lg">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-muted-foreground">
                                        Sort by
                                    </Label>
                                    <Select value={sortType} onValueChange={setSortType}>
                                        <SelectTrigger className="w-full text-xs h-8">
                                            <SelectValue placeholder="Choose type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SORT_TYPES.map((type) => (
                                                <SelectItem
                                                    key={type}
                                                    value={type}
                                                    className="text-xs"
                                                >
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-muted-foreground">
                                        Sort order
                                    </Label>
                                    <Select
                                        value={sortOrder}
                                        onValueChange={setSortOrder}
                                        disabled={sortType === "default"}
                                    >
                                        <SelectTrigger className="w-full text-xs h-8">
                                            <SelectValue placeholder="Choose order" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SORT_ORDERS.map((order) => (
                                                <SelectItem
                                                    key={order}
                                                    value={order}
                                                    className="text-xs"
                                                >
                                                    {order.charAt(0).toUpperCase() + order.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <HeaderButtonGroup
                        className="flex gap-2"
                        delete={{
                            fn: deleteServer,
                            id: selectedRows.map((r) => r.original.id),
                            mutate: mutate,
                        }}
                        actions={{
                            start: () =>
                                startFn(
                                    selectedRows.map((r) => r.original.id),
                                    "serverlist",
                                ),
                            stop: () =>
                                stopFn(
                                    selectedRows.map((r) => r.original.id),
                                    "serverlist",
                                ),
                            token: async (tokenExp?: number, port?: number, mutate?: any) => {
                                const result = await tokenFn(
                                    {
                                        servers: selectedRows.map((r) => r.original.id),
                                        tokenExp: tokenExp ?? 24,
                                        port: port ?? -1,
                                    },
                                    "serverlist",
                                )
                                if (mutate) await mutate()
                                return result
                            },
                        }}
                    >
                        <IconButton
                            className="shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] bg-blue-700 text-white hover:bg-blue-600 dark:hover:bg-blue-800 rounded-lg"
                            icon="update"
                            onClick={async () => {
                                let resp: ModelWorkspaceTaskResponse = {}
                                try {
                                    resp = await syncWorkspace()
                                } catch (e) {
                                    console.error(e)
                                    toast(t("Error"), {
                                        description: t("Results.UnExpectedError"),
                                    })
                                    return
                                }
                                toast(t("Done"), {
                                    description:
                                        t("Results.SuccessfullyUpdatedWorkspace") +
                                        (resp.message?.length
                                            ? t(` Success `) + ` [${resp.message}]`
                                            : ""),
                                })
                            }}
                        />
                    </HeaderButtonGroup>
                </div>
            </div>
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id} className="text-sm">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef.header,
                                                  header.getContext(),
                                              )}
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                {t("Loading")}...
                            </TableCell>
                        </TableRow>
                    ) : table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} className="text-xsm">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                {t("NoResults")}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
