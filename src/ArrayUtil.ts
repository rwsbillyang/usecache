import { UseCacheConfig } from "./Config"

/**
 * 数组工具，支持树形数组
 */
export const ArrayUtil = {
    /**
     * 数组array是否包含某个元素
     * @param array
     * @param e
     */
    contains: function <T>(array?: T[], e?: T, comparator?: ((e1: T, e2: T) => boolean)) {
        if (!array || array.length === 0 || !e) return false
        const c = comparator ? comparator : (e1: T, e2: T) => e1 === e2
        for (let i = 0; i < array.length; i++) {
            if (c(array[i], e)) return true
        }
        return false
    },
    /**
     * 从数组中找一项
     * @param array 
     * @param id 
     * @param idKey 
     * @returns 成功返回该项
     */
    findOne: function <T>(array?: T[], id?: string | number, idKey: string = UseCacheConfig.defaultIdentiyKey) {
        if (!array || array.length === 0 || id === undefined) {
            if (UseCacheConfig.EnableLog) console.log("ArrayUtil.findOne: no array or empty, no id")
            return undefined
        }

        const myKey = idKey ? idKey : UseCacheConfig.defaultIdentiyKey

        if (array && array.length > 0) {
            for (let i = 0; i < array.length; i++) {
                if (array[i][myKey] === id) {
                    if (UseCacheConfig.EnableLog) console.log("ArrayUtil.findOne: found one")
                    return array[i]
                }
            }
        }
        return undefined
    },
    /**
     * 从数组中找多项
     * @param array 
     * @param id 
     * @param idKey 
     * @returns 成功返回数组，要么有值，要么undefined，不返回空数组
     */
    findMany: function <T>(array?: T[], ids?: (string | number)[], idKey: string = UseCacheConfig.defaultIdentiyKey) {
        if (!array || array.length === 0 || !ids || ids.length === 0){
            if (UseCacheConfig.EnableLog) console.log("ArrayUtil.findMany: no array or empty, no ids")
            return undefined
        }

        const myKey = idKey ? idKey : UseCacheConfig.defaultIdentiyKey

        const ret: T[] = []
        if (array && array.length > 0) {
            for (let i = 0; i < array.length; i++) {
                for(let j = 0; j < ids.length; j++){
                    if (array[i][myKey] === ids[j]) {
                        ret.push(array[i]) 
                    } 
                } 
            }
        }
        return ret.length === 0 ? undefined : ret
    },

    /**
     * 从数组中移除一项
     * @param array 
     * @param id 
     * @param idKey 
     * @returns 成功返回true
     */
    removeOne: function <T>(array?: T[],id?: string | number,idKey: string = UseCacheConfig.defaultIdentiyKey) 
    {
        if (!array || array.length === 0 || id === undefined) return false
        for (let i = 0; i < array.length; i++) {
            if (array[i][idKey] === id) {
                array.splice(i, 1)
                return true;
            }
        }
        return false
    },

    /**
     * 从数组中移除多项
     * @param array 
     * @param id 
     * @param idKey 
     * @param storageType 
     * @returns 有一个被删除就返回true
     */
    removeMany: function <T>(array?: T[],ids?: (string | number)[],idKey: string = UseCacheConfig.defaultIdentiyKey) 
    {
        if (!array || array.length === 0 || !ids || ids.length === 0) return false
        var ret = false
        for (let i = 0; i < array.length; i++) {
            for(let j = 0; j < ids.length; j++){
                if (array[i][idKey] === ids[j]) {
                    array.splice(i, 1)
                    ret = true
                }
            }
        }
        return ret
    },




    /**
     * 通过id path，在树形数组中找到各元素，以数组返回
     * @param tree 
     * @param path 
     * @param idKey 数组 数组中元素进行相等性比较时，用哪个字段，默认id，若元素的id相同，就认为两个元素相同
     * @param childrenFieldName 存储父节点id信息的字符串，默认 children
     * @param debug 缓存类型
     */
    getArrayByPathInTree: function <T> (
        tree?: T[],
        path?: (string | number)[],
        idKey: string = UseCacheConfig.defaultIdentiyKey,
        childrenFieldName: string = "children",
        debug: boolean = UseCacheConfig.EnableLog): T[] | undefined 
    {
        if (!tree || tree.length === 0 || !path || path.length === 0) {
            if (debug) console.log("no data tree array, or no path")
            return undefined
        }

        //if(debug) console.log("tree array: ", tree)
        const ret: T[] = []
        let array = tree
        for (let i = 0; i < path.length; i++) {
            if (array && array.length > 0) {
                if (debug) console.log("find " + path[i])
                const e = ArrayUtil.findOne(array, path[i], idKey)
                if (e) {
                    ret.push(e)
                    array = e[childrenFieldName]
                    //if (debug) console.log("got one, e:", e)
                }
            }
        }
        if (debug && ret.length === 0) {
            console.log("not found elem path idKey="+ idKey+" in tree: ", tree)
        }
        return ret
    },


    /**
     * 通过id path，返回根节点，根节点及下面的children只保留搜索路径中的元素，其它的被去除，不影响原tree数据
     * 可用于剪除其它无关枝丫
     * @param tree 
     * @param path 
     * @param idKey 数组 数组中元素进行相等性比较时，用哪个字段，默认id，若元素的id相同，就认为两个元素相同
     * @param childrenFieldName 存储父节点id信息的字符串，默认 children
     * @param debug 缓存类型
     */
    trimTreeByPath: function <T> (
        tree?: T[],
        path?: (string | number)[],
        idKey: string = UseCacheConfig.defaultIdentiyKey,
        childrenFieldName: string = "children",
        debug: boolean = UseCacheConfig.EnableLog): T | undefined 
    {
        const array = ArrayUtil.getArrayByPathInTree(tree, path, idKey, childrenFieldName, debug)
        if (!array || array.length === 0) {
            if (debug) console.log("not found any one")
            return undefined
        }

        if(array.length === 1) return array[0]

        //避免影响原始数据tree
        const newArray: T[] = [] 
        //新数组中各元素已替换新的，但children仍指向旧的，其它元素若为obj也指向旧的
        for(let i = 0; i < array.length - 1; i++){  //最后一个不（浅）拷贝
            newArray.push({...array[i]})
        }
        newArray.push(array[array.length-1])
        
        for(let i = 0; i < array.length - 1; i++){  
            newArray[i][childrenFieldName] = [newArray[i+1]] //只保留路径中的，去除了其它兄弟
        }
     
        return newArray[0]
    },



    /**
     * 搜索id， 从树形数组tree中，找到第一条命中的数组
     * @param tree 树形数组数组
     * @param id 待查找的元素id
     * @param childrenFieldName 存储父节点id信息的字符串，默认 children
     * @param idKey 数组 数组中元素进行相等性比较时，用哪个字段，默认id，若元素的id相同，就认为两个元素相同
     * @returns 返回数组：叶节点排最前，根节点最后
     */
    findOneFromTree: function <T> (
        tree?: T[],
        id?: string | number | undefined,
        childrenFieldName: string = "children",
        idKey: string = UseCacheConfig.defaultIdentiyKey,
        debug: boolean = UseCacheConfig.EnableLog): T[] | undefined 
    {

        if (!tree || !id) return undefined

        let e: T
        for (let i = 0; i < tree.length; i++) {
            const path: T[] = []
            e = tree[i]
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
                    const p2: T[] | undefined = ArrayUtil.findOneFromTree(children, id, childrenFieldName, idKey)
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
     * 搜索id， 从树形数组rootArray中，找到所有命中路径数组, 结果存放在第一个参数resultPaths中
     * @param resultPaths 最后结果保存在该数组中，返回多条路径，每条路径是从根元素到所寻找叶子节点元素的数组
     * @param tree 数组
     * @param id 待查找的元素id
     * @param childrenFieldName 存储父节点id信息的字符串，默认 children
     * @param idKey 数组 数组中元素进行相等性比较时，用哪个字段，默认id，若元素的id相同，就认为两个元素相同
     * @param tempPath 临时变量，内部实现使用，不要传递
     * @returns 
     */
    findAllFromTree: function <T>(
        resultPaths: T[][],
        tree: T[],
        id?: string | number,
        childrenFieldName: string = "children",
        idKey: string = UseCacheConfig.defaultIdentiyKey, tempPath: T[] = [])
    {
        if (!tree || !id) return

        for (let i = 0; i < tree.length; i++) {
            const e = tree[i]

            tempPath.push(e) //压入当前节点到tempPath

            if (e[idKey] === id) { //找到一个， 压入path，不再对其children进行查找          
                resultPaths.push([...tempPath]) //找到后也没有return返回，而是继续该循环查找其它兄弟节点
            } else {//没有相等，则是查找子节点
                const children = e[childrenFieldName]
                if (children) {
                    //递归，在孩子数组中相同的查找，并将path传递进来，一遍记录path节点
                    ArrayUtil.findAllFromTree(resultPaths, children, id, childrenFieldName, idKey, tempPath)
                }
            }

            tempPath.pop()
        }
    },


}