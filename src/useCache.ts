import { useEffect, useState } from "react"
import { cachedFetch } from "./cachedFetch"
import { UseCacheConfig } from "./Config"
import { DataBox } from "./DataBox"


/**
 * 
 * @param url load data from url
 * @param shortKey load and cache data if provide
 * @param withouAuth request withou auth headers
 * @param showLoading //wheter show loading when load data from remote if configed in ConfigRequest
 * @param storageType // storage type, default: UseCacheConfig.defaultStorageType
 * @returns { loading, entity, errMsg }
 */
export function useCache<T>(url: string, shortKey?: string,
    withouAuth: boolean = false,
    showLoading: boolean = false,
    storageType: number = UseCacheConfig.defaultStorageType,
    transformDataBoxFromResponseJson?: (json: any) => DataBox<T>) {
    const [loading, setLoading] = useState(false)
    const [entity, setEntity] = useState<T>()
    const [errMsg, setErrMsg] = useState<string>()
    useEffect(() => {
        setLoading(true)

        //if show loading, but not config them, print warn
        if (showLoading && (!UseCacheConfig.showLoading || !UseCacheConfig.hideLoading)) {
            console.warn("not config request showLoading/hideLoading, please set ConfigRequest firstly")
        }
        cachedFetch({
            url, shortKey, storageType, 
            attachAuthHeader: !withouAuth,
            method: "GET",
            onOK: (data: T) => {
                setLoading(false)
                setEntity(data)
            },
            onNoData: () => {
                setLoading(false)
                setErrMsg("数据移民火星了^_^")
            },
            onKO: (code, msg) => {
                setLoading(false)
                setErrMsg(code + ": " +msg)
            },
            "showLoading": showLoading ? UseCacheConfig.showLoading : undefined,
            "hideLoading": showLoading ? UseCacheConfig?.hideLoading : undefined,
            transformDataBoxFromResponseJson: transformDataBoxFromResponseJson
        })
    }, [url])

    return { loading, entity, errMsg }
}



