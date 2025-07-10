import { CopyButton } from "@/components/copy-button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { IconButton } from "@/components/xui/icon-button"
import { DateTime } from "luxon"
import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { KeyedMutator } from "swr"

interface ButtonGroupProps<E, U> {
    className?: string
    children: React.ReactNode
    delete: { fn: (id: E[]) => Promise<void>; id: E; mutate: KeyedMutator<U> }
    actions?: {
        start?: () => Promise<void>
        stop?: () => Promise<void>
        token?: (tokenExp?: number, port?: number, mutate?: KeyedMutator<U>) => Promise<any>
    }
    listPort?: (ports?: number) => Promise<any>
    updatePort?: (ports?: number[]) => Promise<any>
    data?: any
}

interface BlockButtonGroupProps<E, U> {
    className?: string
    children?: React.ReactNode
    block: { fn: (id: E[]) => Promise<void>; id: E; mutate: KeyedMutator<U> }
    actions?: {
        start?: () => Promise<void>
        stop?: () => Promise<void>
        token?: (tokenExp?: number, port?: number, mutate?: KeyedMutator<U>) => Promise<any>
    }
    data?: any
}

export function ActionButtonGroup<E, U>({
    className,
    children,
    delete: { fn, id, mutate },
    actions,
    listPort,
    updatePort,
    data,
}: ButtonGroupProps<E, U>) {
    const { t } = useTranslation()
    const [openTokenDialog, setOpenTokenDialog] = useState(false)
    const [openPortDialog, setOpenPortDialog] = useState(false)
    const [openPortResult, setOpenPortResult] = useState<any[]>([])

    const [inputPorts, setInputPorts] = useState<string>("")

    const [tokenResult, setTokenResult] = useState<{
        token: string
        expiry: string | number
    } | null>(null)
    const [tokenExp, setTokenExp] = useState(24)
    const [port, setPort] = useState(-1)

    // Set tokenResult from data.config_detail when dialog opens
    const handleOpenTokenDialog = () => {
        if (data?.config_detail?.token) {
            setTokenResult({
                token: data.config_detail.token,
                expiry: data.config_detail.tokenExpiry || "N/A",
            })
        }
        setOpenTokenDialog(true)
    }

    const handleDelete = async () => {
        try {
            await fn([id])
        } catch (error: any) {
            toast(t("Error"), {
                description: error.message,
            })
        }
        await mutate()
    }

    const handleAction = async (
        action?: (tokenExp?: number, port?: number, mutate?: KeyedMutator<U>) => Promise<any>,
    ) => {
        if (!action) return
        try {
            const result = await action(tokenExp, port, mutate)
            console.log(result)
            if (action === actions?.token) {
                // Cập nhật tokenResult với dữ liệu mới từ result
                if (
                    result &&
                    Array.isArray(result) &&
                    result.length > 0 &&
                    result[0]?.result?.accessToken
                ) {
                    setTokenResult({
                        token: result[0].result.accessToken,
                        expiry: result[0].result.expireTime,
                    })
                    toast(t("Generate Token Success"))
                } else if (result?.accessToken) {
                    // Fallback cho trường hợp response không phải array
                    setTokenResult({
                        token: result.accessToken,
                        expiry: result.expireTime || result.tokenExpiry || "N/A",
                    })
                    toast(t("Generate Token Success"))
                } else {
                    toast(t("Generate Token Failed"))
                }
            } else {
                toast(t("Success"))
                if (mutate) await mutate()
            }
        } catch (error: any) {
            toast(t("Error"), {
                description: error.message,
            })
        }
    }

    const handleOpenPortDialog = async () => {
        if (!listPort) return
        try {

            const result = await listPort(port)
            setOpenPortResult(Array.isArray(result) ? result : []) // <-- store result
            setOpenPortDialog(true)
            // Optionally, you can do something with result here
        } catch (error: any) {
            toast(t("Error"), {
                description: error.message,
            })
        }
    }
    const [isUpdating, setIsUpdating] = useState(false)
    const handelUpdatePort = async () => {
        if (!inputPorts) {
            toast(t("Port not change"))
            return
        }
        if (!updatePort) {
            return
        }
        const port = inputPorts.split(",").map(Number);
        setIsUpdating(true)
        try {
            const result = await updatePort(port);
            console.log(result);
            
            // Reset openPortResult và load lại dữ liệu mới
            setOpenPortResult([]);
            setInputPorts("");
            
            // Load lại dữ liệu mới nếu có listPort function
            if (listPort) {
                const newResults = await Promise.all(
                    port.map(async (p) => {
                        try {
                            return await listPort(p)
                        } catch (err) {
                            toast(t("Error"), {
                                description: (err as any).message,
                            })
                            return null
                        }
                    })
                )
                const flatResults = newResults.flat().filter(Boolean)
                // Lọc trùng theo hostname + service
                const uniqueResults = flatResults.filter(
                  (item, idx, arr) =>
                    arr.findIndex(
                      (x) => x.hostname === item.hostname && x.service === item.service
                    ) === idx
                )
                setOpenPortResult(uniqueResults)
            }
            
            toast(t("Update Success"))
            if (mutate) await mutate()
        } catch (error: any) {
            toast(t("Error"), {
                description: error.message,
            })
        } finally {
            setIsUpdating(false)
        }
    }

    const handleGenerateNewToken = async () => {
        if (!actions?.token) return
        try {
            const result = await actions.token(tokenExp, port, undefined) // Không truyền mutate
            if (
                result &&
                Array.isArray(result) &&
                result.length > 0 &&
                result[0]?.result?.accessToken
            ) {
                setTokenResult({
                    token: result[0].result.accessToken,
                    expiry: result[0].result.expireTime,
                })
                toast(t("Generate Token Success"))
            } else if (result?.accessToken) {
                setTokenResult({
                    token: result.accessToken,
                    expiry: result.expireTime || result.tokenExpiry || "N/A",
                })
                toast(t("Generate Token Success"))
            } else {
                toast(t("Generate Token Failed"))
            }
        } catch (error: any) {
            toast(t("Error"), {
                description: error.message,
            })
        }
    }

    return (
        <div className={className}>
            {children}
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <IconButton variant="destructive" icon="trash" />
                </AlertDialogTrigger>
                <AlertDialogContent className="sm:max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("ConfirmDeletion")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("Results.ThisOperationIsUnrecoverable")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("Close")}</AlertDialogCancel>
                        <AlertDialogAction
                            className={buttonVariants({ variant: "destructive" })}
                            onClick={handleDelete}
                        >
                            {t("Confirm")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {actions && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <IconButton icon="menu" variant="outline" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {actions.start && (
                            <DropdownMenuItem onClick={() => handleAction(actions.start)}>
                                <IconButton
                                    icon="start"
                                    variant="ghost"
                                    className="mr-2 h-4 w-4 p-0 pointer-events-none"
                                />
                                {t("Start")}
                            </DropdownMenuItem>
                        )}
                        {actions.stop && (
                            <DropdownMenuItem onClick={() => handleAction(actions.stop)}>
                                <IconButton
                                    icon="stop"
                                    variant="ghost"
                                    className="mr-2 h-4 w-4 p-0 pointer-events-none"
                                />
                                {t("Stop")}
                            </DropdownMenuItem>
                        )}
                        {actions.token && (
                            <DropdownMenuItem onClick={handleOpenTokenDialog}>
                                <IconButton
                                    icon="token"
                                    variant="ghost"
                                    className="mr-2 h-4 w-4 p-0 pointer-events-none"
                                />
                                {t("Token")}
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={handleOpenPortDialog}>
                            <IconButton
                                icon="token"
                                variant="ghost"
                                className="mr-2 h-4 w-4 p-0 pointer-events-none"
                            />
                            {t("Open Port")}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            {/* Open Port  dialog */}

            <Dialog open={openPortDialog} onOpenChange={setOpenPortDialog}>
                <DialogContent className="sm:max-w-lg mx-auto">
                    <DialogHeader>
                        <DialogTitle>{t("Open Port Result")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <form
                            className="flex items-center gap-2"
                            onSubmit={async (e) => {
                                e.preventDefault()
                                if (!listPort) return
                                // Parse ports from inputPorts (comma or space separated)
                                const ports = inputPorts
                                    .split(/[\s,]+/)
                                    .map((p) => parseInt(p, 10))
                                    .filter((p) => !isNaN(p))
                                if (ports.length === 0) return
                                try {
                                    // Call openPort for each port and aggregate the results
                                    const results = await Promise.all(
                                        ports.map(async (p) => {
                                            try {
                                                return await listPort(p)
                                            } catch (err) {
                                                toast(t("Error"), {
                                                    description: (err as any).message,
                                                })
                                                return null
                                            }
                                        }),
                                    )
                                    const flatResults = results.flat().filter(Boolean)

                                    // Remove duplicates based on hostname and service
                                    const mergedResults = [
                                        ...openPortResult,
                                        ...flatResults.filter(
                                            (newItem) =>
                                                !openPortResult.some(
                                                    (oldItem) =>
                                                        oldItem.hostname === newItem.hostname &&
                                                        oldItem.service === newItem.service,
                                                ),
                                        ),
                                    ]

                                    setOpenPortResult(mergedResults)
                                    setInputPorts("")
                                    if (mutate) await mutate()
                                } catch (error: any) {
                                    toast(t("Error"), { description: error.message })
                                }
                            }}
                        >
                            <Label className="font-semibold">{t("Ports")}:</Label>
                            <Input
                                type="text"
                                placeholder={t("Enter ports, e.g. 8080,9090")}
                                // Hiển thị các port đã được tạo (từ openPortResult) lên input
                                value={
                                    inputPorts ||
                                    (openPortResult.length > 0
                                        ? openPortResult
                                              .map((item) => {
                                                  // Lấy port từ hostname hoặc service nếu có
                                                  // Ví dụ hostname: "8080-idx-vps03-1745342386454.googleidx.click"
                                                  const match = item.hostname?.match(/^(\d+)-/)
                                                  if (match) return match[1]
                                                  // Nếu không lấy được từ hostname thì lấy từ service
                                                  const portFromService =
                                                      item.service?.match(/:(\d+)(?:\/|$)/)
                                                  if (portFromService) return portFromService[1]
                                                  return ""
                                              })
                                              .filter(Boolean)
                                              .join(",")
                                        : "")
                                }
                                onChange={(e) => setInputPorts(e.target.value)}
                                className="flex-1"
                            />
                            <Button type="submit" variant="green" onClick={handelUpdatePort} disabled={isUpdating}>
                                {isUpdating ? (
                                    <span className="flex items-center gap-1">
                                        <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                        </svg>
                                        {t("Updating...")}
                                    </span>
                                ) : (
                                    t("Update")
                                )}
                            </Button>
                        </form>
                        {openPortResult.length > 0 ? (
                            <div className="space-y-2">
                                {openPortResult.map((item, idx) => (
                                    <div key={idx} className="border p-2 rounded space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{t("Hostname")}:</span>
                                            <a
                                                href={`http://${item.hostname}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 underline font-mono break-all"
                                            >
                                                {item.hostname}
                                            </a>
                                            <CopyButton text={item.hostname} className="ml-1" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{t("Service")}:</span>
                                            <a
                                                href={item.service}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 underline font-mono truncate max-w-[250px]"
                                                title={item.service}
                                                style={{ display: "inline-block" }}
                                            >
                                                {item.service}
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-gray-500">{t("No data")}</div>
                        )}
                        {/* New Port Form */}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenPortDialog(false)}>
                            {t("Close")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Token confirm dialog */}
            <Dialog open={openTokenDialog} onOpenChange={setOpenTokenDialog}>
                <DialogContent className="sm:max-w-lg mx-auto">
                    <DialogHeader>
                        <DialogTitle>{t("Generate AccessToken")}</DialogTitle>
                    </DialogHeader>

                    {/* Token configuration form */}
                    <div className="space-y-4 py-4">
                        <div className="flex gap-4">
                            <div className="flex-[2] space-y-2">
                                <Label htmlFor="tokenExp">{t("Token Expiration")}</Label>
                                <Select
                                    value={tokenExp.toString()}
                                    onValueChange={(value) => setTokenExp(Number(value))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select expiration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 {t("hour")}</SelectItem>
                                        <SelectItem value="3">3 {t("hours")}</SelectItem>
                                        <SelectItem value="6">6 {t("hours")}</SelectItem>
                                        <SelectItem value="12">12 {t("hours")}</SelectItem>
                                        <SelectItem value="24">24 {t("hours")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="port">{t("Port")}</Label>
                                <Input
                                    id="port"
                                    type="number"
                                    value={port}
                                    onChange={(e) => setPort(Number(e.target.value))}
                                    placeholder="-1 (default)"
                                />
                            </div>
                        </div>
                    </div>

                    {tokenResult && (
                        <div
                            className="my-2"
                            style={{ maxWidth: 450, maxHeight: 300, overflowY: "auto" }}
                        >
                            <div className="space-y-3">
                                {/* Access Token */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">
                                        {t("Access Token: ")}
                                    </span>
                                    <div
                                        className="bg-black text-white rounded p-2 overflow-x-auto whitespace-pre font-mono [&::-webkit-scrollbar]:hidden"
                                        style={{
                                            userSelect: "text",
                                            maxWidth: "100%",
                                            scrollbarWidth: "none",
                                            msOverflowStyle: "none",
                                            flex: 1,
                                        }}
                                    >
                                        {tokenResult.token}
                                    </div>
                                    <CopyButton text={tokenResult.token} />
                                    <IconButton
                                        variant="green"
                                        icon="refresh"
                                        onClick={async (e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            await handleGenerateNewToken()
                                        }}
                                    />
                                </div>

                                {/* Token Expiration Info */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">
                                        {t("Token Expiration: ")}
                                    </span>
                                    <span className="text-sm text-blue-600 font-mono">
                                        {tokenResult.expiry && tokenResult.expiry !== "N/A"
                                            ? (() => {
                                                  try {
                                                      let dt
                                                      // Kiểm tra nếu là timestamp Unix (số)
                                                      if (typeof tokenResult.expiry === "number") {
                                                          dt = DateTime.fromSeconds(
                                                              tokenResult.expiry,
                                                          )
                                                      } else {
                                                          // Nếu là string ISO
                                                          dt = DateTime.fromISO(tokenResult.expiry)
                                                      }
                                                      return dt.toFormat("dd/MM/yyyy HH:mm")
                                                  } catch (error) {
                                                      return tokenResult.expiry || "N/A"
                                                  }
                                              })()
                                            : "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenTokenDialog(false)}>
                            {t("Close")}
                        </Button>
                        {!tokenResult && (
                            <Button
                                variant="green"
                                onClick={async (e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    await handleGenerateNewToken()
                                }}
                            >
                                {t("Confirm")}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export function BlockButtonGroup<E, U>({
    className,
    children,
    block: { fn, id, mutate },
    actions,
    data,
}: BlockButtonGroupProps<E, U>) {
    const { t } = useTranslation()

    const [openTokenDialog, setOpenTokenDialog] = useState(false)

    const [tokenResult, setTokenResult] = useState<{
        token: string
        expiry: string | number
    } | null>(null)
    const [tokenExp, setTokenExp] = useState(24)
    const [port, setPort] = useState(-1)

    // Set tokenResult from data.config_detail when dialog opens
    const handleOpenTokenDialog = () => {
        if (data?.config_detail?.token) {
            setTokenResult({
                token: data.config_detail.token,
                expiry: data.config_detail.tokenExpiry || "N/A",
            })
        }
        setOpenTokenDialog(true)
    }

    const handleBlock = async () => {
        try {
            await fn([id])
        } catch (error: any) {
            toast(t("Error"), {
                description: error.message,
            })
        }
        await mutate()
    }

    const handleAction = async (
        action?: (tokenExp?: number, port?: number, mutate?: KeyedMutator<U>) => Promise<any>,
    ) => {
        if (!action) return
        try {
            const result = await action(tokenExp, port, mutate)
            if (action === actions?.token) {
                // Cập nhật tokenResult với dữ liệu mới từ result
                if (
                    result &&
                    Array.isArray(result) &&
                    result.length > 0 &&
                    result[0]?.result?.accessToken
                ) {
                    setTokenResult({
                        token: result[0].result.accessToken,
                        expiry: result[0].result.expireTime,
                    })
                    toast(t("Generate Token Success"))
                } else if (result?.accessToken) {
                    // Fallback cho trường hợp response không phải array
                    setTokenResult({
                        token: result.accessToken,
                        expiry: result.expireTime || result.tokenExpiry || "N/A",
                    })
                    toast(t("Generate Token Success"))
                } else {
                    toast(t("Generate Token Failed"))
                }
            } else {
                toast(t("Success"))
                // Chỉ gọi mutate cho các action khác
                if (mutate) await mutate()
            }
        } catch (error: any) {
            toast(t("Error"), {
                description: error.message,
            })
        }
    }

    return (
        <div className={className}>
            {children}
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <IconButton variant="destructive" icon="ban" />
                </AlertDialogTrigger>
                <AlertDialogContent className="sm:max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("ConfirmBlock")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("Results.ThisOperationIsUnrecoverable")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("Close")}</AlertDialogCancel>
                        <AlertDialogAction
                            className={buttonVariants({ variant: "destructive" })}
                            onClick={handleBlock}
                        >
                            {t("Confirm")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {actions && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <IconButton icon="menu" variant="outline" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {actions.start && (
                            <DropdownMenuItem onClick={() => handleAction(actions.start)}>
                                <IconButton
                                    icon="start"
                                    variant="ghost"
                                    className="mr-2 h-4 w-4 p-0 pointer-events-none"
                                />
                                {t("Start")}
                            </DropdownMenuItem>
                        )}
                        {actions.stop && (
                            <DropdownMenuItem onClick={() => handleAction(actions.stop)}>
                                <IconButton
                                    icon="stop"
                                    variant="ghost"
                                    className="mr-2 h-4 w-4 p-0 pointer-events-none"
                                />
                                {t("Stop")}
                            </DropdownMenuItem>
                        )}
                        {actions.token && (
                            <DropdownMenuItem onClick={handleOpenTokenDialog}>
                                <IconButton
                                    icon="token"
                                    variant="ghost"
                                    className="mr-2 h-4 w-4 p-0 pointer-events-none"
                                />
                                {t("Token")}
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            {/* Token confirm dialog */}
            <Dialog open={openTokenDialog} onOpenChange={setOpenTokenDialog}>
                <DialogContent className="sm:max-w-lg mx-auto">
                    <DialogHeader>
                        <DialogTitle>{t("Generate AccessToken")}</DialogTitle>
                    </DialogHeader>

                    {/* Token configuration form */}
                    <div className="space-y-4 py-4">
                        <div className="flex gap-4">
                            <div className="flex-[2] space-y-2">
                                <Label htmlFor="tokenExp">{t("Token Expiration")}</Label>
                                <Select
                                    value={tokenExp.toString()}
                                    onValueChange={(value) => setTokenExp(Number(value))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select expiration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 {t("hour")}</SelectItem>
                                        <SelectItem value="3">3 {t("hours")}</SelectItem>
                                        <SelectItem value="6">6 {t("hours")}</SelectItem>
                                        <SelectItem value="12">12 {t("hours")}</SelectItem>
                                        <SelectItem value="24">24 {t("hours")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="port">{t("Port")}</Label>
                                <Input
                                    id="port"
                                    type="number"
                                    value={port}
                                    onChange={(e) => setPort(Number(e.target.value))}
                                    placeholder="-1 (default)"
                                />
                            </div>
                        </div>
                    </div>

                    {tokenResult && (
                        <div className="my-2" style={{ maxWidth: 450 }}>
                            <div className="space-y-3">
                                {/* Access Token */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">{t("Access Token: ")}</span>
                                    <div
                                        className="bg-black text-white rounded p-2 overflow-x-auto whitespace-pre font-mono [&::-webkit-scrollbar]:hidden"
                                        style={{
                                            userSelect: "text",
                                            maxWidth: "100%",
                                            scrollbarWidth: "none",
                                            msOverflowStyle: "none",
                                            flex: 1,
                                        }}
                                    >
                                        {tokenResult.token}
                                    </div>
                                    <CopyButton text={tokenResult.token} />
                                </div>

                                {/* Token Expiration Info */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">{t("Token Expiration: ")}</span>
                                    <span className="text-sm text-blue-600 font-mono">
                                        {tokenResult.expiry && tokenResult.expiry !== "N/A"
                                            ? (() => {
                                                  try {
                                                      let dt
                                                      // Kiểm tra nếu là timestamp Unix (số)
                                                      if (typeof tokenResult.expiry === "number") {
                                                          dt = DateTime.fromSeconds(
                                                              tokenResult.expiry,
                                                          )
                                                      } else {
                                                          // Nếu là string ISO
                                                          dt = DateTime.fromISO(tokenResult.expiry)
                                                      }
                                                      return dt.toFormat("dd/MM/yyyy HH:mm")
                                                  } catch (error) {
                                                      return tokenResult.expiry || "N/A"
                                                  }
                                              })()
                                            : "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenTokenDialog(false)}>
                            {t("Close")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
