import { useEffect, useState } from "react";

import { CacheStorage } from "./CacheStorage";
import { UseCacheConfig } from "./UseCacheConfig";
import { CODE, DataBox, getDataFromBox } from "./DataBox";
import { PaginationQueryBase } from "./PaginationQueryBase";
import { encodeUmi } from "./UmiListPagination";
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
 export function useCacheList<T, Q extends PaginationQueryBase>(
    url: string,
    shortKey?: string,
    initalQuery?: Q,
    needLoadMore: boolean = true, //分页数据为true，全部数据为false
    storageType: number = UseCacheConfig.defaultStorageType
) {
    const [list, setList] = useState<T[]>();
    const [query, setQuery] = useState(initalQuery) //请求查询条件变化将导致重新请求
    const [isLoading, setIsLoading] = useState(true); //加载状态
    const [isError, setIsError] = useState(false); //加载是否有错误
    const [errMsg, setErrMsg] = useState<string>() //加载错误信息
    const [loadMoreState, setLoadMoreState] = useState(shortKey?getLoadMoreState(shortKey):true) //加载更多 按钮状态：可用和不可用，自动被管理，无需调用者管理

    const [useCache, setUseCache] = useState(!!shortKey)//从远程加载后即恢复为初始值true，以后即从本地加载，需要远程加载时再设置：setUseCache(false)
    const [isLoadMore, setIsLoadMore] = useState(false)

    const [refresh, setRefresh] = useState<number>(0) //refresh用于刷新本地list数据, setQuery也能达到同样效果，但往往用于从远程加载
    // const [currentPage, setCurrentPage] = useState(1)

    //从远程加载数据，会动态更新加载状态、是否有错误、错误信息
    //加载完毕后，更新list，自动缓存数据（与现有list合并）、设置加载按钮状态
    const fetchDataFromRemote = (query?: Q, onDone?: (data?: T[]) => void) => {
        if (UseCacheConfig.EnableLog) console.log("fetch from remote... shortKey=" + shortKey + ", query=" + JSON.stringify(query))
        
        const get = UseCacheConfig.request?.get
        if(!get){
            console.warn("please inject get request firstly")
            return 
        }

        //将PaginationQueryBase的pagination编码为umi后，去除它
        get(url, query?.pagination ? { ...query, umi: encodeUmi(query.pagination), sort: undefined, pagination: undefined } : { ...query, sort: undefined })
            .then(res => {
                setIsLoading(false)
                setUseCache(true)
  
                const box: DataBox<T[]> = res.data
                const data = getDataFromBox(box)
                if (box.code === CODE.OK) {
                    if (data) {
                        setIsError(false)

                        const result = (isLoadMore && list && list.length > 0) ? list.concat(data) : data
                        setList(result)

                        if(shortKey) CacheStorage.saveObject(shortKey, result, storageType)
                      
                        if (needLoadMore) {
                            const newState = data.length >= (query?.pagination?.pageSize || UseCacheConfig.PageSize)
                            setLoadMoreState(newState)
                            if(shortKey) saveLoadMoreState(shortKey, newState)
                        }

                    } else {
                        setIsError(true)
                        if (needLoadMore) {
                            setErrMsg("no data")
                            if(shortKey) saveLoadMoreState(shortKey, false)
                        }
                    }
                } else {
                    setIsError(true)
                    if (needLoadMore) {
                        setLoadMoreState(false)
                        if(shortKey) saveLoadMoreState(shortKey, false)
                    }
                    setErrMsg(box.msg || box.code)
                }

                //报告数据请求结束
                if (onDone) onDone(data)


                setIsLoadMore(false)//恢复普通状态，每次loadMore时再设置
            })
            .catch(err => {
                setUseCache(true)

                //报告数据请求结束
                if (onDone) onDone()

                setIsLoading(false)
                setIsError(true)
                setErrMsg(err.message)
                if (needLoadMore) {
                    if(shortKey) saveLoadMoreState(shortKey, false)
                    setLoadMoreState(false)
                }

                setIsLoadMore(false)//恢复普通状态，每次loadMore时再设置
            })
    }

    useEffect(() => {
        if (UseCacheConfig.EnableLog) console.log("in useEffect loading, url=" + url + ", query=" + JSON.stringify(query))
        setIsLoading(true)
        if (useCache && shortKey) {
            const v = CacheStorage.getObject(shortKey, storageType)
            if (v) {
                if (UseCacheConfig.EnableLog) console.log("fetch from local cache... shortKey=" + shortKey)
                setList(v)
                setIsLoading(false)
                setLoadMoreState(getLoadMoreState(shortKey)) //从缓存加载了数据，也对应加载其loadMore状态
            } else {
                if (UseCacheConfig.EnableLog) console.log("no local cache, try from remote...")
                fetchDataFromRemote(query)//无缓存时从远程加载
            }
        } else {
            if (UseCacheConfig.EnableLog) console.log("useCache=false, try from remote...")
            fetchDataFromRemote(query)
        }

    }, [url, query, refresh])// url, query, refresh变化

    return { isLoading, isError, errMsg, loadMoreState, query, setQuery, list, setList, fetchDataFromRemote, refresh, setRefresh, setUseCache, setIsLoadMore }
}


/**
 * 获取sessionStorage中缓存的loadMore状态
 * @param shortKey 列表的缓存key，后面会自动加'/loadMore'
 */
 function getLoadMoreState(shortKey: string) {
    const key = UseCacheConfig.cacheKeyPrefix + shortKey + '/loadMore'
    const cached = sessionStorage.getItem(key)

    return (cached && cached === '0') ? false : true
}
function saveLoadMoreState(shortKey: string, state: boolean) {
    const key = UseCacheConfig.cacheKeyPrefix + shortKey + '/loadMore'
    sessionStorage.setItem(key, state ? '1' : '0')
}
