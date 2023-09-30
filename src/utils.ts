import { ArrayUtil } from "./ArrayUtil";
import { UseCacheConfig } from "./Config";
import { BasePageQuery, encodeUmi } from "./QueryPagination";

/**
 * @return protocol + "//"+ host, eg: https://www.example.com
 */
export const currentHref = () => window.location.protocol + "//" + window.location.host // window.location.protocol: https:



/**
 * 将对象obj转换成 key1=value1&key2=value2形式的字符串，会对key值进行排序;
 * 若obj内无key，将返回undefined
 * @param obj
 * @param enableEmptyLog 为true时，将日志输出obj中的空值字段
 */
export const serializeObject = (obj?: object, enableEmptyLog: boolean = false) => {
    if(!obj) return undefined
    
    const tempArray: string[] = [];
    for (const item in obj) {
        if (item) {
            const value = obj[item]
            if (value === null || value === undefined || value === "") {
                if (enableEmptyLog) console.log(`serializeObject: no value for ${item}, ignore`)
            } else {
                tempArray.push(`${item}=${value}`)
            }
        }
    }
    
    return tempArray.length > 0 ? tempArray.sort().join('&') : undefined
}
/**
 * 去除无效参数化后，排序，同时将Pagination转换为umi字符串，
 * 然后生成：?key1=xx&key2=yy&key3=zz 形式的字符串，无参数化返回空字符”“
 * */
export function query2Params<Q extends BasePageQuery>(query?: Q) {
    if (!query) return ''

    //将PaginationQueryBase的pagination编码为umi后，去除它 
    // sort和pagination 已经移入query.pagination，这里将老版本中的它们去除
    const newQuery = { ...query, umi: (query.pagination) ? encodeUmi(query.pagination) : undefined, pagination: undefined }

    //不可直接操作，否则修改了原值，因为是引用
    // if (query.pagination) query.umi = encodeUmi(query.pagination)
    // query.pagination = undefined

    if (UseCacheConfig.EnableLog)
        console.log("query2Params: newQuery=" + JSON.stringify(query))


    const str = serializeObject(newQuery)
    if (str) {
        return "?" + str
    } else return ''

}

/**
 * 基于 https://juejin.cn/post/6844904042322198541改进：
 * 增加忽略的键，该键的值不被deepCopy
 * @param data 
 * @param ignoreDeepKeys 忽略deepcopy的键数组，该键的值不被深拷贝
 * @param hash 
 * @returns 
 */
export function deepCopy(data: object, ignoreDeepKeys?: string[], hash = new WeakMap()) {
    if (typeof data !== 'object' || data === null) {
        throw new TypeError('传入参数不是对象')
    }
    // 判断传入的待拷贝对象的引用是否存在于hash中
    if (hash.has(data)) {
        return hash.get(data)
    }

    let newData = {};
    const dataKeys = Object.keys(data);
    dataKeys.forEach(key => {
        const currentDataValue = data[key];
        // 基本数据类型的值和函数直接赋值拷贝 或者是忽略的键
        if (typeof currentDataValue !== "object" || currentDataValue === null || ArrayUtil.contains(ignoreDeepKeys, key)) {
            newData[key] = currentDataValue;
        } else if (Array.isArray(currentDataValue)) {
            // 实现数组的深拷贝
            newData[key] = [...currentDataValue];
        } else if (currentDataValue instanceof Set) {
            // 实现set数据的深拷贝
            newData[key] = new Set([...currentDataValue]);
        } else if (currentDataValue instanceof Map) {
            // 实现map数据的深拷贝
            newData[key] = new Map([...currentDataValue]);
        } else {
            // 将这个待拷贝对象的引用存于hash中
            hash.set(data, data)
            // 普通对象则递归赋值
            newData[key] = deepCopy(currentDataValue, ignoreDeepKeys, hash);
        }
    });
    return newData;
}

