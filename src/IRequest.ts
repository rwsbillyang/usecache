export interface IRequest {
    get: (url: string, data?: object | string | any[]) => Promise<any> 
    post: (url: string, data?: object | string | any[]) => Promise<any>
    upload: (url: string, data: ArrayBuffer) => Promise<any>
    getWithouAuth: (url: string, data?: object | string | any[], async?: boolean, crossDomain?: boolean) => Promise<any>
    postWithouAuth: (url: string, data?: object | string | any[], crossDomain?: boolean) => Promise<any>

        /**
     * show loading when load data, eg: () => f7.preloader.show()
     */
    showLoading: () => void

         /**
          * hide loading, eg: () => f7.preloader.hide()
          */
    hideLoading: () => void
     
         /**
          * show toast, eg: (msg) => f7.toast.show({ text: msg || "操作成功" }),
          */
    showToast: (msg?: string) => void
}

