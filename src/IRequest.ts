import { UseCacheConfig } from "./Config"
import { serializeObject } from "./utils"

/**
 * @deprecated
 */
interface IRequest {
    get: (url: string, data?: object) => Promise<Response> 
    post: (url: string, data?: object) => Promise<Response>
    upload: (url: string, data: ArrayBuffer|Blob) => Promise<Response>
    getWithoutAuth: (url: string, data?: object, crossDomain?: boolean) => Promise<Response>
    postWithoutAuth: (url: string, data?: object, crossDomain?: boolean) => Promise<Response>
}


export const fetchRequest: IRequest = {
    get: (url: string, data?: object) => fetch(url + (data ? ("?" + serializeObject(data)) : ''),
        {
            method: 'GET',
            headers: new Headers({
                ...UseCacheConfig.authheaders(),
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            })
        }),

    post: (url: string, data?: object) => fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: new Headers({
            ...UseCacheConfig.authheaders(),
            'Content-Type': 'application/json; charset=UTF-8'
        })
    }),


    upload: (url: string, data: ArrayBuffer | Blob) => fetch(url,
        {
            body: data, //blob?
            method: 'POST',
            headers: new Headers({
                ...UseCacheConfig.authheaders(),
                'Content-Type': 'application/octet-stream', //application/octet-stream multipart/form-data
            })
        }),


    getWithoutAuth: (url: string, data?: object, crossDomain: boolean = false) => fetch(url + (data ? ("?" + serializeObject(data)) : ''),
        {
            method: 'GET',
            headers: new Headers({
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                "Referrer-Policy": crossDomain ? "no-referrer" : "origin"
            })
        }),

    postWithoutAuth: (url: string, data?: object, crossDomain: boolean = false) => fetch(url,
        {
            body: JSON.stringify(data),
            method: 'POST',
            headers: new Headers({
                'Content-Type': 'application/json; charset=UTF-8',
                "Referrer-Policy": crossDomain ? "no-referrer" : "origin"
            })
        })
}