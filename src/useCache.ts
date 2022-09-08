import { useEffect, useState } from "react"
import { UseCacheConfig } from "./UseCacheConfig"
import { CacheStorage } from "./CacheStorage";
import { CODE, DataBox, getDataFromBox } from "./DataBox";

export function fetchWithShowModel<T>(loadFunc: () => Promise<any>, shortKey?: string){
    genericFetch(
        loadFunc, 
        (()=> {}) || UseCacheConfig.request?.showToast,
        shortKey,
        UseCacheConfig.defaultStorageType,
        UseCacheConfig.request?.showToast,
        UseCacheConfig.request?.showToast,
        UseCacheConfig.request?.showLoading,
        UseCacheConfig.request?.hideLoading
        )
}

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
    storageType: number = UseCacheConfig.defaultStorageType) {
    const [loading, setLoading] = useState(false)
    const [entity, setEntity] = useState<T>()
    const [errMsg, setErrMsg] = useState<string>()
    useEffect(() => {
        setLoading(true)

        const get = withouAuth? UseCacheConfig.request?.getWithouAuth : UseCacheConfig.request?.get
        if(!get){
            console.warn("not config request promise, please set ConfigRequest firstly")
        }else{
            //if show loading, but not config them, print warn
            if(showLoading && (!UseCacheConfig.request?.showLoading || !UseCacheConfig.request?.hideLoading)){
                console.warn("not config request showLoading/hideLoading, please set ConfigRequest firstly")
            }
            genericFetch(
                () => get(url),
                (data: T) => {
                    setLoading(false)
                    setEntity(data)
                },
                shortKey, storageType,
                () => {
                    setLoading(false)
                    setErrMsg("数据移民火星了^_^")
                },
                (msg) => {
                    setLoading(false)
                    setErrMsg(msg)
                },
                UseCacheConfig.request?.showLoading, UseCacheConfig.request?.hideLoading
            )
        }
    }, [url])

    return { loading, entity, errMsg }
}


/**
 * load data from remote server or local cache depends on shortKey
 * 
 * @param loadFunc promise
 * @param onOK correct and has data
 * @param shortKey if no shortKey, not use cache
*  @param storageType default is UseCacheConfig.defaultStorageType
 * @param onNoData do something if no data
 * @param onFail do something if fail
 * @param onLoading show loading if provides
 * @param hideLoading hide loading if provides
 */
export function genericFetch<T>(
    loadFunc: () => Promise<any>,
    onOK: (data: T) => void,
    shortKey?: string,
    storageType: number = UseCacheConfig.defaultStorageType,
    onNoData?: () => void,
    onFail?: (msg: string) => void,
    showLoading?: () => void,
    hideLoading?: () => void
) {
    if (shortKey) {
        const v = CacheStorage.getObject(shortKey, storageType)
        if (v) {
            onOK(v)
            return true
        }
    } else {
        if (showLoading) showLoading()

        loadFunc()
            .then(res => {
                if (hideLoading) hideLoading()
                const box: DataBox<T> = res.data
                if (box.code === CODE.OK) {
                    const data = getDataFromBox(box)
                    if (data === undefined) { //if(0)返回false if(data)判断有问题
                        if (onNoData) onNoData()
                    } else {
                        if (shortKey) {
                            CacheStorage.saveItem(shortKey, JSON.stringify(data), storageType)
                        }
                        onOK(data)
                    }
                    return false
                } else {
                    if (onFail) onFail(box.msg || box.code)
                    return false;
                }
            })
            .catch(err => {
                if (hideLoading) hideLoading()
                if (onFail) onFail(err.message)
                return false;
            })
    }

    return false
}