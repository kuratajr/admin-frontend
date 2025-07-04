import { updateServers } from "@/api/server"
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
import { buttonVariants } from "@/components/ui/button"
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
import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { KeyedMutator } from "swr"

interface ButtonGroupProps<E, U> {
    className?: string
    children?: React.ReactNode
    delete: { fn: (id: E[]) => Promise<void>; id: E[]; mutate: KeyedMutator<U> }
    actions?: {
        start?: () => Promise<void>
        stop?: () => Promise<void>
        token?: () => Promise<{ accessToken: string; expireTime: string }>
        update?: () => Promise<void>
    }
}

interface ButtonBlockGroupProps<E, U> {
    className?: string
    children?: React.ReactNode
    block: { fn: (id: E[]) => Promise<void>; id: E[]; mutate: KeyedMutator<U> }
}

export function HeaderButtonGroup<E, U>({
    className,
    children,
    delete: { fn, id, mutate },
    actions,
}: ButtonGroupProps<E, U>) {
    const { t } = useTranslation()

    // State để hiển thị kết quả
    const [tokenResult, setTokenResult] = useState<string | null>(null)
    const [tokenExp, setTokenExp] = useState(24)
    const [port, setPort] = useState(-1)

    const handleDelete = async () => {
        try {
            await fn(id)
        } catch (error: any) {
            toast(t("Error"), {
                description: error.message,
            })
        }
        await mutate()
    }

    const handleAction = async (action?: (tokenExp?: number, port?: number) => Promise<any>) => {
        if (!action) return
        try {
            const result = await action(tokenExp, port)
            if (action === actions?.token) {
                setTokenResult(result)
            } else {
                toast(t("Success"))
            }
        } catch (error: any) {
            toast(t("Error"), {
                description: error.message,
            })
        }
        await mutate()
    }

    const handleUpdateServers = async () => {
        try {
            await updateServers(id.map(Number))
            toast.success(t("PullServerConfigSuccess"))
        } catch (e) {
            toast.error(t("Error"), { description: t("PullServerConfigFailed") })
        }
    }


    return (
        <div className={className}>
            {id.length < 1 ? (
                <>  
                    <IconButton
                        variant="blue"
                        icon="down"
                        onClick={() => {
                            toast(t("Error"), {
                                description: t("Results.NoRowsAreSelected"),
                            })
                        }}
                    />
                    <IconButton
                        variant="green"
                        icon="play"
                        onClick={() => {
                            toast(t("Error"), {
                                description: t("Results.NoRowsAreSelected"),
                            })
                        }}
                    />
                    <IconButton
                        variant="lightred"
                        icon="stop"
                        onClick={() => {
                            toast(t("Error"), {
                                description: t("Results.NoRowsAreSelected"),
                            })
                        }}
                    />
                    <IconButton
                        variant="lightpink"
                        icon="token"
                        onClick={() => {
                            toast(t("Error"), {
                                description: t("Results.NoRowsAreSelected"),
                            })
                        }}
                    />
                    <IconButton
                        variant="destructive"
                        icon="trash"
                        onClick={() => {
                            toast(t("Error"), {
                                description: t("Results.NoRowsAreSelected"),
                            })
                        }}
                    />
                    {children}
                </>
            ) : (
                <>
                    <IconButton
                        variant="blue"
                        icon="down"
                        onClick={() => handleUpdateServers()}
                    />
                    <IconButton
                        variant="green"
                        icon="play"
                        onClick={() => handleAction(actions?.start)}
                    />
                    <IconButton
                        variant="lightred"
                        icon="stop"
                        onClick={() => handleAction(actions?.stop)}
                    />
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <IconButton variant="lightpink" icon="token" />
                        </AlertDialogTrigger>
                        <AlertDialogContent className="sm:max-w-lg mx-auto">
                            <AlertDialogHeader>
                                <AlertDialogTitle>{t("Generate AccessToken")}</AlertDialogTitle>
                            </AlertDialogHeader>
                            
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
                                    {Array.isArray(tokenResult) ? (
                                        tokenResult.map((item: any, idx: number) => (
                                            <div
                                                key={item.id || idx}
                                                className="flex items-center gap-2 mb-2"
                                            >
                                                <span className="text-sm">
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
                                                    {item.result?.accessToken}
                                                </div>
                                                <CopyButton text={item.result?.accessToken} />
                                            </div>
                                        ))
                                    ) : (
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
                                                {tokenResult}
                                            </div>
                                            <CopyButton text={tokenResult} />
                                        </div>
                                    )}
                                </div>
                            )}
                            <AlertDialogFooter>
                                <AlertDialogCancel>{t("Close")}</AlertDialogCancel>
                                <AlertDialogAction
                                    className={buttonVariants({ variant: "green" })}
                                    onClick={async (e) => {
                                        e.preventDefault() // Ngăn dialog tự đóng
                                        await handleAction(actions?.token)
                                    }}
                                >
                                    {t("Confirm")}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

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
                    {children}
                </>
            )}
        </div>
    )
}

export function HeaderBlockButtonGroup<E, U>({
    className,
    children,
    block: { fn, id, mutate },
}: ButtonBlockGroupProps<E, U>) {
    const { t } = useTranslation()

    const handleBlock = async () => {
        try {
            await fn(id)
        } catch (error: any) {
            toast(t("Error"), {
                description: error.message,
            })
        }
        await mutate()
    }
    return (
        <div className={className}>
            {id.length < 1 ? (
                <>
                    <IconButton
                        variant="destructive"
                        icon="ban"
                        onClick={() => {
                            toast(t("Error"), {
                                description: t("Results.NoRowsAreSelected"),
                            })
                        }}
                    />
                    {children}
                </>
            ) : (
                <>
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
                    {children}
                </>
            )}
        </div>
    )
}
