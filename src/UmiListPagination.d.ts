
/**
 * pagination parameters
 * support antd protable
 * 
 */
 export interface UmiListPagination{
    pageSize?: number;
    current?: number;
    sKey?: string; //sortKey
    sKeyType?: "TypeObjectId" | "TypeString" | "TypeNumber"; //排序的健不一定都是ObjectID类型，亦即lastId的后端类型，有可能是number或string类型，后端定义了三种类型：  TypeNumber  TypeString TypeObjectId
    sort?: number; //1用于升序，而-1用于降序
    lastId?: String,
    fKey?: string; //filter key
    filters?: string[]
}

export const encodeUmi = (umi: UmiListPagination) => encodeURIComponent(JSON.stringify(umi))
