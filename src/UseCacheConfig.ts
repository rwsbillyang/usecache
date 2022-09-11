import { IRequest } from "./IRequest";
import { StorageType } from "./StorageType";

interface IUseCacheConfig{
    EnableDebug: true
    cacheKeyPrefix: string
    defaultIdentiyKey: string
    defaultStorageType: number
    PageSize: number
    request?: IRequest
}

export const UseCacheConfig: IUseCacheConfig = {
    EnableDebug: true,

    cacheKeyPrefix: "",
    
    /**
     * identiyKey used in Cache, uesd to find one in cached list by key when onEditOne/onDelOne etc. 
     */
    defaultIdentiyKey: "_id",

    defaultStorageType: StorageType.OnlySessionStorage,

    PageSize: 10 //后端默认为10，若需修改，需在前端提交umi数据，并设置此处的PageSize
}
/**
 * @return protocol + "//"+ host, eg: https://www.example.com
 */
export const currentHost = () => window.location.protocol + "//" + window.location.host // window.location.protocol: https:
