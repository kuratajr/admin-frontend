import {
    ModelBatchMoveServerForm,
    ModelServer,
    ModelServerConfigForm,
    ModelServerForm,
    ModelServerTaskResponse,
    TokenRequest,
    PortRequest,
    PortResponse,
    ModelWorkspaceTaskResponse
} from "@/types"

import { FetcherMethod, fetcher } from "./api"

export const updateServer = async (id: number, data: ModelServerForm): Promise<void> => {
    return fetcher<void>(FetcherMethod.PATCH, `/api/v1/server/${id}`, data)
}

export const deleteServer = async (id: number[], mode: string): Promise<void> => {
    return fetcher<void>(FetcherMethod.POST, `/api/v1/batch-delete/${mode}`, id)
}

export const updateServerConfigDetail = async (id: number): Promise<void> => {
    return fetcher<void>(FetcherMethod.GET, `/api/v1/server/google/detail/${id}`)
}

export const startFn = async (id: number[], mode: string) => {
    return fetcher<void>(FetcherMethod.POST, `/api/v1/server/google/start/${mode}`, id)
}

export const stopFn = async (id: number[], mode: string) => {
    return fetcher<void>(FetcherMethod.POST, `/api/v1/server/google/stop/${mode}`, id)
}

export const updateServers = async (id: number[]) => {
    return fetcher<void>(FetcherMethod.POST, "/api/v1/server/google/list", id)
}

export const tokenFn = async (data: TokenRequest, mode: string): Promise<{ accessToken: string; expireTime: string }> => {
    return fetcher<{ accessToken: string; expireTime: string }>(
        FetcherMethod.POST,
        `/api/v1/server/google/token/${mode}`,data
    )
    
}

export const getPort = async (data: PortRequest): Promise<PortResponse[]> => {
    return fetcher<PortResponse[]>(
        FetcherMethod.POST,
        "/api/v1/server/port/list",data
    )  
}

export const updatePort = async (data: PortRequest): Promise<PortResponse[]> => {
    return fetcher<PortResponse[]>(
        FetcherMethod.POST,
        "/api/v1/server/port/create",data
    )  
}

export const batchMoveServer = async (data: ModelBatchMoveServerForm): Promise<void> => {
    return fetcher<void>(FetcherMethod.POST, "/api/v1/batch-move/server", data)
}

export const forceUpdateServer = async (id: number[]): Promise<ModelServerTaskResponse> => {
    return fetcher<ModelServerTaskResponse>(FetcherMethod.POST, "/api/v1/force-update/server", id)
}

export const syncWorkspace = async (): Promise<ModelWorkspaceTaskResponse> => {
    return fetcher<ModelWorkspaceTaskResponse>(FetcherMethod.POST, "/api/v1/server-list/update-gcp/google", null)
}

export const getServers = async (): Promise<ModelServer[]> => {
    return fetcher<ModelServer[]>(FetcherMethod.GET, "/api/v1/server", null)
}

export const getServerConfig = async (id: number): Promise<string> => {
    return fetcher<string>(FetcherMethod.GET, `/api/v1/server/config/${id}`, null)
}

export const setServerConfig = async (
    data: ModelServerConfigForm,
): Promise<ModelServerTaskResponse> => {
    return fetcher<ModelServerTaskResponse>(FetcherMethod.POST, `/api/v1/server/config`, data)
}
