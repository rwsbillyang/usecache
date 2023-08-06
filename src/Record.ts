
/**
 * 列表项值 基类，必须有_id字段
 */
export interface BaseRecord extends Object {
    
}


/**
* with _id as primary key
*/
export interface MongoRecord extends BaseRecord{
   _id?: string
}

/**
* with id as primary key
*/
export interface SqlRecord extends BaseRecord{
   id?: number
}