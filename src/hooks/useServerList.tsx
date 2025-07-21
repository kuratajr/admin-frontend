import { swrFetcher } from "@/api/api"
import { ModelServerList } from "@/types"
import useSWR from "swr"

export default function useServerList() {
    return useSWR<ModelServerList>("/api/v1/server-list", swrFetcher)
}