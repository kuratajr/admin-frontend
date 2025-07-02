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

    const handleAction = async (action?: () => Promise<any>) => {
        if (!action) return
        try {
            const result = await action()
            console.log("Action result:", result)
            if (action === actions?.token) {
                setTokenResult(result)
            } else {
                setTokenResult(t("Success"))
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
            {id.length < 1 ? (
                <>
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
