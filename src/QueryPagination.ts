/**
 * base interface for pagination
 * pagination 将被转化成umi字符串
 */
export interface BasePageQuery {
    pagination?: QueryPagination
    umi?: string  //encodeUmi(pagination)
}



/**
 * pagination parameters
 * @field pageSize default 10
 * @field current 从1起步，若指定了大于0的值，则优先使用页码分页，而不采用lastId. 对于某些排序值不唯一的场景，不适合用lastId进行分页，应指定current为1
 * @field sKey sortKey
 * @field sKeyType 排序的健不一定都是ObjectID类型，亦即lastId的后端类型，有可能是number或string类型，后端定义了三种类型：  TypeNumber  TypeString TypeObjectId
 * @field sort 1用于升序，而-1用于降序
 * @field lastId current为空时，将使用lastId，该值必须存在列表项中，否则导致取得最后一项的值为空
 * @field fKey filter key 暂未用上
 * @field filters 暂未用上
 */
 export interface QueryPagination{
    pageSize?: number;
    current?: number; 
    sKey?: string; //sortKey
    sKeyType?: "TypeObjectId" | "TypeString" | "TypeNumber";
    sort?: number; //1用于升序，而-1用于降序
    lastId?: string,
    fKey?: string; //filter key
    filters?: string[]
}

export const encodeUmi = (umi: QueryPagination) => encodeURIComponent(JSON.stringify(umi))
