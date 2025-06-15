
import { CacheStorage } from "./CacheStorage";
import { UseCacheConfig } from "./Config";
import { CODE, DataBox, getDataFromBox } from "./DataBox";
import { query2Params } from "./utils";

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
 * @param transformDataBoxFromResponseJson  tranformer from response json from remote to DataBox<T>
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
    onErr?: (msg: string) => void,
    onDone?: () => void,
    isShowLoading?: boolean,
    showLoading?: () => void,
    hideLoading?: () => void,
    transformDataBoxFromResponseJson?: (json: any) => DataBox<T>
}

export function defaultFetchParams<T>(url: string, onOK: (data: T) => void, data?: object, shortKey?: string, isShowLoading: boolean = true, attachAuthHeader: boolean = true): FetchParams<T> {
    const p: FetchParams<T> = {
        url, data, shortKey,
        method: "GET",
        attachAuthHeader, isShowLoading,
        storageType: UseCacheConfig.defaultStorageType,
        onOK,
        onNoData: () => {
            if (UseCacheConfig.EnableLog) console.log("defaultFetchParams: onNoData, no data from remote server")
            if (UseCacheConfig.showToast) UseCacheConfig.showToast("no data")
        },
        onKO: (code, msg) => {
            if (UseCacheConfig.EnableLog) console.log("defaultFetchParams: onKO from remote server: code=" + code + ", msg=" + msg)
            if (UseCacheConfig.showToast) UseCacheConfig.showToast(code + ":" + msg)
        },
        onErr: (errMsg) => {
            if (UseCacheConfig.EnableLog) console.log("defaultFetchParams: onErr from remote server: errMsg=" + errMsg)
            if (UseCacheConfig.showToast) UseCacheConfig.showToast(errMsg)
        }
    }
    return p
}

export function cachedGet<T>(url: string, onOK: (data: T) => void, data?: object, shortKey?: string, isShowLoading: boolean = true, attachAuthHeader: boolean = true) {
    const p = defaultFetchParams<T>(url, onOK, data, shortKey, isShowLoading, attachAuthHeader)
    p.method = "GET"
    return cachedFetch(p)
}
export function cachedPost<T>(url: string, onOK: (data: T) => void, data?: object, shortKey?: string, isShowLoading: boolean = true, attachAuthHeader: boolean = true) {
    const p = defaultFetchParams<T>(url, onOK, data, shortKey, isShowLoading, attachAuthHeader)
    p.method = "POST"
    return cachedFetch(p)
}

/**
 * 支持缓存的远程请求,  提供对应的回调将被执行, 支持loading的显示
 * DATATYPE为biz data类型
 * 若提供了shortKey将首先检查key中是否有数据
 * 若提供了showLoading/hideLoading 并打开开关，将支持loading的显示隐藏
 * 回调类型包括：数据正常、没有数据、业务错误、请求异常等的回调
 */
