
import { CacheStorage } from "./CacheStorage";
import { UseCacheConfig } from "./Config";
import { CODE, type DataBox, getDataFromBox } from "./DataBox";
import { query2Params } from "./utils";

export interface FecthErrResson {
    message?: string
    code?: string
    status?: number
    tId?: string //tId traceId from remote server, for debug, from DataBox
    host?: string //host of remote server, for debug， from DataBox
}

/**
 * 统一错误码：用于标识 cachedFetchPromise 抛出的各类系统级错误。
 * 业务逻辑错误的 code 为服务端返回的 DataBox.code（应用自定义），不在本表中。
 */
export const FetchErrCode = {
    /** 不支持的 HTTP 方法，cachedFetchPromise 直接 reject */
    UNSUPPORTED_METHOD: 'UnsupportedMethod',
    /** HTTP 响应状态码非 2xx */
    HTTP_STATUS: 'HttpStatus',
    /** 网络异常 / 请求未发出 / 响应无法解析 */
    NETWORK: 'NetworkException',
} as const

/** 系统级错误码集合，用于区分「业务逻辑错误」与「系统/网络错误」。 */
const SYSTEM_ERR_CODES = new Set<string>([FetchErrCode.UNSUPPORTED_METHOD, FetchErrCode.HTTP_STATUS, FetchErrCode.NETWORK]);
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
    onErr?: (msg: string, httpResponseStatus?: number) => void,
    onDone?: () => void,
    isShowLoading?: boolean,
    showLoading?: () => void,
    hideLoading?: () => void,
    transformDataBoxFromResponseJson?: (json: any) => DataBox<T>,
    transfomFromBizData?: (bizData: any) => T
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
        onErr: (errMsg, httpResponseStatus?: number) => {
            if (UseCacheConfig.EnableLog) console.log("httpResponseStatus=" + httpResponseStatus + ", defaultFetchParams: onErr from remote server: errMsg=" + errMsg)
            if (UseCacheConfig.showToast) UseCacheConfig.showToast("httpResponseStatus=" + httpResponseStatus + ": " + errMsg)
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
    cachedFetchPromise(params.url, params.method, params.data, params.shortKey,
        params.storageType, params.transformDataBoxFromResponseJson, params.transfomFromBizData,
        params.attachAuthHeader, params.isShowLoading, params.showLoading, params.hideLoading)
        .then(d => {
            if (params.onDone) params.onDone()
            if (!d) {
                if (params.onNoData) params.onNoData()
            } else {
                params.onOK(d)
            }
        }).catch((reason: Partial<FecthErrResson>) => {
            if (params.onDone) params.onDone()
            if (reason.status !== undefined && reason.status > 0) {
                // HTTP 状态错误
                if (params.onErr) params.onErr(reason.message ?? '', reason.status)
            } else if (reason.code && SYSTEM_ERR_CODES.has(reason.code)) {
                // 系统级错误：网络异常 / 不支持的请求方法等
                if (params.onErr) params.onErr(reason.message ?? '', reason.status ?? 0)
            } else {
                // 业务逻辑错误（服务端返回非 OK 的 DataBox）
                if (params.onKO) params.onKO(reason.code ?? '', reason.message)
            }
        })
}





/**
 * 返回一个Promise
 * 如果正常则resolve后的结果为R类型; 如果错误发生，reject一个FecthErrResson错误信息
 * remote返回的类型也可为其它任意包裹类型，transfomFromBizData将其转换为DataBox<T>类型，若远程返回结果格式不为DataBox<T>，则需提供transformDataBoxFromResponseJson进行转换。
 * T可以经过transfomFromBizData转换后为最终返回的R类型。
 * 
 * 
 * 若需使用缓存（先从缓存中读取，没有则从远程获取，获取后将结果保存到缓存中），则需提供shortKey，默认的storageType为UseCacheConfig.defaultStorageType，即sessionStorage中
 * 
 * 
 * 若需自动添加auth认证时，则将attachAuthHeader设置为true
 * 若需显示loading，则将isShowLoading设置为true，并提供showLoading/hideLoading函数
 * 
 * @param url  remote reuqest url 
 * @param method "GET" | "POST" | "PUT" | "DELETE"
 * @param data search query parameters
 * @param shortKey short cache key
 * @param storageType UseCacheConfig.defaultStorageType
 * @param transformDataBoxFromResponseJson tranformer from response json from remote to DataBox<T>
 * @param transfomFromBizData tranformer from payload biz data from T to R if provided
 * @param attachAuthHeader add auth header into request headers
 * @param isShowLoading show loading when request if provide showLoading function
 * @param showLoading show loading function
 * @param hideLoading  hide loading function
 */
