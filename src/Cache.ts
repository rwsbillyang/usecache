import { StorageType } from "./StorageType"
import { UseCacheConfig } from "./Config"
import { CacheStorage } from "./CacheStorage"

export const Cache = {

    /**
     * find one from cache
     * @param shortKey 
     * @param id 
     * @param idKey 
     * @param storageType default configed in UseCacheConfig.defaultStorageType
     * @returns 
     */
    findOne: (shortKey: string, id: string | number | undefined, idKey: string = UseCacheConfig.defaultIdentiyKey, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (id === undefined) {
            if (UseCacheConfig.EnableLog) console.log("Cache.findOne: no id")
            return undefined
        }
        if (storageType === StorageType.NONE)
            return undefined

        const myKey = idKey ? idKey : UseCacheConfig.defaultIdentiyKey
        const str = CacheStorage.getItem(shortKey, storageType)
        if (str) {
            let arry: any[] = JSON.parse(str)
            if (arry && arry.length > 0) {
                for (let i = 0; i < arry.length; i++) {
                    if (arry[i][myKey] === id) {
                        if (UseCacheConfig.EnableLog) console.log("Cache.findOne: found, shortKey: " + shortKey)
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

        const myKey = key ? key : UseCacheConfig.defaultIdentiyKey
        const str = CacheStorage.getItem(shortKey, storageType)
        if (str) {
            let arry: any[] = JSON.parse(str)
            if (arry && arry.length > 0) {
                for (let i = 0; i < arry.length; i++) {
                    const e = arry[i]
                    for (let j = 0; j < identities.length; j++) {
                        if (e[myKey] === identities[j]) {
                            arry.push(e)
                        }
                    }
                }
                if (UseCacheConfig.EnableLog) console.log("Cache.findMany: found, shortKey: " + shortKey)
                return arry
            }
        }
        return undefined
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
            return false

        const str = CacheStorage.getItem(shortKey, storageType)
        if (str) {
            const arry: T[] = JSON.parse(str)
            if (arry && arry.length > 0) {
                arry.unshift(e)
                CacheStorage.saveObject(shortKey, arry)
            } else {
                CacheStorage.saveObject(shortKey, [e])
            }
        } else {
            CacheStorage.saveObject(shortKey, [e])
        }

        if (UseCacheConfig.EnableLog) console.log("Cache.onAddOne: done, shortKey: " + shortKey)
        return true
    },


    /**
     * call it when update one successully
     * @param shortKey cachekey = UseCacheConfig.cacheKeyPrefix() + shortKey
     * @param e entity
     * @param id find one by which key, default:"_id"
     * @param storageType 
     * @returns return true if update one successfully, or else false
     */
    onEditOne: (shortKey: string, e: any, key: string = UseCacheConfig.defaultIdentiyKey, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (storageType === StorageType.NONE)
            return false

        const myKey = key ? key : UseCacheConfig.defaultIdentiyKey
        const str = CacheStorage.getItem(shortKey, storageType)
        if (str) {
            let arry: any[] = JSON.parse(str)
            if (arry && arry.length > 0) {
                //搜索现有列表，找到后更新
                for (let i = 0; i < arry.length; i++) {
                    if (arry[i][myKey] === e[myKey]) {
                        if (UseCacheConfig.EnableLog) console.log(`Cache.onEditOne, e[${myKey}]=${e[myKey]}, shortKey: ${shortKey}`)
                        arry[i] = e
                        CacheStorage.saveObject(shortKey, arry)
                        return true;
                    }
                }
                if (UseCacheConfig.EnableLog) console.log(`Cache.onEditOne：not found in list, key=${myKey}, shortKey: ${shortKey}`)
            }
        } else {
            if (UseCacheConfig.EnableLog) console.log("Cache.onEditOne：not found list: shortKey: " + shortKey)
        }
        return false
    },




    /**
     * call it after batch update
     * @param shortKey cachekey = UseCacheConfig.cacheKeyPrefix() + shortKey
     * @param list entity
     * @param key find one by which key, default:"_id"
     * @param storageType 
     * @returns update none return false, return true if update any one success 
     */
    onEditMany: (shortKey: string, list: any[], key: string = UseCacheConfig.defaultIdentiyKey, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (storageType === StorageType.NONE)
            return false

        const myKey = key ? key : UseCacheConfig.defaultIdentiyKey
        const str = CacheStorage.getItem(shortKey, storageType)
        if (str) {
            let flag = false
            let arry: any[] = JSON.parse(str)
            if (arry && arry.length > 0) {
                for (let j = 0; j < list.length; j++) {
                    const e = list[j]
                    //搜索现有列表，找到后更新
                    for (let i = 0; i < arry.length; i++) {
                        if (arry[i][myKey] === e[myKey]) {
                            arry[i] = e
                            flag = true
                        }
                    }
                }
                if (flag) {
                    CacheStorage.saveItem(shortKey, JSON.stringify(arry))
                    if (UseCacheConfig.EnableLog) console.log("Cache.onEditMany: updateMany done, shortKey: " + shortKey)
                    return true
                }
            } else {
                CacheStorage.saveItem(shortKey, JSON.stringify(list))
                if (UseCacheConfig.EnableLog) console.log("Cache.onEditMany: insert done, shortKey: " + shortKey)
                return true
            }
        } else
            if (UseCacheConfig.EnableLog) console.log("Cache.onEditMany: not found list, shortKey: " + shortKey)
        return false
    },


    /**
     * call it when delete one successfully
     * @param shortKey cachekey = UseCacheConfig.cacheKeyPrefix() + shortKey
     * @param id value of key 
     * @param key find one by which key, default:"_id"
     * @param storageType 
     * @returns true if successful
     */
    onDelOneById: (shortKey: string, id: string | number | undefined, key: string = UseCacheConfig.defaultIdentiyKey, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (id === undefined || storageType === StorageType.NONE)
            return false

        const myKey = key ? key : UseCacheConfig.defaultIdentiyKey
        const str = CacheStorage.getItem(shortKey)
        if (str) {
            let arry: any[] = JSON.parse(str)
            if (arry && arry.length > 0) {
                //搜索现有列表，找到后删除
                for (let i = 0; i < arry.length; i++) {
                    if (arry[i][myKey] === id) {
                        arry.splice(i, 1)
                        CacheStorage.saveItem(shortKey, JSON.stringify(arry))
                        if (UseCacheConfig.EnableLog) console.log(`Cache.onDelOneById: del done: ${myKey}=${id}, shortKey: ${shortKey}`)
                        return true;
                    }
                }
            }
        }
        return false
    },


    /**
     * call it when delete one successfully
     * @param shortKey cachekey = UseCacheConfig.cacheKeyPrefix() + shortKey
     * @param e entity, item of list
     * @param key find one by which key, default:"_id"
     * @param storageType 
     * @returns true if successful
     */
    onDelOne: (shortKey: string, e: any, key: string = UseCacheConfig.defaultIdentiyKey, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (storageType === StorageType.NONE)
            return false

        const myKey = key ? key : UseCacheConfig.defaultIdentiyKey
        const id = e[myKey]?.toString()
        if (id) {
            if (UseCacheConfig.EnableLog) console.log(`Cache.onDelOne: del done: ${myKey}=${id}, shortKey: ${shortKey}`)
            return Cache.onDelOneById(shortKey, id, key, storageType)
        } else {
            console.log("Cache.onDelOne: not found id by key=" + myKey + "in entity=" + JSON.stringify(e))
        }
        return false
    },

    /**
     * call it when batch delete manys successfully
     * @param shortKey cachekey = UseCacheConfig.cacheKeyPrefix() + shortKey
     * @param ids values of key 
     * @param key find one by which key, default:"_id"
     * @param storageType 
     * @returns true if successful
     */
    onDelManyByIds: (shortKey: string, ids: string[] | number[] | undefined, key: string = UseCacheConfig.defaultIdentiyKey, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (!ids || storageType === StorageType.NONE)
            return false

        const myKey = key ? key : UseCacheConfig.defaultIdentiyKey
        const str = CacheStorage.getItem(shortKey)
        if (str) {
            let flag = false
            let arry: any[] = JSON.parse(str)
            if (arry && arry.length > 0) {
                //搜索现有列表，找到后删除
                for (let i = 0; i < arry.length; i++) {
                    for (let j = 0; j < ids.length; j++) {
                        const value = ids[j]
                        if (arry[i][myKey] === value) {
                            if (UseCacheConfig.EnableLog) console.log(`Cache.onDelManyByIds: del one: ${myKey}=${value}, shortKey: ${shortKey}`)
                            arry.splice(i, 1)
                            flag = true
                        }
                    }
                }
                if (flag) {
                    CacheStorage.saveItem(shortKey, JSON.stringify(arry))
                    if (UseCacheConfig.EnableLog) console.log(`Cache.onDelManyByIds: del done, shortKey: ${shortKey}`)
                }
                return true;
            }
        }
        return false
    },
    /**
     * call it when batch delete manys successfully
     * @param shortKey cachekey = UseCacheConfig.cacheKeyPrefix() + shortKey
     * @param list entity list
     * @param key find one by which key, default:"_id"
     * @param storageType 
     * @returns true if successful
     */
    onDelMany: (shortKey: string, list: any[], key: string = UseCacheConfig.defaultIdentiyKey, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (storageType === StorageType.NONE)
            return false

        const myKey = key ? key : UseCacheConfig.defaultIdentiyKey
        const ids = list.map(e => e[myKey]?.toString()).filter(e => !!e)
        if (ids && ids.length > 0) {
            return Cache.onDelManyByIds(shortKey, ids, key, storageType)
        } else {
            if (UseCacheConfig.EnableLog) console.log("Cache.onDelOne: not found id by key=" + myKey + "in entity list=" + JSON.stringify(list))
        }
        return false
    },
    /**
     * evict the key cache with storageType
     * @param shortKey 
     * @param storageType 
     */
    evictCache: (shortKey: string, storageType: number = UseCacheConfig.defaultStorageType) => {
        const key = UseCacheConfig.cacheSpace() + shortKey
        if (storageType === StorageType.OnlySessionStorage) {
            sessionStorage.removeItem(key)
        } else if (storageType === StorageType.OnlyLocalStorage) {
            localStorage.removeItem(key)
        }
        else if (storageType === StorageType.BothStorage) {
            sessionStorage.removeItem(key)
            localStorage.removeItem(key)
        }

        if (UseCacheConfig.EnableLog) console.log("Cache.evictCache done, shortKey: " + shortKey)
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
        if (UseCacheConfig.EnableLog) console.log("Cache.evictAllCaches done")
    },





}





