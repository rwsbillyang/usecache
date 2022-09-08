
/**
 * code definition in payload from server
 */
export enum CODE {
    OK = "OK",
    KO = "KO",
    NewUser = 'NewUser',
    TokenExpired = "TokenExpired"
}

/**
 * response from remote server
 * @param code OK if correct, KO or others if wrong
 * @param msg error msg
 * @param type refer to import { ErrorShowType } from 'umi'; 
 * <code>
 * export enum ErrorShowType {
 *  SILENT = 0, // 不提示错误
 *  WARN_MESSAGE = 1, // 警告信息提示
 *  ERROR_MESSAGE = 2, // 错误信息提示
 *  NOTIFICATION = 4, // 通知提示
 *  REDIRECT = 9, // 页面跳转
 * }
 *  </code>
 * @param tId traceId from remote server, for debug
 * @param host host of remote server, for debug
 */
export interface DataBoxBase {
    code: string,
    msg?: string
    type: number,
    tId?: string,
    host?: string
}
/**
 * databox responsed from remote server
 * @param data payload data
 */
export interface DataBox<T> extends DataBoxBase {
    data?: T
}
/**
 * databox include total count responsed from remote server
 * @param data list data
 * @param total total count
 */
export interface DataBoxTableList<T> extends DataBoxBase {
    data?: T[],
    total: number
}


/**
 * extract data from databox
 * @param box DataBox
 */
export function getDataFromBox<T>(box: DataBox<T>): T | undefined {
    if (box) {
        if (box.code !== CODE.OK) {
            console.warn("getDataFromBox:" + JSON.stringify(box))
            //message.warning(box.msg)
            return undefined
        }
        return box.data
    }
    console.error("出错了，请求结果没有数据")
    return undefined
}