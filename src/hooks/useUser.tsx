import { swrFetcher } from "@/api/api"
import { ModelUser } from "@/types"
import useSWR from "swr"

export default function useUser() {
    return useSWR<ModelUser>("/api/v1/user", swrFetcher)
}