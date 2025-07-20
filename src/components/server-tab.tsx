import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router-dom"

export const ServerTab = ({ className }: { className?: string }) => {
    const { t } = useTranslation()
    const location = useLocation()

    return (
        <Tabs defaultValue={location.pathname} className={className}>
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="/dashboard" asChild>
                    <Link to="/dashboard">{t("Server CMD")}</Link>
                </TabsTrigger>
                <TabsTrigger value="/dashboard/listserver" asChild>
                    <Link to="/dashboard/listserver">{t("List Server")}</Link>
                </TabsTrigger>
            </TabsList>
        </Tabs>
    )
}
