
import { StorageType } from "./StorageType";

interface IUseCacheConfig {
    EnableLog: boolean
    cacheSpace: () => string
    defaultIdentiyKey: string
    defaultStorageType: number
    PageSize: number
    authheaders: () => {} | undefined
    /**
  * show loading when load data, eg: () => f7.preloader.show()
  */
    showLoading?: (text?: string) => void

    /**
     * hide loading, eg: () => f7.preloader.hide()
     */
    hideLoading?: () => void

    /**
     * show toast, eg: (msg) => f7.toast.show({ text: msg || "操作成功" }),
     */
    showToast?: (msg?: string) => void
}

/**
 * Should provide authheaders
 */
export const UseCacheConfig: IUseCacheConfig = {
    EnableLog: false,

    cacheSpace: () => "",

    /**
     * identiyKey used in Cache, uesd to find one in cached list by key when onEditOne/onDelOne etc. 
     */
    defaultIdentiyKey: "_id",

    defaultStorageType: StorageType.OnlySessionStorage,

    PageSize: 10, //后端默认为10，若需修改，需在前端提交umi数据，并设置此处的PageSize

    //request: fetchRequest,
    authheaders:  () => undefined
}

