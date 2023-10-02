import { UseCacheConfig } from "./Config"
import { StorageType } from "./StorageType"
import { CacheStorage } from "./CacheStorage"
import { Cache } from "./Cache"
import { ArrayUtil } from "./ArrayUtil"


export const TreeCache = {

    /**
     * 返回通过path节点id路径，返回缓存中对应的元素数组
     * @param shortKey cacheKey
     * @param path 节点id路径
     * @param idKey 数组 数组中元素进行相等性比较时，用哪个字段，默认id，若元素的id相同，就认为两个元素相同
     * @param childrenFieldName 存储父节点id信息的字符串，默认 children
     * @param storageType 缓存类型
     */
    getElementsByPathIdsInTreeFromCache: <T>(
        shortKey: string,
        path?: (string | number)[],
        idKey: string = UseCacheConfig.defaultIdentiyKey,
        childrenFieldName: string = "children",
        storageType: number = UseCacheConfig.defaultStorageType,
        debug: boolean = UseCacheConfig.EnableLog) => {
        if (storageType === StorageType.NONE) {
            if (debug) console.log("StorageType is none")
            return undefined
        }
        if (!path || path.length === 0) {
            if (debug) console.log("no path")
            return undefined
        }

        const str = CacheStorage.getItem(shortKey, storageType)
        if (str) {
            let array: T[] = JSON.parse(str)
            return ArrayUtil.getArrayByPathInTree(array, path, idKey, childrenFieldName)
        } else {
            if (debug) console.log("no key=" + shortKey)
        }
        return undefined
    },


    /**
     * 从数组array中，根据children字段查找某节点e 返回路径的元素数组
     * @param shortKey 存储数组都的cache key, 由其得到待查询的数组
     * @param id 待查找的元素id
     * @param all 是否获取所有，否则只是第一个路径
     * @param childrenFieldName 存储父节点id信息的字符串，默认 children
     * @param idKey 数组 数组中元素进行相等性比较时，用哪个字段，默认id，若元素的id相同，就认为两个元素相同
     * @param storageType 缓存类型
     * @returns 如果all为true（默认），返回所有path路径数组，否则返回path。 path是从根节点到所寻找叶子节点的数组
     */
    getPathFromTreeCacheKey: <T>(
        shortKey: string,
        id: string | number | undefined,
        all: boolean = true, 
        childrenFieldName: string = "children",
        idKey: string = UseCacheConfig.defaultIdentiyKey,
        storageType: number = UseCacheConfig.defaultStorageType): T[][] | T[] | undefined => {

        if (id === undefined) {
            if (UseCacheConfig.EnableLog) console.log("Cache.findOne: no id")
            return undefined
        }
        if (storageType === StorageType.NONE)
            return undefined

        const str = CacheStorage.getItem(shortKey, storageType)
        if (str) {
            let array: T[] = JSON.parse(str)
            if (all) {
                const allPaths: T[][] = []
                ArrayUtil.findAllFromTree(allPaths, array, id, childrenFieldName, idKey)
                return allPaths
            } else {
                return ArrayUtil.findOneFromTree(array, id, childrenFieldName, idKey)?.reverse()
            }
        }
        return undefined
    },


    /**
     * 将数据插入到树上的一个节点中后，然后更新其缓存
     * @param shortKey 缓存键
     * @param e 待插入的数据
     * @param idPath 插入的父路径节点id数组，若为空插入到根节点
     * @param idKey 父路径数组元素中取值的key，通常为id
     * @param childrenFieldName tree节点的children字段名称，默认children
     * @param updateRelation 更新亲子关系 避免对相关节点再次修改时，其亲子关系还是老旧数据，以及在插入子项前，对数据e的parent做一些操作，比如更新其parentPath 
     * eg: currentRow.parentPath = [...parent.parentPath, currentRow[idKey]]
     * @param storageType 
     * @param debug 
     * @returns 
     */
    onAddOneInTree: <T>(
        shortKey: string,
        e: T,
        idPath: (string | number)[],
        updateRelation: (parent: T, e: T, parents: T[]) => void,
        idKey: string = UseCacheConfig.defaultIdentiyKey,
        childrenFieldName: string = "children",
        storageType: number = UseCacheConfig.defaultStorageType,
        debug: boolean = UseCacheConfig.EnableLog) => {
        if (storageType === StorageType.NONE) {
            return false
        }

        if (idPath.length === 0) {//root node
            Cache.onAddOne(shortKey, e, storageType)
        } else {
            const parents: T[] | undefined = TreeCache.getElementsByPathIdsInTreeFromCache(shortKey, idPath, idKey, childrenFieldName, storageType, debug)
            if (!parents || parents.length === 0) {
                console.warn("no parentElemPath for parentIdPath, shortKey=" + shortKey + ", idKey=" + idKey + ", parentPath=" + JSON.stringify(parents))
                return false
            }
            if (parents?.length != idPath.length) {
                console.warn("not get enough parentElemPath for parentIdPath, shortKey=" + shortKey + ", idKey=" + idKey + ", parentPath=" + JSON.stringify(idPath))
                return false
            }

            const parent = parents[parents.length - 1]

            //if (beforeAddIfNotRoot) beforeAddIfNotRoot(parents, parent)
            updateRelation(parent, e, parents)

            if (!parent[childrenFieldName]) {
                parent[childrenFieldName] = [e]
            } else {
                parent[childrenFieldName].push(e)
            }
            Cache.onEditOne(shortKey, parents[0], idKey, storageType)
        }
        return true
    },


    /**
     * 修改某项的值后，更新其树形缓存
     * @param shortKey 缓存键
     * @param e 修改后的值
     * @param idPath 包含了自身的id路径path，即指定了e的位置
     * @param idKey 父路径数组元素中取值的key，通常为id
     * @param childrenFieldName tree节点的children字段名称，默认children
     * @param storageType 
     * @param debug 
     */
    onEditOneInTree: <T>(
        shortKey: string,
        e: T,
        idPath: (string | number)[],
        idKey: string = UseCacheConfig.defaultIdentiyKey,
        childrenFieldName: string = "children",
        storageType: number = UseCacheConfig.defaultStorageType,
        debug: boolean = UseCacheConfig.EnableLog) => {
        if (storageType === StorageType.NONE) {
            return false
        }
        if (idPath.length === 0) {
            console.warn("idPath is empty")
            return false
        }

        const elemPath: T[] | undefined = TreeCache.getElementsByPathIdsInTreeFromCache(shortKey, idPath, idKey, childrenFieldName, storageType, debug)
        if (!elemPath || elemPath.length === 0) {
            console.warn("no elemPath for idPath, shortKey=" + shortKey + ", idKey=" + idKey + ", idPath=" + JSON.stringify(idPath))
            return false
        }
        if (elemPath?.length != idPath.length) {
            console.warn("not get enough elemPath for idPath, shortKey=" + shortKey + ", idKey=" + idKey + ", idPath=" + JSON.stringify(idPath))
            return false
        }
        if (elemPath.length === 1) {//root node
            Cache.onEditOne(shortKey, e, idKey, storageType)
        } else {
            //更新父节点中children中的自己
            //注意；自己的children的parentPath开始以自己为起点，需仍以原来的为准，不做修改
            const parent = elemPath[elemPath.length - 2]
            const children = parent[childrenFieldName]
            let flag = false
            for (let i = 0; i < children.length; i++) {
                if (children[i][idKey] === e[idKey]) {
                    //if (beforeUpdateIfNotRoot) beforeUpdateIfNotRoot(elemPath, parent)
                    children[i] = e
                    flag = true
                    if (debug) console.log("got one and update it in chidlren")
                    break
                }
            }
            if (!flag) {
                if (debug) console.warn("not found in chidlren, shortKey=" + shortKey + ", idKey=" + idKey + ", idPath=" + JSON.stringify(idPath) + ", parent=", parent)
                return false
            } else {
                Cache.onEditOne(shortKey, elemPath[0], idKey, storageType)//elemPath使用了引用，因而后面的元素也是第一个元素的children
            }
        }

        return true
    },


    /**
     * 从树形结构结构中删除某项，通过idPath指定该项位置，然后更新其缓存
     * @param shortKey 
     * @param e 待删除项
     * @param idPath 待删除项所在id路径
     * @param updateRelation 更新亲子关系 避免对相关节点再次修改时，其亲子关系还是老旧数据
     * @param idKey 删除比较时所采用的键，通常为id
     * @param childrenFieldName 树形结构中孩子名称，默认为children
     * @param storageType 
     * @param debug log开关
     * @returns 
     */
    onDelOneInTree: <T>(
        shortKey: string,
        e: T,
        idPath: (string | number)[],
        updateRelation: (parent: T, e: T, parents: T[]) => void,
        idKey: string = UseCacheConfig.defaultIdentiyKey,
        childrenFieldName: string = "children",
        storageType: number = UseCacheConfig.defaultStorageType,
        debug: boolean = UseCacheConfig.EnableLog
    ) => {
        if (storageType === StorageType.NONE) {
            return false
        }
        if (idPath.length === 0) {
            console.warn("idPath is empty")
            return false
        }

        if (idPath.length === 1) {
            if (debug) console.log("del root node in cache")
            Cache.onDelOneById(shortKey, idPath[0], idKey, storageType)
            return true
        }

        const elemPath: T[] | undefined = TreeCache.getElementsByPathIdsInTreeFromCache(shortKey, idPath, idKey, childrenFieldName, storageType, debug)
        if (!elemPath || elemPath.length === 0) {
            console.warn("no elemPath for idPath, shortKey=" + shortKey + ", idKey=" + idKey + ", idPath=" + JSON.stringify(idPath))
            return false
        }
        if (elemPath?.length != idPath.length) {
            console.warn("not get enough elemPath for idPath, shortKey=" + shortKey + ", idKey=" + idKey + ", idPath=" + JSON.stringify(idPath))
            return false
        }

        const parent = elemPath[elemPath.length - 2]
        
        updateRelation(parent, e, elemPath)

        const children = parent[childrenFieldName]
        let flag = false
        for (let i = 0; i < children.length; i++) {
            if (children[i][idKey] === e[idKey]) {
                children.splice(i, 1)
                flag = true
                if (debug) console.log("got one and update it in chidlren")
                break
            }
        }
        if (!flag) {
            if (debug) console.warn("not found in chidlren, shortKey=" + shortKey + ", idKey=" + idKey + ", idPath=" + JSON.stringify(idPath) + ", parent=", parent)
            return false
        } else {
            Cache.onEditOne(shortKey, elemPath[0], idKey, storageType)//elemPath使用了引用，因而后面的元素也是第一个元素的children
        }

        return true
    }


}