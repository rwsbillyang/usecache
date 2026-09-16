import { StorageType } from "./StorageType"
import { UseCacheConfig } from "./Config"
import { CacheStorage } from "./CacheStorage"

export const Cache = {

    parseArrayStr: <T extends object>(jsonStr: string)=>{
        try {
            const arry = JSON.parse(jsonStr)
            if (!Array.isArray(arry)) {
                console.error(`Not array: ${jsonStr} `)
                return undefined
            }else{
                return arry as T[]
            }
            
        } catch {
            console.error(`JSON.parse exception: ${jsonStr} `)
            return undefined
        }
    },


    /**
     * find one from cache
     * @param shortKey 
     * @param id 
     * @param idKey 
     * @param storageType default configed in UseCacheConfig.defaultStorageType
     * @returns 
     */
    findOne: <T extends object>(shortKey: string, id: string | number, idKey: keyof T, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (id === undefined) {
            if (UseCacheConfig.EnableLog) console.log("Cache.findOne: no id")
            return undefined
        }
        if (storageType === StorageType.NONE)
            return undefined

        //const myKey = idKey ? idKey : UseCacheConfig.defaultIdentiyKey
        const str = CacheStorage.getItem(shortKey, storageType)
        if (str) {
            let arry = Cache.parseArrayStr<T>(str)
            if (arry && arry.length > 0) {
                for (let i = 0; i < arry.length; i++) {
                    if (arry[i][idKey] === id) {
                        if (UseCacheConfig.EnableLog) console.log("Cache.findOne: found, shortKey: " + shortKey)
                        return arry[i]
                    }
                }
            }
        }
        return undefined
    },


    findMany: <T extends object>(shortKey: string, ids: (string | number)[], idKey: keyof T, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (storageType === StorageType.NONE)
            return undefined

        //const myKey = key ? key : UseCacheConfig.defaultIdentiyKey
        const str = CacheStorage.getItem(shortKey, storageType)
        if (str) {
            let arry = Cache.parseArrayStr<T>(str)
            if (arry && arry.length > 0) {
                for (let i = 0; i < arry.length; i++) {
                    const e = arry[i]
                    for (let j = 0; j < ids.length; j++) {
                        if (e[idKey] === ids[j]) {
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
    onAddOneInList: <T>(e: T, arry?: T[]) => {
        if (arry && arry.length > 0) {
            arry.unshift(e)
        } else {
            return [e]
        }

        return arry
    },


    /**
     * call it when update one successully
     * @param shortKey cachekey = UseCacheConfig.cacheKeyPrefix() + shortKey
     * @param e entity
     * @param idKey find one by which key, default:"_id"
     * @param storageType 
     * @returns return true if update one successfully, or else false
     */
    onEditOne: <T extends object>(shortKey: string, e: T, objectKey: keyof T, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (storageType === StorageType.NONE)
            return false

        //const myKey = idKey || UseCacheConfig.defaultIdentiyKey
        const str = CacheStorage.getItem(shortKey, storageType)
        if (str) {
            let arry = Cache.parseArrayStr<T>(str)
            if (arry && arry.length > 0) {
                //搜索现有列表，找到后更新
                for (let i = 0; i < arry.length; i++) {
                    if (arry[i][objectKey] === e[objectKey]) {
                        if (UseCacheConfig.EnableLog) console.log(`Cache.onEditOne, shortKey: ${shortKey}`)
                        arry[i] = e
                        CacheStorage.saveObject(shortKey, arry)
                        return true;
                    }
                }
                if (UseCacheConfig.EnableLog) console.log(`Cache.onEditOne：not found in list, shortKey: ${shortKey}`)
            }
        } else {
            if (UseCacheConfig.EnableLog) console.log("Cache.onEditOne：not found list: shortKey: " + shortKey)
        }
        return false
    },

    onEditOneInList: <T extends object>(e: T,  objectKey: keyof T, arry?: T[]) => {
        //const myKey = idKey || UseCacheConfig.defaultIdentiyKey
        if (arry && arry.length > 0) {
            //搜索现有列表，找到后更新
            for (let i = 0; i < arry.length; i++) {
                if (arry[i][objectKey] === e[objectKey]) {
                    if (UseCacheConfig.EnableLog) console.log(`Cache.onEditOne`)
                    arry[i] = e

                    return true;
                }
            }
        }
        return false
    },


    /**
     * call it after batch update
     * @param shortKey cachekey = UseCacheConfig.cacheKeyPrefix() + shortKey
     * @param list entity
     * @param objectKey find one by which key, default:"_id"
     * @param storageType 
     * @returns update none return false, return true if update any one success 
     */
    onEditMany: <T extends object>(shortKey: string, list: T[], objectKey: keyof T, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (storageType === StorageType.NONE)
            return false

        //const myKey = key ? key : UseCacheConfig.defaultIdentiyKey
        const str = CacheStorage.getItem(shortKey, storageType)
        if (str) {
            let flag = false
            let arry: T[] = JSON.parse(str)
            if (arry && arry.length > 0) {
                for (let j = 0; j < list.length; j++) {
                    const e = list[j]
                    //搜索现有列表，找到后更新
                    for (let i = 0; i < arry.length; i++) {
                        if (arry[i][objectKey] === e[objectKey]) {
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

    onEditManyInList: <T extends object>(list: T[], objectKey: keyof T, arry?: T[]) => {
       // const myKey = key ? key : UseCacheConfig.defaultIdentiyKey
        let flag = false
        if (arry && arry.length > 0) {
            for (let j = 0; j < list.length; j++) {
                const e = list[j]
                //搜索现有列表，找到后更新
                for (let i = 0; i < arry.length; i++) {
                    if (arry[i][objectKey] === e[objectKey]) {
                        arry[i] = e
                        flag = true
                    }
                }
            }
        }
        return flag
    },
    /**
     * call it when delete one successfully
     * @param shortKey cachekey = UseCacheConfig.cacheKeyPrefix() + shortKey
     * @param id value of key 
     * @param key find one by which key, default:"_id"
     * @param storageType 
     * @returns true if successful
     */
    onDelOneById: <T extends object>(shortKey: string, objectKey: keyof T, id?: string | number,  storageType: number = UseCacheConfig.defaultStorageType) => {
        if (id === undefined || storageType === StorageType.NONE)
            return false

        //const myKey = key ? key : UseCacheConfig.defaultIdentiyKey
        const str = CacheStorage.getItem(shortKey)
        if (str) {
            let arry: T[] = JSON.parse(str)
            if (arry && arry.length > 0) {
                //搜索现有列表，找到后删除
                for (let i = 0; i < arry.length; i++) {
                    if (arry[i][objectKey] === id) {
                        arry.splice(i, 1)
                        CacheStorage.saveItem(shortKey, JSON.stringify(arry))
                        if (UseCacheConfig.EnableLog) console.log(`Cache.onDelOneById: del done: ${id}, shortKey: ${shortKey}`)
                        return true;
                    }
                }
            }
        }
        return false
    },

    onDelOneByIdInList: <T extends object>(id: string | number, objectKey: keyof T, arry?: T[]) => {

        //const myKey = key ? key : UseCacheConfig.defaultIdentiyKey
        if (arry && arry.length > 0) {
            //搜索现有列表，找到后删除
            for (let i = 0; i < arry.length; i++) {
                if (arry[i][objectKey] === id) {
                    arry.splice(i, 1)
            
                    return true;
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
    onDelOne: <T extends object>(shortKey: string, e: T, objectKey: keyof T, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (storageType === StorageType.NONE)
            return false

        //const myKey = key || UseCacheConfig.defaultIdentiyKey
        const id = e[objectKey]?.toString()
        if (id) {
            if (UseCacheConfig.EnableLog) console.log(`Cache.onDelOne: del done: ${id}, shortKey: ${shortKey}`)
            return Cache.onDelOneById(shortKey, objectKey, id, storageType)
        } else {
            console.log("Cache.onDelOne: not found in entity=" + JSON.stringify(e))
        }
        return false
    },
    onDelOneInList: <T extends object>(e: T, objectKey: keyof T, arry?: T[]) => {
        //const myKey = key || UseCacheConfig.defaultIdentiyKey
        const id = e[objectKey]?.toString()
        if (id) {
            return Cache.onDelOneByIdInList(id, objectKey, arry)
        } else {
            console.log("Cache.onDelOne: not found id entity=" + JSON.stringify(e))
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
    onDelManyByIds: <T extends object>(shortKey: string, objectKey: keyof T, ids?: (string | number)[], storageType: number = UseCacheConfig.defaultStorageType) => {
        if (!ids || storageType === StorageType.NONE)
            return false

        //const myKey = key || UseCacheConfig.defaultIdentiyKey
        const str = CacheStorage.getItem(shortKey)
        if (str) {
            let flag = false
            let arry: T[] = JSON.parse(str)
            if (arry && arry.length > 0) {
                //搜索现有列表，找到后删除
                for (let i = 0; i < arry.length; i++) {
                    for (let j = 0; j < ids.length; j++) {
                        const value = ids[j]
                        if (arry[i][objectKey] === value) {
                            if (UseCacheConfig.EnableLog) console.log(`Cache.onDelManyByIds: del one: ${value}, shortKey: ${shortKey}`)
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
    onDelManyByIdsInList: <T extends object>(objectKey: keyof T, ids?: (string | number)[], arry?: T[]) => {
        if (!ids) return false
        //const myKey = key || UseCacheConfig.defaultIdentiyKey
        let flag = false
        if (arry && arry.length > 0) {
            //搜索现有列表，找到后删除
            for (let i = 0; i < arry.length; i++) {
                for (let j = 0; j < ids.length; j++) {
                    const value = ids[j]
                    if (arry[i][objectKey] === value) {
                        if (UseCacheConfig.EnableLog) console.log(`Cache.onDelManyByIds: del one: ${value}`)
                        arry.splice(i, 1)
                        flag = true
                    }
                }
            }
        }
        return flag
    },
    /**
     * call it when batch delete manys successfully
     * @param shortKey cachekey = UseCacheConfig.cacheKeyPrefix() + shortKey
     * @param list entity list
     * @param key find one by which key, default:"_id"
     * @param storageType 
     * @returns true if successful
     */
    onDelMany: <T extends object>(shortKey: string, list: T[], objectKey: keyof T, storageType: number = UseCacheConfig.defaultStorageType) => {
        if (storageType === StorageType.NONE)
            return false

        //const myKey = key || UseCacheConfig.defaultIdentiyKey
        const ids = list.map(e => e[objectKey]?.toString()).filter(e => !!e) as string[]
        if (ids && ids.length > 0) {
            return Cache.onDelManyByIds(shortKey, objectKey, ids,  storageType)
        } else {
            if (UseCacheConfig.EnableLog) console.log("Cache.onDelOne: not found id in entity list=" + JSON.stringify(list))
        }
        return false
    },
    onDelManyInList: <T extends object>(toDelList: T[], objectKey: keyof T, arry?: T[]) => {
        
       // const myKey = key || UseCacheConfig.defaultIdentiyKey
        const ids = toDelList.map(e => e[objectKey]?.toString()).filter(e => !!e) as string[] || undefined
        if (ids && ids.length > 0) {
            return Cache.onDelManyByIdsInList(objectKey, ids, arry)
        } else {
            if (UseCacheConfig.EnableLog) console.log("Cache.onDelOne: not found id in entity list=" + JSON.stringify(toDelList))
        }
        return false
    },
    /**
     * evict given key cache with storageType
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





