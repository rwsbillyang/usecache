import { StorageType } from "./StorageType"
import { UseCacheConfig } from "./UseCacheConfig"
import { CacheStorage } from "./CacheStorage"

export const Cache = {
    
    /**
     * find one from cache
     * @param shortKey 
     * @param identity 
     * @param key 
     * @param storageType default configed in UseCacheConfig.defaultStorageType
     * @returns 
     */
    findOne: (shortKey: string, identity: string, key: string = UseCacheConfig.defaultIdentiyKey, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (storageType === StorageType.NONE)
            return undefined

        const str = CacheStorage.getItem(shortKey, storageType)
        if (str) {
            let arry: any[] = JSON.parse(str)
            if (arry && arry.length > 0) {
                for (let i = 0; i < arry.length; i++) {
                    if (arry[i][key] === identity) {
                        return arry[i]
                    }
                }
            }
        }
        return undefined
    },

    findMany: (shortKey: string, identities: string[], key: string = UseCacheConfig.defaultIdentiyKey, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (storageType === StorageType.NONE)
            return undefined

        const str = CacheStorage.getItem(shortKey, storageType)
        if (str) {
            let arry: any[] = JSON.parse(str)
            if (arry && arry.length > 0) {
                for (let i = 0; i < arry.length; i++) {
                    const e = arry[i]
                    for (let j = 0; j < identities.length; j++) {
                        if (e[key] === identities[j]) {
                            arry.push(e)
                        }
                    }
                }
                return arry
            }
        }
    },


    /**
     * add new one into list
     * @param shortKey 
     * @param e 
     * @param storageType 
     * @returns 
     */
    onAddOne: <T>(shortKey: string, e: T, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (storageType === StorageType.NONE)
            return

        const str = CacheStorage.getItem(shortKey, storageType)
        if (str) {
            const arry: T[] = JSON.parse(str)
            if (arry && arry.length > 0) {
                arry.unshift(e)
                CacheStorage.saveObject(shortKey, arry)
            } else
                CacheStorage.saveObject(shortKey, [e])
        } else
            CacheStorage.saveObject(shortKey, [e])

        console.log("onAddOne done")
    },


    /**
     * call it when update one successully
     * @param shortKey cachekey = UseCacheConfig.cacheKeyPrefix + shortKey
     * @param e entity
     * @param id find one by which key, default:"_id"
     * @param storageType 
     * @returns 
     */
    onEditOne: (shortKey: string, e: any, key: string = UseCacheConfig.defaultIdentiyKey, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (storageType === StorageType.NONE)
            return

        const str = CacheStorage.getItem(shortKey, storageType)
        if (str) {
            let arry: any[] = JSON.parse(str)
            if (arry && arry.length > 0) {
                //搜索现有列表，找到后更新
                for (let i = 0; i < arry.length; i++) {
                    if (arry[i][key] === e[key]) {
                        if (UseCacheConfig.EnableDebug) console.log(`onEditOne, e[${key}]=${e[key]}, shortKey=${shortKey}`)
                        arry[i] = e
                        CacheStorage.saveObject(shortKey, arry)
                        return;
                    }
                }
                if (UseCacheConfig.EnableDebug) console.log(`onEditOne：not found in list, key=${key}, shortKey=${shortKey}`)
                return
            }
        } else
            if (UseCacheConfig.EnableDebug) console.log("onEditOne：not found list: shortKey=" + shortKey)
    },




    /**
     * call it after batch update
     * @param shortKey cachekey = UseCacheConfig.cacheKeyPrefix + shortKey
     * @param list entity
     * @param key find one by which key, default:"_id"
     * @param storageType 
     * @returns 
     */
    onEditMany: (shortKey: string, list: any[], key: string = UseCacheConfig.defaultIdentiyKey, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (storageType === StorageType.NONE)
            return

        const str = CacheStorage.getItem(shortKey, storageType)
        if (str) {
            let arry: any[] = JSON.parse(str)
            if (arry && arry.length > 0) {
                for (let j = 0; j < list.length; j++) {
                    const e = list[j]
                    //搜索现有列表，找到后更新
                    for (let i = 0; i < arry.length; i++) {
                        if (arry[i][key] === e[key]) {
                            arry[i] = e
                        }
                    }
                }
                CacheStorage.saveItem(shortKey, JSON.stringify(arry))
                return
            } else {
                CacheStorage.saveItem(shortKey, JSON.stringify(list))
                return
            }
        } else
            if (UseCacheConfig.EnableDebug) console.log("onEditMany: not found list, shortKey=" + shortKey)
    },


    /**
     * call it when delete one successfully
     * @param shortKey cachekey = UseCacheConfig.cacheKeyPrefix + shortKey
     * @param identities value of key 
     * @param key find one by which key, default:"_id"
     * @param storageType 
     * @returns 
     */
    onDelOne: (shortKey: string, identity: string, key: string = UseCacheConfig.defaultIdentiyKey, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (storageType === StorageType.NONE)
            return undefined

        const str = CacheStorage.getItem(shortKey)
        if (str) {
            let arry: any[] = JSON.parse(str)
            if (arry && arry.length > 0) {
                //搜索现有列表，找到后删除
                for (let i = 0; i < arry.length; i++) {
                    if (arry[i][key] === identity) {
                        if (UseCacheConfig.EnableDebug) console.log(`del one: ${key}=${identity}`)
                        arry.splice(i, 1)
                        CacheStorage.saveItem(shortKey, JSON.stringify(arry))
                        return arry;
                    }
                }
            }
        }
        return undefined
    },

    /**
     * call it when batch delete manys successfully
     * @param shortKey cachekey = UseCacheConfig.cacheKeyPrefix + shortKey
     * @param identities values of key 
     * @param key find one by which key, default:"_id"
     * @param storageType 
     * @returns 
     */
    onDelMany: (shortKey: string, identities: string[], key: string = UseCacheConfig.defaultIdentiyKey, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (storageType === StorageType.NONE)
            return undefined

        const str = CacheStorage.getItem(shortKey)
        if (str) {
            let arry: any[] = JSON.parse(str)
            if (arry && arry.length > 0) {
                //搜索现有列表，找到后删除
                for (let i = 0; i < arry.length; i++) {
                    for (let j = 0; j < identities.length; j++) {
                        const value = identities[j]
                        if (arry[i][key] === value) {
                            if (UseCacheConfig.EnableDebug) console.log(`del one: ${key}=${value}`)
                            arry.splice(i, 1)
                        }
                    }
                }
                CacheStorage.saveItem(shortKey, JSON.stringify(arry))
                return arry;
            }
        }
        return undefined
    },

    /**
     * evict the key cache with storageType
     * @param shortKey 
     * @param storageType 
     */
    evictCache: (shortKey: string, storageType: number = UseCacheConfig.defaultStorageType) => {
        const key = UseCacheConfig.cacheKeyPrefix + shortKey
        if (storageType === StorageType.OnlySessionStorage) {
            sessionStorage.removeItem(key)
        } else if (storageType === StorageType.OnlyLocalStorage) {
            localStorage.removeItem(key)
        }
        else if (storageType === StorageType.BothStorage) {
            sessionStorage.removeItem(key)
            localStorage.removeItem(key)
        }
    },

    /**
     * evict all cache with storageType
     * @param storageType 
     */
    evictAllCaches: (storageType: number = UseCacheConfig.defaultStorageType) => {
        if (storageType === StorageType.OnlySessionStorage) {
            sessionStorage.clear()
        } else if (storageType === StorageType.OnlyLocalStorage) {
            localStorage.clear()
        }
        else if (storageType === StorageType.BothStorage) {
            sessionStorage.clear()
            localStorage.clear()
        }
    },
}





