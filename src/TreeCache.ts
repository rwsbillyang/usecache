import { UseCacheConfig } from "./Config"
import { StorageType } from "./StorageType"
import { CacheStorage } from "./CacheStorage"
import { Cache } from "./Cache"


export const TreeCache = {

    /**
     * 在缓存中返回通过path节点id路径返回对应的元素数组
     * @param shortKey 
     * @param path 
     * @param idKey 数组 数组中元素进行相等性比较时，用哪个字段，默认id，若元素的id相同，就认为两个元素相同
     * @param childrenFieldName 存储父节点id信息的字符串，默认 children
     * @param storageType 缓存类型
     */
    getElementsByPathIdsInTreeFromCache: (
        shortKey: string,
        path?: (string | number)[],
        idKey: string = UseCacheConfig.defaultIdentiyKey,
        childrenFieldName: string = "children",
        storageType: number = UseCacheConfig.defaultStorageType,
        debug: boolean = true) => {
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
            let array: any[] = JSON.parse(str)
            return TreeCache.getElementsByPathIdsInTree(array, path, idKey, childrenFieldName, storageType)
        } else {
            if (debug) console.log("no key=" + shortKey)
        }
        return undefined
    },



    /**
     * 在缓存中返回通过path节点id路径返回对应的元素数组
     * @param tree 
     * @param path 
     * @param idKey 数组 数组中元素进行相等性比较时，用哪个字段，默认id，若元素的id相同，就认为两个元素相同
     * @param childrenFieldName 存储父节点id信息的字符串，默认 children
     * @param storageType 缓存类型
     */
    getElementsByPathIdsInTree: (
        tree?: any[],
        path?: (string | number)[],
        idKey: string = UseCacheConfig.defaultIdentiyKey,
        childrenFieldName: string = "children",
        storageType: number = UseCacheConfig.defaultStorageType,
        debug: boolean = true) => {
        if (storageType === StorageType.NONE)
            return undefined
        if (!tree || tree.length === 0 || !path || path.length === 0) {
            if (debug) console.log("no data tree array, or no path")
            return undefined
        }

        //if(debug) console.log("tree array: ", tree)
        const ret: any[] = []
        let array = tree
        for (let i = 0; i < path.length; i++) {
            if (array && array.length > 0) {
                if (debug) console.log("find " + path[i])
                const e = Cache.findOneInArray(array, path[i], idKey)
                if (e) {
                    ret.push(e)
                    array = e[childrenFieldName]
                    //if (debug) console.log("got one, e:", e)
                }
            }
        }
        if (debug && ret.length === 0) {
            console.log("not found elem path in tree: ", tree)
        }
        return ret
    },




    /**
     * 从数组array中，根据children字段查找某节点e
     * @param shortKey 存储数组都的cache key, 由其得到待查询的数组
     * @param id 待查找的元素id
     * @param all 是否获取所有，否则只是第一个路径
     * @param childrenFieldName 存储父节点id信息的字符串，默认 children
     * @param idKey 数组 数组中元素进行相等性比较时，用哪个字段，默认id，若元素的id相同，就认为两个元素相同
     * @param storageType 缓存类型
     * @returns 如果all为true（默认），返回所有path路径数组，否则返回path。 path是从根节点到所寻找叶子节点的数组
     */
    getPathFromTreeCacheKey: (
        shortKey: string,
        id: string | number | undefined,
        all: boolean = true, childrenFieldName: string = "children",
        idKey: string = UseCacheConfig.defaultIdentiyKey,
        storageType: number = UseCacheConfig.defaultStorageType): any[][] | any[] | undefined => {

        if (id === undefined) {
            if (UseCacheConfig.EnableLog) console.log("Cache.findOne: no id")
            return undefined
        }
        if (storageType === StorageType.NONE)
            return undefined

        const str = CacheStorage.getItem(shortKey, storageType)
        if (str) {
            let array: any[] = JSON.parse(str)
            if (all) {
                const allPaths: any[][] = []
                TreeCache.getAllPathFromTreeArray(allPaths, array, id, childrenFieldName, idKey)
                return allPaths
            } else {
                return TreeCache.getOnePathFromTreeArray(array, id, childrenFieldName, idKey)?.reverse()
            }
        }
        return undefined
    },




    /**
     * 从数组rootArray中，找到一条命中路径
     * @param rootArray 数组
     * @param id 待查找的元素id
     * @param childrenFieldName 存储父节点id信息的字符串，默认 children
     * @param idKey 数组 数组中元素进行相等性比较时，用哪个字段，默认id，若元素的id相同，就认为两个元素相同
     * @returns 返回数组：叶节点排最前，根节点最后
     */
    getOnePathFromTreeArray: (
        rootArray: any[],
        id?: string | number | undefined,
        childrenFieldName: string = "children",
        idKey: string = UseCacheConfig.defaultIdentiyKey,
        debug: boolean = false): any[] | undefined => {

        if (!rootArray || !id) return undefined

        let e
        for (let i = 0; i < rootArray.length; i++) {
            const path: any[] = []
            e = rootArray[i]
            if (debug) console.log("check id=" + e[idKey])
            if (e[idKey] === id) {
                path.push(e)
                if (debug) console.log("got one: id=" + e[idKey] + ", return path=", path)
                return path //找到一个元素即返回一个数组
            } else {
                if (debug) console.log("check children, id=" + e[idKey])
                const children = e[childrenFieldName]
                if (children) {
                    //递归，从数组（孩子）中找到一个即返回一个数组，然后压入父节点，返回压入父节点的数组
                    const p2: any[] | undefined = TreeCache.getOnePathFromTreeArray(children, id, childrenFieldName, idKey)
                    if (p2) {
                        p2.push(e)
                        if (debug) console.log("got one in child: id=" + e[idKey] + ", return path=", p2)
                        return p2
                    }
                }
            }
        }
        return undefined
    },


    /**
     * 
     * @param allPaths 最后结果保存在该数组中，返回多条路径，每条路径是从根元素到所寻找叶子节点元素的数组
     * @param rootArray 数组
     * @param id 待查找的元素id
     * @param childrenFieldName 存储父节点id信息的字符串，默认 children
     * @param idKey 数组 数组中元素进行相等性比较时，用哪个字段，默认id，若元素的id相同，就认为两个元素相同
     * @param tempPath 临时变量，内部实现使用，不要传递
     * @returns 
     */
    getAllPathFromTreeArray: (
        allPaths: any[][],
        rootArray: any[],
        id?: string | number | undefined,
        childrenFieldName: string = "children",
        idKey: string = UseCacheConfig.defaultIdentiyKey, tempPath: any[] = []) => {
        if (!rootArray || !id) return

        for (let i = 0; i < rootArray.length; i++) {
            const e = rootArray[i]

            tempPath.push(e) //压入当前节点到tempPath

            if (e[idKey] === id) { //找到一个， 压入path，不再对其children进行查找          
                allPaths.push([...tempPath]) //找到后也没有return返回，而是继续该循环查找其它兄弟节点
            } else {//没有相等，则是查找子节点
                const children = e[childrenFieldName]
                if (children) {
                    //递归，在孩子数组中相同的查找，并将path传递进来，一遍记录path节点
                    TreeCache.getAllPathFromTreeArray(allPaths, children, id, childrenFieldName, idKey, tempPath)
                }
            }

            tempPath.pop()
        }
    },





    /**
     * 将数据插入到树上的一个节点中后，然后更新其缓存
     * @param shortKey 缓存键
     * @param e 待插入的数据
     * @param parentIdPath 插入的父路径节点id数组，若为空插入到根节点
     * @param idKey 父路径数组元素中取值的key，通常为id
     * @param childrenFieldName tree节点的children字段名称，默认children
     * @param beforeAddIfNotRoot 在插入子项前，可以对数据e做一些操作，比如更新其parentPath
     * @param storageType 
     * @param debug 
     * @returns 
     */
    onAddOneInTree: (
        shortKey: string,
        e: any,
        parentIdPath?: any[],
        idKey: string = UseCacheConfig.defaultIdentiyKey,
        childrenFieldName: string = "children",
        beforeAddIfNotRoot?: (parentPath: any[], parent: any) => void, // e.parentPath = [...parent.parentPath, e[idKey]]
        storageType: number = UseCacheConfig.defaultStorageType,
        debug: boolean = true) => {
        if (storageType === StorageType.NONE) {
            return false
        }

        if (!parentIdPath || parentIdPath.length === 0) {//root node
            Cache.onAddOne(shortKey, e, storageType)
        } else {
            const parentElemPath = TreeCache.getElementsByPathIdsInTreeFromCache(shortKey, parentIdPath, idKey, childrenFieldName, storageType, debug)
            if (!parentElemPath || parentElemPath.length === 0) {
                console.warn("no parentElemPath for parentIdPath, shortKey=" + shortKey + ", idKey=" + idKey + ", parentPath=" + JSON.stringify(parentIdPath))
                return false
            }
            if (parentElemPath?.length != parentIdPath.length) {
                console.warn("not get enough parentElemPath for parentIdPath, shortKey=" + shortKey + ", idKey=" + idKey + ", parentPath=" + JSON.stringify(parentIdPath))
                return false
            }

            const parent = parentElemPath[parentElemPath.length - 1]

            if (beforeAddIfNotRoot) beforeAddIfNotRoot(parentElemPath, parent)

            if (!parent[childrenFieldName]) {
                parent[childrenFieldName] = [e]
            } else {
                parent[childrenFieldName].push(e)
            }
            Cache.onEditOne(shortKey, parentElemPath[0], idKey, storageType)
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
    onEditOneInTree: (
        shortKey: string,
        e: any,
        idPath: any[],
        idKey: string = UseCacheConfig.defaultIdentiyKey,
        childrenFieldName: string = "children",
        storageType: number = UseCacheConfig.defaultStorageType,
        debug: boolean = true) => {
        if (storageType === StorageType.NONE) {
            return false
        }
        if (idPath.length === 0) {
            console.warn("idPath is empty")
            return false
        }

        const elemPath = TreeCache.getElementsByPathIdsInTreeFromCache(shortKey, idPath, idKey, childrenFieldName, storageType, debug)
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
     * @param idKey 删除比较时所采用的键，通常为id
     * @param childrenFieldName 树形结构中孩子名称，默认为children
     * @param storageType 
     * @param debug log开关
     * @returns 
     */
    onDelOneInTree: (
        shortKey: string,
        e: any,
        idPath: any[],
        idKey: string = UseCacheConfig.defaultIdentiyKey,
        childrenFieldName: string = "children",
        storageType: number = UseCacheConfig.defaultStorageType,
        debug: boolean = true
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

        const elemPath = TreeCache.getElementsByPathIdsInTreeFromCache(shortKey, idPath, idKey, childrenFieldName, storageType, debug)
        if (!elemPath || elemPath.length === 0) {
            console.warn("no elemPath for idPath, shortKey=" + shortKey + ", idKey=" + idKey + ", idPath=" + JSON.stringify(idPath))
            return false
        }
        if (elemPath?.length != idPath.length) {
            console.warn("not get enough elemPath for idPath, shortKey=" + shortKey + ", idKey=" + idKey + ", idPath=" + JSON.stringify(idPath))
            return false
        }

        const parent = elemPath[elemPath.length - 2]
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