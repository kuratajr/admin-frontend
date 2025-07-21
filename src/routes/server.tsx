import { swrFetcher } from "@/api/api"
import { deleteServer, forceUpdateServer, getPort, startFn, stopFn, tokenFn, updatePort } from "@/api/server"
import { ActionButtonGroup } from "@/components/action-button-group"
import { BatchMoveServerIcon } from "@/components/batch-move-server-icon"
import { CopyButton } from "@/components/copy-button"
import { GroupSwitch } from "@/components/group-switch"
import { HeaderButtonGroup } from "@/components/header-button-group"
import { InstallCommandsMenu } from "@/components/install-commands"
import { NoteMenu } from "@/components/note-menu"
import { ServerTab } from "@/components/server-tab"
import { ServerCard } from "@/components/server"
import { ServerConfigCard } from "@/components/server-config"
import { ServerConfigCardBatch } from "@/components/server-config-batch"
import { TerminalButton } from "@/components/terminal"
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
import { cn, joinIP } from "@/lib/utils"
import { ModelServerTaskResponse, ModelServer as Server } from "@/types"
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import useSWR from "swr"

export default function ServerPage() {
    const { t } = useTranslation()
    const { data, mutate, error, isLoading } = useSWR<Server[]>("/api/v1/server", swrFetcher)
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

    const columns: ColumnDef<Server>[] = [
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
            accessorFn: (row) => `${row.id}(${row.display_index})`,
        },
        {
            header: t("Name"),
            accessorKey: "name",
            accessorFn: (row) => row.name,
            cell: ({ row }) => {
                const s = row.original
                return <div className="max-w-24 whitespace-normal break-words">{s.name}</div>
            },
        },
        {
            header: t("Group"),
            accessorKey: "groups",
            accessorFn: (row) => {
                return (
                    serverGroups
                        ?.filter((sg) => sg.servers?.includes(row.id))
                        .map((sg) => sg.group.id) || []
                )
            },
        },
        {
            id: "ip",
            header: "IP",
            cell: ({ row }) => {
                const s = row.original
                return (
                    <div className="max-w-24 whitespace-normal break-words">
                        {joinIP(s.geoip?.ip)}
                    </div>
                )
            },
        },
        {
            header: t("Version"),
            accessorKey: "host.version",
            accessorFn: (row) => row.host.version || t("Unknown"),
        },
        {
            header: t("EnableDDNS"),
            accessorKey: "enableDDNS",
            accessorFn: (row) => row.enable_ddns ?? false,
        },
        {
            header: t("HideForGuest"),
            accessorKey: "hideForGuest",
            accessorFn: (row) => row.hide_for_guest ?? false,
        },
        {
            id: "note",
            header: t("Note"),
            cell: ({ row }) => {
                const s = row.original
                return <NoteMenu note={{ private: s.note, public: s.public_note }} />
            },
        },
        {
            id: "uuid",
            header: "UUID",
            cell: ({ row }) => {
                const s = row.original
                return <CopyButton text={s.uuid} />
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
                        delete={{ fn: (id: number[]) => deleteServer(id, "server"), id: s.id, mutate: mutate }}
                        actions={{
                            start: () => startFn([s.id], "server"),
                            stop: () => stopFn([s.id], "server"),
                            token: async (tokenExp?: number, port?: number, mutate?: any) => {
                                const result = await tokenFn({
                                    servers: [s.id],
                                    tokenExp: tokenExp ?? 24,
                                    port: port ?? -1,
                                }, "server")
                                if (mutate) await mutate()
                                return result
                            },
                        }}
                        listPort={async (port?: number) => {
                            // Call getPort API with server id and port
                            return await getPort({ servers: [s.id], ports:  [port ?? -1]  })
                        }}
                        updatePort={async (port?: number[]) => {
                            // Call updatePort API with server id and port
                            return await updatePort({ servers: [s.id], ports: port ?? [] })
                        }}
                        data={s}
                    >
                        <>
                            <TerminalButton id={s.id} />
                            <ServerCard mutate={mutate} data={s} />
                            <ServerConfigCard sid={s.id} variant="outline" />
                        </>
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
                    case "uptime":
                        comparison = (a.state?.uptime ?? 0) - (b.state?.uptime ?? 0)
                        break
                    case "system":
                        comparison = (a.host?.platform ?? "").localeCompare(b.host?.platform ?? "")
                        break
                    case "cpu":
                        comparison = (a.state?.cpu ?? 0) - (b.state?.cpu ?? 0)
                        break
                    case "mem":
                        comparison = (a.state?.mem_used ?? 0) - (b.state?.mem_used ?? 0)
                        break
                    case "disk":
                        comparison = (a.state?.disk_used ?? 0) - (b.state?.disk_used ?? 0)
                        break
                    case "up":
                        comparison = (a.state?.net_out_speed ?? 0) - (b.state?.net_out_speed ?? 0)
                        break
                    case "down":
                        comparison = (a.state?.net_in_speed ?? 0) - (b.state?.net_in_speed ?? 0)
                        break
                    case "up total":
                        comparison =
                            (a.state?.net_out_transfer ?? 0) - (b.state?.net_out_transfer ?? 0)
                        break
                    case "down total":
                        comparison =
                            (a.state?.net_in_transfer ?? 0) - (b.state?.net_in_transfer ?? 0)
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
                            fn: (id: number[]) => deleteServer(id, "server"),
                            id: selectedRows.map((r) => r.original.id),
                            mutate: mutate,
                        }}
                        actions={{
                            start: () => startFn(selectedRows.map((r) => r.original.id), "server"),
                            stop: () => stopFn(selectedRows.map((r) => r.original.id), "server"),
                            token: async (tokenExp?: number, port?: number, mutate?: any) => {
                                const result = await tokenFn({
                                    servers: selectedRows.map((r) => r.original.id),
                                    tokenExp: tokenExp ?? 24,
                                    port: port ?? -1,
                                }, "server")
                                if (mutate) await mutate()
                                return result
                            },
                        }}
                    >
                        <IconButton
                            icon="update"
                            onClick={async () => {
                                const id = selectedRows.map((r) => r.original.id)
                                if (id.length < 1) {
                                    toast(t("Error"), {
                                        description: t("Results.SelectAtLeastOneServer"),
                                    })
                                    return
                                }

                                let resp: ModelServerTaskResponse = {}
                                try {
                                    resp = await forceUpdateServer(id)
                                } catch (e) {
                                    console.error(e)
                                    toast(t("Error"), {
                                        description: t("Results.UnExpectedError"),
                                    })
                                    return
                                }
                                toast(t("Done"), {
                                    description:
                                        t("Results.ForceUpdate") +
                                        (resp.success?.length
                                            ? t(`Success`) + ` [${resp.success.join(",")}]`
                                            : "") +
                                        (resp.failure?.length
                                            ? t(`Failure`) + ` [${resp.failure.join(",")}]`
                                            : "") +
                                        (resp.offline?.length
                                            ? t(`Offline`) + ` [${resp.offline.join(",")}]`
                                            : ""),
                                })
                            }}
                        />

                        <BatchMoveServerIcon serverIds={selectedRows.map((r) => r.original.id)} />
                        <ServerConfigCardBatch
                            sid={selectedRows.map((r) => r.original.id)}
                            className="shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] bg-yellow-600 text-white hover:bg-yellow-500 dark:hover:bg-yellow-700 rounded-lg"
                        />
                        <InstallCommandsMenu className="shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] bg-blue-700 text-white hover:bg-blue-600 dark:hover:bg-blue-800 rounded-lg" />
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
