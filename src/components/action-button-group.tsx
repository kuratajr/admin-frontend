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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconButton } from "@/components/xui/icon-button"
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
        token?: () => Promise<{ accessToken: string; expireTime: string }>
    }
}

interface BlockButtonGroupProps<E, U> {
    className?: string
    children?: React.ReactNode
    block: { fn: (id: E[]) => Promise<void>; id: E; mutate: KeyedMutator<U> }
    actions?: {
        start?: () => Promise<void>
        stop?: () => Promise<void>
        token?: () => Promise<{ accessToken: string; expireTime: string }>
    }
}

export function ActionButtonGroup<E, U>({
    className,
    children,
    delete: { fn, id, mutate },
    actions,
}: ButtonGroupProps<E, U>) {
    const { t } = useTranslation()
    const [openTokenDialog, setOpenTokenDialog] = useState(false)

    const [tokenResult, setTokenResult] = useState<string | null>(null)

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

    const handleAction = async (action?: () => Promise<any>) => {
        if (!action) return
        try {
            const result = await action()
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
                            <DropdownMenuItem onClick={() => setOpenTokenDialog(true)}>
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
            <AlertDialog open={openTokenDialog} onOpenChange={setOpenTokenDialog}>
                <AlertDialogContent className="sm:max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("Generate AccessToken")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("Results.ThisOperationIsUnrecoverable")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
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
        </div>
    )
}

export function BlockButtonGroup<E, U>({
    className,
    children,
    block: { fn, id, mutate },
    actions,
}: BlockButtonGroupProps<E, U>) {
    const { t } = useTranslation()

    const [openTokenDialog, setOpenTokenDialog] = useState(false)

    const [tokenResult, setTokenResult] = useState<string | null>(null)
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

    const handleAction = async (action?: () => Promise<any>) => {
        if (!action) return
        try {
            const result = await action()
            if (action === actions?.token) {
                setTokenResult(result?.accessToken)
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
                            <DropdownMenuItem onClick={() => setOpenTokenDialog(true)}>
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
            <AlertDialog open={openTokenDialog} onOpenChange={setOpenTokenDialog}>
                <AlertDialogContent className="sm:max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("Generate AccessToken")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("Results.ThisOperationIsUnrecoverable")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {tokenResult && (
                        <div className="my-2" style={{ maxWidth: 450 }}>
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
        </div>
    )
}