export const cachedFetchPromise = async <T, R>(
    url: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    data?: object,
    shortKey?: string,
    storageType: number = UseCacheConfig.defaultStorageType,
    transformDataBoxFromResponseJson?: (json: any) => DataBox<T>,
    transfomFromBizData?: (bizData: T) => R,
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
            return new Promise<T | undefined>((resolve: (data: T | undefined) => void, reject: (reason: FecthErrResson) => void) => resolve(d))
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
            return new Promise<T | undefined>((resolve, reject: (reason: FecthErrResson) => void) =>
                reject({ status: 0, code: FetchErrCode.UNSUPPORTED_METHOD, message: "please use fetch API directly" }));
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
        if (response.status < 400 && response.ok) {
            return response.json()
        } else {
            const msg = response.statusText || ("HTTP " + response.status)
            console.warn("cachedFetchPromise response.status:" + response.status + ", " + msg)
            // HTTP 状态错误：携带 status，cachedFetch 据此路由到 onErr
            return new Promise<T | undefined>((resolve, reject) => reject({ status: response.status, code: FetchErrCode.HTTP_STATUS, message: msg }));
            //if (params.onErr) params.onErr(msg, response.status)
        }
    }).then(json => {
        const box: DataBox<any> = transformDataBoxFromResponseJson ? transformDataBoxFromResponseJson(json) : json
        if (box && box.code === CODE.OK) {
            //const data = box.data
            const data = getDataFromBox(box)
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
            const code = box ? box.code : undefined
            const msg = box ? box.msg : "返回数据格式错误"
            if (UseCacheConfig.EnableLog) console.log("cachedFetchPromise: fail from remote server: code=" + code + ",msg=" + msg)
            // 业务错误：status 记为 0（无 HTTP 错误），cachedFetch 据此路由到 onKO（业务逻辑错误回调）
            return new Promise<T | undefined>((resolve, reject) => reject({ status: 0, code: code, message: msg }));
        }
    })

    // 网络异常 / JSON 解析失败 / 其它非预期异常：统一包装为 FecthErrResson(status=0)，路由到 onErr。
    // 已是 FecthErrResson（HTTP 状态错误 / 业务逻辑错误）则原样透传，避免破坏其 status/code 路由。
    return p.catch((reason: any) => {
        if (reason && (reason.status !== undefined || reason.code !== undefined)) {
            return Promise.reject(reason)
        }
        const msg = reason && reason.message ? reason.message : String(reason)
        return Promise.reject({ status: 0, message: "网络请求异常：" + msg, code: FetchErrCode.NETWORK } as FecthErrResson)
    })
}

/**
 * 将 cachedFetchPromise / cachedFetch 抛出的 FecthErrResson（或任意异常）转换为可读的错误提示字符串。
 * - HTTP 状态错误：reason.status > 0
 * - 业务逻辑错误 / 网络异常等：优先使用 message，其次使用 code
 * 
 * @param e 捕获到的异常（FecthErrResson / Error / unknown）
 * @param fallback 操作描述，如“查询模型列表失败”
 */
export function toErrMsg(e: unknown, fallback?: string): string {
    const prefix = fallback ? fallback + '：' : ''
    const r = e as Partial<FecthErrResson> | null
    if (r && typeof r === 'object') {
        if (r.status !== undefined && r.status > 0) {
            return `${prefix}HTTP ${r.status}${r.message ? '，' + r.message : ''}`
        }
        if (r.message) {
            return `${prefix}${r.message}`
        }
        if (r.code) {
            return `${prefix}${r.code}`
        }
    }
    if (e instanceof Error) return `${prefix}${e.message}`
    return `${prefix}${String(e)}`
}
