import { StorageType } from "./StorageType"
import { UseCacheConfig } from "./Config"
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

        const myKey = key? key : UseCacheConfig.defaultIdentiyKey 
        const str = CacheStorage.getItem(shortKey, storageType)
        if (str) {
            let arry: any[] = JSON.parse(str)
            if (arry && arry.length > 0) {
                for (let i = 0; i < arry.length; i++) {
                    if (arry[i][myKey] === identity) {
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

        const myKey = key? key : UseCacheConfig.defaultIdentiyKey 
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

        if (UseCacheConfig.EnableLog) console.log("Cache.onAddOne: done, shortKey: "+shortKey)
    },


    /**
     * call it when update one successully
     * @param shortKey cachekey = UseCacheConfig.cacheKeyPrefix() + shortKey
     * @param e entity
     * @param id find one by which key, default:"_id"
     * @param storageType 
     * @returns 
     */
    onEditOne: (shortKey: string, e: any, key: string = UseCacheConfig.defaultIdentiyKey, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (storageType === StorageType.NONE)
            return

        const myKey = key? key : UseCacheConfig.defaultIdentiyKey 
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
                        return;
                    }
                }
                if (UseCacheConfig.EnableLog) console.log(`Cache.onEditOne：not found in list, key=${myKey}, shortKey: ${shortKey}`)
                return
            }
        } else
            if (UseCacheConfig.EnableLog) console.log("Cache.onEditOne：not found list: shortKey: " + shortKey)
    },




    /**
     * call it after batch update
     * @param shortKey cachekey = UseCacheConfig.cacheKeyPrefix() + shortKey
     * @param list entity
     * @param key find one by which key, default:"_id"
     * @param storageType 
     * @returns 
     */
    onEditMany: (shortKey: string, list: any[], key: string = UseCacheConfig.defaultIdentiyKey, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (storageType === StorageType.NONE)
            return

        const myKey = key? key : UseCacheConfig.defaultIdentiyKey 
        const str = CacheStorage.getItem(shortKey, storageType)
        if (str) {
            let arry: any[] = JSON.parse(str)
            if (arry && arry.length > 0) {
                for (let j = 0; j < list.length; j++) {
                    const e = list[j]
                    //搜索现有列表，找到后更新
                    for (let i = 0; i < arry.length; i++) {
                        if (arry[i][myKey] === e[myKey]) {
                            arry[i] = e
                        }
                    }
                }
                CacheStorage.saveItem(shortKey, JSON.stringify(arry))
                if (UseCacheConfig.EnableLog) console.log("Cache.onEditMany: updateMany done, shortKey: " + shortKey)
                return
            } else {
                CacheStorage.saveItem(shortKey, JSON.stringify(list))
                if (UseCacheConfig.EnableLog) console.log("Cache.onEditMany: insert done, shortKey: " + shortKey)
                return
            }
        } else
            if (UseCacheConfig.EnableLog) console.log("Cache.onEditMany: not found list, shortKey: " + shortKey)
    },


    /**
     * call it when delete one successfully
     * @param shortKey cachekey = UseCacheConfig.cacheKeyPrefix() + shortKey
     * @param id value of key 
     * @param key find one by which key, default:"_id"
     * @param storageType 
     * @returns 
     */
    onDelOneById: (shortKey: string, id: string, key: string = UseCacheConfig.defaultIdentiyKey, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (storageType === StorageType.NONE)
            return undefined

        const myKey = key? key : UseCacheConfig.defaultIdentiyKey
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
                        return arry;
                    }
                }
            }
        }
        return undefined
    },


    /**
     * call it when delete one successfully
     * @param shortKey cachekey = UseCacheConfig.cacheKeyPrefix() + shortKey
     * @param e entity, item of list
     * @param key find one by which key, default:"_id"
     * @param storageType 
     * @returns 
     */
     onDelOne: (shortKey: string, e: any, key: string = UseCacheConfig.defaultIdentiyKey, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (storageType === StorageType.NONE)
            return undefined

        const myKey = key? key : UseCacheConfig.defaultIdentiyKey
        const id = e[myKey]?.toString()
        if(id)
            Cache.onDelOneById(shortKey, id, key, storageType)
            if (UseCacheConfig.EnableLog) console.log(`Cache.onDelOne: del done: ${myKey}=${id}, shortKey: ${shortKey}`)
        else{
            console.log("Cache.onDelOne: not found id by key=" + myKey + "in entity=" + JSON.stringify(e))
        }
        return undefined
    },

    /**
     * call it when batch delete manys successfully
     * @param shortKey cachekey = UseCacheConfig.cacheKeyPrefix() + shortKey
     * @param ids values of key 
     * @param key find one by which key, default:"_id"
     * @param storageType 
     * @returns 
     */
    onDelManyByIds: (shortKey: string, ids: string[], key: string = UseCacheConfig.defaultIdentiyKey, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (storageType === StorageType.NONE)
            return undefined

        const myKey = key? key : UseCacheConfig.defaultIdentiyKey
        const str = CacheStorage.getItem(shortKey)
        if (str) {
            let arry: any[] = JSON.parse(str)
            if (arry && arry.length > 0) {
                //搜索现有列表，找到后删除
                for (let i = 0; i < arry.length; i++) {
                    for (let j = 0; j < ids.length; j++) {
                        const value = ids[j]
                        if (arry[i][myKey] === value) {
                            if (UseCacheConfig.EnableLog) console.log(`Cache.onDelManyByIds: del one: ${myKey}=${value}, shortKey: ${shortKey}`)
                            arry.splice(i, 1)
                        }
                    }
                }
                CacheStorage.saveItem(shortKey, JSON.stringify(arry))
                if (UseCacheConfig.EnableLog) console.log(`Cache.onDelManyByIds: del done, shortKey: ${shortKey}`)
                return arry;
            }
        }
        return undefined
    },
    /**
     * call it when batch delete manys successfully
     * @param shortKey cachekey = UseCacheConfig.cacheKeyPrefix() + shortKey
     * @param list entity list
     * @param key find one by which key, default:"_id"
     * @param storageType 
     * @returns 
     */
     onDelMany: (shortKey: string, list: any[], key: string = UseCacheConfig.defaultIdentiyKey, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (storageType === StorageType.NONE)
            return undefined

        const myKey = key? key : UseCacheConfig.defaultIdentiyKey
        const ids = list.map(e => e[myKey]?.toString()).filter(e=> !!e)
        if(ids && ids.length > 0){
            Cache.onDelManyByIds(shortKey, ids, key, storageType)
        }else{
            if (UseCacheConfig.EnableLog) console.log("Cache.onDelOne: not found id by key=" + myKey + "in entity list=" + JSON.stringify(list))
        }
        return undefined
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

        if (UseCacheConfig.EnableLog) console.log("Cache.evictCache done, shortKey: "+shortKey)
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





