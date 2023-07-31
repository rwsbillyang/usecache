import { CacheStorage } from "./CacheStorage";
import { UseCacheConfig } from "./Config";
import { CODE, DataBox, getDataFromBox } from "./DataBox";
import { serializeObject } from "./utils";

/**
 * load data from remote server or local cache depends on shortKey
 * 
 * @param url url
 * @param data if GET/DELETE, will be query parameters, if POST/PUT will be body data 
 * @param method
 * @param attachAuthHeader default true
 * @param onOK  called when biz data is ok
 * @param onNoData called if no biz data
 * @param onKO called if biz data is NOT ok
 * @param onErr called something wrong including request err, response status not 2xx
 * @param onDone called if request remote server finishe, called before onOK/onNoData/onKO/onErr
 * @param shortKey use cache firstly if provide shortKey, if undefined load from remote server
 * @param storageType default is UseCacheConfig.defaultStorageType
 * @param isShowLoading default true, if false, not show loading ui even if has showLoading function
 * @param showLoading show loading if provides
 * @param hideLoading hide loading if provides
 */
export interface FetchParams<T> {
    url: string,
    data?: object,
    method: "GET" | "POST" | "PUT" | "DELETE",
    attachAuthHeader?: boolean, //= true
    shortKey?: string,
    storageType?: number, // = UseCacheConfig.defaultStorageType,
    onOK: (data: T) => void,
    onNoData?: () => void,
    onKO?: (code: string, msg?: string) => void,
    onErr?:(msg: string) => void,
    onDone?: () => void,
    isShowLoading?: boolean,
    showLoading?: () => void,
    hideLoading?: () => void,    
}

export function defaultFetchParams<T>(url: string, onOK: (data: T) => void, data?: object, shortKey?: string, isShowLoading: boolean = true, attachAuthHeader: boolean = true): FetchParams<T>{
    const p: FetchParams<T> = {
        url, data, shortKey, 
        method: "GET",
        attachAuthHeader,isShowLoading,
        storageType: UseCacheConfig.defaultStorageType,
        onOK,
        onNoData: () => {
            if (UseCacheConfig.EnableLog) console.log("defaultFetchParams: onNoData, no data from remote server")
            if(UseCacheConfig.showToast) UseCacheConfig.showToast("no data")
        },
        onKO:(code, msg) => {
            if (UseCacheConfig.EnableLog) console.log("defaultFetchParams: onKO from remote server: code=" + code + ", msg=" + msg)
            if(UseCacheConfig.showToast) UseCacheConfig.showToast(code + ":" + msg)
        },
        onErr: (errMsg) => {
            if (UseCacheConfig.EnableLog) console.log("defaultFetchParams: onErr from remote server: errMsg=" + errMsg)
            if(UseCacheConfig.showToast) UseCacheConfig.showToast(errMsg)
        }
    }
    return p
}

export function cachedGet<T>(url: string, onOK: (data: T) => void, data?: object, shortKey?: string, isShowLoading: boolean = true, attachAuthHeader: boolean = true){
    const p = defaultFetchParams<T>(url, onOK, data, shortKey,isShowLoading,attachAuthHeader)
    p.method = "GET"
    return cachedFetch(p)
}
export function cachedPost<T>(url: string, onOK: (data: T) => void, data?: object, shortKey?: string, isShowLoading: boolean = true, attachAuthHeader: boolean = true){
    const p = defaultFetchParams<T>(url, onOK, data, shortKey,isShowLoading,attachAuthHeader)
    p.method = "POST"
    return cachedFetch(p)
}

export function cachedFetch<T>(params: FetchParams<T>) {
    const storageType = params.storageType === undefined ? UseCacheConfig.defaultStorageType : params.storageType
    if (params.shortKey) {
        const v = CacheStorage.getObject(params.shortKey, storageType)
        if (v) {
            if (UseCacheConfig.EnableLog) console.log("cachedFetch: got value from cache, shortKey=" + params.shortKey)
            params.onOK(v)
            return true
        } else {
            if (UseCacheConfig.EnableLog) console.log("cachedFetch: not found value from cache, shortKey=" + params.shortKey)
        }
    }

    let url = params.url
    let requestInit: RequestInit
    const authHeader = params.attachAuthHeader === false ? undefined : UseCacheConfig.authheaders()
    switch (params.method) {
        case "GET":
        case "DELETE":
            {
                const query = serializeObject(params.data)
                url = params.url + (query ? ("?" + query) : '')
                requestInit = {
                    method: params.method,
                    headers: new Headers({
                        ...authHeader,
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                    })
                }

                break
            }
        case "POST":
        case "PUT": {
            url = params.url
            requestInit = {
                method: params.method,
                body: params.data ? JSON.stringify(params.data) : undefined,
                headers: new Headers({
                    ...authHeader,
                    'Content-Type': 'application/json; charset=UTF-8'
                })
            }
            break
        }

        default: {
            console.warn("please use fetch API directly")
            return false
        }
    }

    //default is true
    const isShowLoading = params.isShowLoading === false ? false : true 
    if (isShowLoading) 
    {
        const showLoading = params.showLoading || UseCacheConfig.showLoading
        if(showLoading) showLoading()
    }

    if (UseCacheConfig.EnableLog) console.log("cachedFetch: from remote server...")

    ////https://developer.mozilla.org/en-US/docs/Web/API/fetch
    //https://www.ruanyifeng.com/blog/2020/12/fetch-tutorial.html
    fetch(url, requestInit).then(response => {
        if (isShowLoading && params.hideLoading){
            const hide = params.hideLoading || UseCacheConfig.hideLoading
            if(hide) hide()
        } 
        if(params.onDone) params.onDone()
        if (response.ok) {
            return response.json()
        } else {
            const msg = response.status + ": " + response.statusText
            console.warn("cachedFetch: "+ msg)
            throw new Error(msg);
        }
    }).then(json => {
        const box: DataBox<T> = json
        if (box.code === CODE.OK) {
            const data = getDataFromBox(box)
            if (data === undefined) { //if(0)返回false if(data)判断有问题
                if (params.onNoData) {
                    if (UseCacheConfig.EnableLog) console.log("cachedFetch: no data from remote server")
                    params.onNoData()
                }else{
                    console.log("cachedFetch: no onNoData handler")
                }
            } else {
                if (params.shortKey) {
                    CacheStorage.saveItem(params.shortKey, JSON.stringify(data), storageType)
                }
                params.onOK(data)
            }
            return false
        } else {
            if (params.onKO) {
                if (UseCacheConfig.EnableLog) console.log("cachedFetch: fail from remote server: code=" + box.code + ",msg=" + box.msg)
                params.onKO(box.code, box.msg)
            }else{
                console.log("cachedFetch: no onKO handler")
            }
            return false;
        }
    }).catch(err => {
        if (isShowLoading && params.hideLoading){
            const hide = params.hideLoading || UseCacheConfig.hideLoading
            if(hide) hide()
        } 
        if (UseCacheConfig.EnableLog) console.log("cachedFetch exception from remote server:", err)
        if (params.onErr) params.onErr(err.message)
        else{
            console.warn("cachedFetch: no onErr handler, but has err")
        }
        
        return false;
    })

    return false
}