export function cachedFetch<DATATYPE>(params: FetchParams<DATATYPE>) {
    const storageType = params.storageType === undefined ? UseCacheConfig.defaultStorageType : params.storageType
    if (params.shortKey) {
        const v = CacheStorage.getObject(params.shortKey, storageType)
        if (v) {
            if (UseCacheConfig.EnableLog) console.log("cachedFetch: got value from cache, shortKey=" + params.shortKey)
            if (params.onDone) params.onDone()
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
                url = params.url + query2Params(params.data)
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
    if (isShowLoading) {
        const showLoading = params.showLoading || UseCacheConfig.showLoading
        if (showLoading) showLoading()
    }

    if (UseCacheConfig.EnableLog) console.log("cachedFetch: from remote server...")

    ////https://developer.mozilla.org/en-US/docs/Web/API/fetch
    //https://www.ruanyifeng.com/blog/2020/12/fetch-tutorial.html
    fetch(url, requestInit).then(response => {
        if (isShowLoading && params.hideLoading) {
            const hide = params.hideLoading || UseCacheConfig.hideLoading
            if (hide) hide()
        }
        if (params.onDone) params.onDone()
        if (response.ok) {
            return response.json()
        } else {
            const msg = response.status + ": " + response.statusText
            console.warn("cachedFetch: " + msg)
            throw new Error(msg);
        }
    }).then(json => {
        const box: DataBox<DATATYPE> = params.transformDataBoxFromResponseJson ? params.transformDataBoxFromResponseJson(json) : json
        if (box.code === CODE.OK) {
            const data = getDataFromBox(box)
            if (data === undefined) { //if(0)返回false if(data)判断有问题
                if (params.onNoData) {
                    if (UseCacheConfig.EnableLog) console.log("cachedFetch: no data from remote server")
                    params.onNoData()
                } else {
                    console.log("cachedFetch: no onNoData handler")
                }
            } else {
                if (params.shortKey) {
                    CacheStorage.saveItem(params.shortKey, JSON.stringify(data), storageType)
                }
                params.onOK(data)
            }
            //return false
        } else {
            if (params.onKO) {
                if (UseCacheConfig.EnableLog) console.log("cachedFetch: fail from remote server: code=" + box.code + ",msg=" + box.msg)
                params.onKO(box.code, box.msg)
            } else {
                console.log("cachedFetch: no onKO handler")
            }
            //return false;
        }
    }).catch(err => {
        if (isShowLoading && params.hideLoading) {
            const hide = params.hideLoading || UseCacheConfig.hideLoading
            if (hide) hide()
        }
        if (UseCacheConfig.EnableLog) console.log("cachedFetch exception from remote server:", err)
        if (params.onErr) params.onErr(err.message)
        else {
            console.warn("cachedFetch: no onErr handler, but has err: " + err.message + ", throw it")
            //throw new Error(err.message);
        }

        //return false;
    })

    return false
}


/**
 * 返回一个Promise
 * 如果正常则resolve后的结果为T类型; 如果错误发生，reject一个string错误信息
 * T可以为payload中的biz data，也可为其它任意包裹类型（需提供transfomFromBizData进行转换）
 * 
 * 若需使用缓存（先从缓存中读取，没有则从远程获取，获取后将结果保存到缓存中），则需提供shortKey，默认的storageType为UseCacheConfig.defaultStorageType，即sessionStorage中
 * 若需将biz data转换成其它类型，则需提供transfomFromBizData转换函数； 不提供时，则T为payload biz data
 * 若远程返回结果格式不为DataBox<T>，则需提供transformDataBoxFromResponseJson进行转换
 * 若需自动添加auth认证时，则将attachAuthHeader设置为true
 * 若需显示loading，则将isShowLoading设置为true，并提供showLoading/hideLoading函数
 * @param url  remote reuqest url 
 * @param method "GET" | "POST" | "PUT" | "DELETE"
 * @param data search query parameters
 * @param shortKey short cache key
 * @param storageType UseCacheConfig.defaultStorageType
 * @param transformDataBoxFromResponseJson tranformer from response json from remote to DataBox<T>
 * @param transfomFromBizData tranformer from payload biz data to T if provided
 * @param attachAuthHeader add auth header into request headers
 * @param isShowLoading show loading when request if provide showLoading function
 * @param showLoading show loading function
 * @param hideLoading  hide loading function
 */
export const cachedFetchPromise = async <T>(
    url: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    data?: object,
    shortKey?: string,
    storageType: number = UseCacheConfig.defaultStorageType,
    transformDataBoxFromResponseJson?: (json: any) => DataBox<T>,
    transfomFromBizData?: (bizData: any) => T,
    attachAuthHeader?: boolean, //= true
    isShowLoading: boolean = false, //default is false
    showLoading?: () => void,
    hideLoading?: () => void,
) => {

    if (shortKey) {
        const v = CacheStorage.getObject(shortKey, storageType)
        if (v) {
            if (UseCacheConfig.EnableLog) console.log("cachedFetchPromise: got value from cache, shortKey=" + shortKey)
            //params.onOK(v)
            const d = transfomFromBizData ? transfomFromBizData(v) : v
            return new Promise<T | undefined>((resolve: (data: T | undefined) => void, reject: (reason: string) => void) => resolve(d))
        } else {
            if (UseCacheConfig.EnableLog) console.log("cachedFetchPromise: not found value from cache, shortKey=" + shortKey)
        }
    }


    let requestInit: RequestInit
    const authHeader = attachAuthHeader === false ? undefined : UseCacheConfig.authheaders()
    switch (method) {
        case "GET":
        case "DELETE":
            {
                url = url + query2Params(data)
                requestInit = {
                    method: method,
                    headers: new Headers({
                        ...authHeader,
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                    })
                }

                break
            }
        case "POST":
        case "PUT": {
            url = url
            requestInit = {
                method: method,
                body: data ? JSON.stringify(data) : undefined,
                headers: new Headers({
                    ...authHeader,
                    'Content-Type': 'application/json; charset=UTF-8'
                })
            }
            break
        }

        default: {
            console.warn("cachedFetchPromise: please use fetch API directly")
            return new Promise((resolve: (data: T | undefined) => void, reject: (reason: string) => void) => reject("please use fetch API directly"));
        }
    }


    if (isShowLoading) {
        const showLoadingFunc = showLoading || UseCacheConfig.showLoading
        if (showLoadingFunc) showLoadingFunc()
    }

    if (UseCacheConfig.EnableLog) console.log("cachedFetchPromise: from remote server...")

    ////https://developer.mozilla.org/en-US/docs/Web/API/fetch
    //https://www.ruanyifeng.com/blog/2020/12/fetch-tutorial.html
    const p = fetch(url, requestInit).then(response => {
        if (isShowLoading && hideLoading) {
            const hide = hideLoading || UseCacheConfig.hideLoading
            if (hide) hide()
        }
        //if(params.onDone) params.onDone()
        if (response.status < 300 && response.ok) {
            return response.json()
        } else {
            const msg = response.status + ": " + response.statusText
            console.warn("cachedFetchPromise: " + msg)
            throw new Error(msg);
        }
    }).then(json => {
        const box: DataBox<any> = transformDataBoxFromResponseJson ? transformDataBoxFromResponseJson(json) : json
        if (box.code === CODE.OK) {
            const data = box.data
            if (data === undefined) { //if(0)返回false if(data)判断有问题
                if (UseCacheConfig.EnableLog) console.log("cachedFetchPromise: no data from remote server")
            } else {
                if (shortKey) {
                    CacheStorage.saveItem(shortKey, JSON.stringify(data), storageType)
                }
            }
            const d = transfomFromBizData ? transfomFromBizData(data) : data
            return new Promise<T | undefined>(resolve => resolve(d))
        } else {
            if (UseCacheConfig.EnableLog) console.log("cachedFetchPromise: fail from remote server: code=" + box.code + ",msg=" + box.msg)

            return new Promise<T | undefined>((resolve: (data: T | undefined) => void, reject: (reason: string) => void) => reject("code=" + box.code + ", msg=" + box.msg));
        }
    }).catch(err => {
        if (UseCacheConfig.EnableLog)
            console.log("cachedFetchPromise exception from remote server:" + err)
        else {
            console.warn("cachedFetchPromise: no onErr handler, but has err: " + err)
        }
        throw Error(err)
        // return new Promise<T|undefined>((resolve: ( data: T|undefined)=>void, reject: (reason: string)=>void) => reject( "err.message=" + err.message));
    })

    return p
}
