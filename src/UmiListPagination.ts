
/**
 * pagination parameters
 * support antd protable
 * 
 */
 export interface UmiListPagination{
    pageSize?: number;
    //从1起步，若指定了大于0的值，则优先使用页码分页，而不采用lastId.
    // 对于某些排序值不唯一的场景，不适合用lastId进行分页，应指定current为1
    current?: number; 
    sKey?: string; //sortKey
    // //排序的健不一定都是ObjectID类型，亦即lastId的后端类型，
    //有可能是number或string类型，后端定义了三种类型：  TypeNumber  TypeString TypeObjectId
    sKeyType?: "TypeObjectId" | "TypeString" | "TypeNumber";
    sort?: number; //1用于升序，而-1用于降序
    lastId?: string,
    fKey?: string; //filter key
    filters?: string[]
}

export const encodeUmi = (umi: UmiListPagination) => encodeURIComponent(JSON.stringify(umi))
