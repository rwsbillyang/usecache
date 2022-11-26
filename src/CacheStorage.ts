import { StorageType } from "./StorageType"
import {UseCacheConfig } from "./UseCacheConfig"

export const CacheStorage = {
    /**
     * 
     * @param shortKey cachekey = UseCacheConfig.cacheKeyPrefix() + shortKey
     * @param storageType localStorage or sessionStorage, or both, or none
     * @param defaultValue  default value
     * @returns string or undefined
     */
    getItem: (shortKey: string, storageType: number = StorageType.OnlySessionStorage, defaultValue?: string) => {
        if (storageType === StorageType.NONE)
            return defaultValue
    
        let v: string | null | undefined = undefined
        const key = UseCacheConfig.cacheKeyPrefix() + shortKey
        if (storageType === StorageType.OnlySessionStorage) {
            v = sessionStorage.getItem(key)
        } else if (storageType === StorageType.OnlyLocalStorage) {
            v = localStorage.getItem(key)
        }
        else if (storageType === StorageType.BothStorage) {
            v = sessionStorage.getItem(key)
            if (!v) {
                v = localStorage.getItem(key)
                if (v) sessionStorage.setItem(key, v)
            }
        }
        if(UseCacheConfig.EnableLog) console.log(`CacheStorage.getItem: key=${key}, defaultValue=${defaultValue}`)
        return v || defaultValue
    },

    /**
     * 
     * @param shortKey cachekey = UseCacheConfig.cacheKeyPrefix() + shortKey
     * @param storageType localStorage or sessionStorage, or both, or none
     * @param defaultValue  default value
     * @returns object after JSON.parse
     */
    getObject: (shortKey: string, storageType: number = StorageType.OnlySessionStorage, defaultValue?: object) => {
        const str = CacheStorage.getItem(shortKey, storageType)
        if(!str) 
            return defaultValue
        else
            return JSON.parse(str)
    },

    /**
     * 
     * @param shortKey cachekey = UseCacheConfig.cacheKeyPrefix() + shortKey
     * @param v string value 
     * @param storageType ocalStorage or sessionStorage, or both
     * @returns 
     */
    saveItem:  (shortKey: string, v: string, storageType: number = StorageType.OnlySessionStorage) => {
        if (storageType === StorageType.NONE)
            return
        const key = UseCacheConfig.cacheKeyPrefix() + shortKey
        if (storageType === StorageType.OnlySessionStorage) {
            sessionStorage.setItem(key, v)
        } else if (storageType === StorageType.OnlyLocalStorage) {
            localStorage.setItem(key, v)
        }
        else if (storageType === StorageType.BothStorage) {
            sessionStorage.setItem(key, v)
            localStorage.setItem(key, v)
        }

        if(UseCacheConfig.EnableLog) console.log(`CacheStorage.saveItem: key=${key}, v=${v}`)
    }, 

    /**
     * 
     * @param shortKey cachekey = UseCacheConfig.cacheKeyPrefix() + shortKey
     * @param v object after JSON.stringify and save it
     * @param storageType ocalStorage or sessionStorage, or both
     */
    saveObject: (shortKey: string, v: object, storageType: number = StorageType.OnlySessionStorage) => {
        return CacheStorage.saveItem(shortKey, JSON.stringify(v), storageType)
    },

    remove: (shortKey: string,  storageType: number = StorageType.OnlySessionStorage) => {
        if (storageType === StorageType.NONE)
            return
        const key = UseCacheConfig.cacheKeyPrefix() + shortKey
        if (storageType === StorageType.OnlySessionStorage) {
            sessionStorage.removeItem(key)
        } else if (storageType === StorageType.OnlyLocalStorage) {
            localStorage.removeItem(key)
        }
        else if (storageType === StorageType.BothStorage) {
            sessionStorage.removeItem(key)
            localStorage.removeItem(key)
        }
    }
}
