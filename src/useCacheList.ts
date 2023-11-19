import { useEffect, useRef, useState } from "react";
import { cachedFetch } from "./cachedFetch";

import { CacheStorage } from "./CacheStorage";
import { UseCacheConfig } from "./Config";
import { BasePageQuery } from "./QueryPagination";
import { query2Params } from "./utils";





/**
 *  hook which loads list data from cache or remote with pagination
 * 
 * 
 * fetch from remote: pull-refresh, click loadMore button（need merge into old data）
 * after load from remote, the useCache is set true, so next time load from cache
 * 
 * load from local(include but not limit): enter firstly, re-enter, tabs switch，first try to load from cache, if not found then load from remote.
 * 
 * @param url request url
 * @param shortKey if undefined, not use cache
 * @param initalQuery initial query parameters that extends PaginationQueryBase
 * @param needLoadMore enable load more button, true when enable pagination. If load all data, not need loadMore, set it false. default is true
 * @param storageType cache storage type, default: sessionStorage
 * @return isLoading, isError, errMsg, list, loadMoreState, setQuery
 */
export function useCacheList<T, Q extends BasePageQuery>(
    url: string,
    shortKey?: string,
    initalQuery?: Q,
    needLoadMore: boolean = true, //是否需要加载更多按钮，分页数据为true，全部数据为false
    storageType: number = UseCacheConfig.defaultStorageType
) {
    //下面保存页面渲染时需用到的数据，任何更改，将导致页面重新渲染
    const [list, setList] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(true); //加载状态
    const [isError, setIsError] = useState(false); //加载是否有错误
    const [errMsg, setErrMsg] = useState<string>() //加载错误信息
    const [loadMoreState, setLoadMoreState] = useState(shortKey ? getLoadMoreState(shortKey) : true) //加载更多 按钮状态：可用和不可用，自动被管理，无需调用者管理

    //useEffect的依赖项不能是useRef中的current或current中的filed，
    //因为检查useEffect是在渲染的过程中进行，若有变化会在渲染结束后执行，修改useRef中的current值，无法触发渲染从而不执行useEffect
    //只能等下次渲染时，才会检查到变化得到执行，故而useEffect只依赖wholeUrl,欲想重新加载，修改wholeUrl即可
    //https://github.com/facebook/react/issues/14387
    //React checks the effect dependencies during render, but defers running the effect until after commit/paint.
    const [wholeUrl, setWholeUrl] = useState<string | undefined>()//修改将触发useEffect中的加载数据，往往是加载远程数据, 不能设置初始值，否则再次刷新时不加载，因为query转换成str后无变化
    //refresh用于刷新本地list数据, 如修改后返回list时，需刷新 setQuery也能达到同样效果，但往往用于从远程加载
    const [refreshCount, setRefreshCount] = useState(0) //修改将触发useEffect中的加载数据

    if (UseCacheConfig.EnableLog) console.log("call useCacheList, wholeUrl: " + wholeUrl + ", current list.length: " + list.length)

    //加载数据时的配置，渲染后它们得到修改，下次渲染时使用他们的最新值
    const { current } = useRef({
        pageSize: initalQuery?.pagination?.pageSize || UseCacheConfig.PageSize, //list page size
        useCache: !!shortKey, //是否只从local cache 中加载，若提供键值则为true
        isLoadMore: false, //是否加载更多的标志
    })
    //设置加载参数，设置为false，将只从远程加载
    const setUseCache = (useLocalCache: boolean) => { current.useCache = useLocalCache }

    //设置为true，加载后的数据将与原列表数据合并，加载完成后自动设置为false，等待下载加载更多时需重新设置为true
    const setIsLoadMore = (toLoadMore: boolean) => { current.isLoadMore = toLoadMore }


    //调用它重新加载，往往需要加载本地数据
    const setRefresh = () => { setRefreshCount(refreshCount + 1) }
    //调用它，若参数变化，将重新加载数据，往往是远程数据
    const setQuery = (query?: Q) => {
        if (UseCacheConfig.EnableLog)
            console.log("setQuery: " + JSON.stringify(query))
        setWholeUrl(url + query2Params(query))
    }

 //从远程加载数据，会动态更新加载状态、是否有错误、错误信息
    //加载完毕后，更新list，自动缓存数据（与现有list合并）、设置加载按钮状态
    const fetchFromRemote = (isLoadMore: boolean, pageSize: number, wholeUrl: string) => cachedFetch<T[]>(
        {
            url: wholeUrl, 
            method: "GET",
            attachAuthHeader: true,
            storageType,
            isShowLoading: true,
            onDone: () => {      
                setIsLoadMore(false)//恢复普通状态，每次loadMore时再设置
            },
            onOK: (data) => {
                setIsLoading(false)
                setIsError(false)
                setUseCache(true)
                const result = (isLoadMore && list && list.length > 0) ? list.concat(data) : data
                setList(result)

                if (shortKey) CacheStorage.saveObject(shortKey, result, storageType)

                if (needLoadMore) {//每次渲染时捕获传来的最新值
                    const newState = data.length >= pageSize
                    setLoadMoreState(newState)
                    if (shortKey) saveLoadMoreState(shortKey, newState)
                }
                if (UseCacheConfig.EnableLog) console.log("return from remote server: list.length: " + data.length)
               
            },
            onKO: (code, msg) => {
                setIsLoading(false)
                setIsError(true)
                if (needLoadMore) {
                    setLoadMoreState(false)
                    if (shortKey) saveLoadMoreState(shortKey, false)
                }
                setErrMsg(code + ": " + msg)
                if (UseCacheConfig.EnableLog) console.log("remote server return err code=" + code + ", msg=" + msg)
            },
            onNoData: () => {
                setIsLoading(false)
                setIsError(true)
                if (needLoadMore) {
                    setErrMsg("no data")
                    if (shortKey) saveLoadMoreState(shortKey, false)
                }
                if (UseCacheConfig.EnableLog) console.log("return from remote server: no data")
            },
            onErr: (errMsg) => {
                setIsLoading(false)
                setUseCache(false) //出错了，可以重试重新加载

                setIsError(true)
                setErrMsg(errMsg)
                if (needLoadMore) {
                    if (shortKey) saveLoadMoreState(shortKey, false)
                    setLoadMoreState(false)
                }

                setIsLoadMore(false)//恢复普通状态，每次loadMore时再设置

                if (UseCacheConfig.EnableLog) console.log("useCacheList exception from remote server: ", errMsg)
            }
        })
   

    useEffect(() => {
        if (UseCacheConfig.EnableLog)
            console.log("useCacheList useEffect, try load from local or remote, refreshCount=" + refreshCount + ", wholeUrl=" + wholeUrl)
        setIsLoading(true)
        if (current.useCache && shortKey) {
            const v = CacheStorage.getObject(shortKey, storageType)
            if (v) {
                if (UseCacheConfig.EnableLog) console.log("fetch from local cache, shortKey:" + shortKey + ", list.length: " + v.length)
                setList(v)
                setIsLoading(false)
                setLoadMoreState(getLoadMoreState(shortKey)) //从缓存加载了数据，也对应加载其loadMore状态
            } else {
                if (UseCacheConfig.EnableLog) console.log("no local cache, try from remote...")
                if(wholeUrl)
                    fetchFromRemote(current.isLoadMore, current.pageSize, wholeUrl)//无缓存时从远程加载
                else
                if (UseCacheConfig.EnableLog)  console.log("wholeUrl is not set, setQuery firstly")
            }
        } else {
            if (UseCacheConfig.EnableLog) console.log("useCache=false, try from remote...")
            if(wholeUrl)
                fetchFromRemote(current.isLoadMore, current.pageSize, wholeUrl)
            else
            if (UseCacheConfig.EnableLog)  console.log("wholeUrl is not set, setQuery firstly")
        }

    }, [wholeUrl, refreshCount])//变化导致重新加载 

    return { isLoading, isError, errMsg, loadMoreState, list, refreshCount, setList, setQuery, setRefresh, setUseCache, setIsLoadMore }
}


/**
 * 获取sessionStorage中缓存的loadMore状态
 * @param shortKey 列表的缓存key，后面会自动加'/loadMore'
 */
function getLoadMoreState(shortKey: string) {
    const key = UseCacheConfig.cacheSpace() + shortKey + '/loadMore'
    const cached = sessionStorage.getItem(key)

    return (cached && cached === '0') ? false : true
}
function saveLoadMoreState(shortKey: string, state: boolean) {
    const key = UseCacheConfig.cacheSpace() + shortKey + '/loadMore'
    sessionStorage.setItem(key, state ? '1' : '0')
}
