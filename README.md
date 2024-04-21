# usecache

usecache is front-end request cache react hooks.
 
 Requests from front end load data from local cache(sessionStorage or localStorage) firstly.
 If not hit, then load data from remote server and cache them for next time.



## Get Started

Add dependency:
```
npm i @rwsbillyang/usecache
```

### useCache hook


```typescript
/**
 * 
 * @param url load data from url
 * @param shortKey load and cache data if provide
 * @param withouAuth request withou auth headers
 * @param showLoading //wheter show loading when load data from remote if configed in ConfigRequest
 * @param storageType // storage type, default: UseCacheConfig.defaultStorageType
 * @param transformDataBoxFromResponseJson transform response into DataBox
 * @returns { loading, entity, errMsg }
 */
export function useCache<T>(url: string, shortKey?: string,
    withouAuth: boolean = false,
    showLoading: boolean = false,
    storageType: number = UseCacheConfig.defaultStorageType,
    transformDataBoxFromResponseJson?: (json: any) => DataBox<T>) 
```

Eg:
```typescript
const {loading, entity, errMsg } = useCache<BizXXX>("/api/xxx", "bizXXX")
```
loading: loading state
errMsg:  error msg
entity: biz data 


### useCacheList hook

 useCacheList hook loads list data from cache or remote with pagination

```typescript
/**
 * fetch from remote: pull-refresh, click loadMore button（need merge into old data）
 * after load from remote, the useCache is set true, so next time load from cache
 * 
 * load from local(include but not limit): enter firstly, re-enter, tabs switch，first try to load from cache, if not found then load from remote.
 * 
 * @param url request url
 * @param shortKey if undefined, not use cache
 * @param initalQuery initial query parameters that extends PaginationQueryBase
 * @param needLoadMore enable load more button, true when enable pagination. If load all data, not need loadMore, set it false. default is true
 * @param storageType cache storage type, default: sessionStorage
 * @param transformDataBoxFromResponseJson transform response into DataBox
 * @return isLoading, isError, errMsg, list, loadMoreState, setQuery
 */
export function useCacheList<T, Q extends BasePageQuery>(
    url: string,
    shortKey?: string,
    initalQuery?: Q,
    needLoadMore: boolean = true, //是否需要加载更多按钮，分页数据为true，全部数据为false
    storageType: number = UseCacheConfig.defaultStorageType,
     transformDataBoxFromResponseJson?: (json: any) => DataBox<T[]>
) 
```
useCacheList returns `{ isLoading, isError, errMsg, loadMoreState, list, refreshCount, setList, setQuery, setRefresh, setUseCache, setIsLoadMore }`

- isLoading:   loading state
- isError/errMsg: has error or not and error msg when load data
- loadMoreState/setIsLoadMore: loadMoreState is true means has more data, should enable LoadMore button,  and load more data that will be merged into list. If call setIsLoadMore(false),  it does not merge.
- list: the data loaded
- refreshCount/setRefresh: used for refreshing data from remote. When setRefresh(refreshCount+1) will result in loading data from remote.
- setQuery: if need modify query parameters and reload from remote, eg search.
- setUseCache:  setUseCache(false) means load data only from remote.


Example:
```typescript
  const { isLoading, isError, errMsg, loadMoreState, setQuery, refreshCount, setRefresh, list, setList, setUseCache, setIsLoadMore }
    = useCacheList<T, Q>(props.listApi, props.cacheKey, props.initialQuery, props.needLoadMore === false ? false : true)
```

We can:
- show loading state, erro info and LoadMore button by using `isLoading, isError, errMsg, loadMoreState`.
- show list data by using `list`,  and modifiy list by using `setList`
- search by using `setQuery`
- refresh by using `setRefresh(refreshCount+1)`



### Non-hook edition

If not use react hook, we can use non-react-hook edition

#### cachedGet/cachedPost

Example using cachedGet:
```typescript
function correctExpressionRecord() {
    cachedGet<any[]>("/api/rule/composer/list/expression", (data) => {
        // your handle code
    }, { pagination: { pageSize: -1, sKey: "id", sort: 1 } }) //request all data order by id ASC
```

cachedGet/cachedPost defined in usecache:
```typescript
export function cachedGet<T>(url: string, onOK: (data: T) => void, data?: object, shortKey?: string, isShowLoading: boolean = true, attachAuthHeader: boolean = true)

export function cachedPost<T>(url: string, onOK: (data: T) => void, data?: object, shortKey?: string, isShowLoading: boolean = true, attachAuthHeader: boolean = true) 
```

#### cachedFetch
cachedGet/cachedPost call cachedFetch:
```typescript
export function cachedFetch<DATATYPE>(params: FetchParams<DATATYPE>) 


/**
 * load data from remote server or local cache depends on shortKey
 * 
 * @param url url
 * @param data if GET/DELETE, will be query parameters, if POST/PUT will be body data 
 * @param method
 * @param attachAuthHeader default true
 * @param onOK  called when biz data is ok
 * @param onNoData called if no biz data
 * @param onKO called if biz data is NOT ok
 * @param onErr called something wrong including request err, response status not 2xx
 * @param onDone called if request remote server finishe, called before onOK/onNoData/onKO/onErr
 * @param shortKey use cache firstly if provide shortKey, if undefined load from remote server
 * @param storageType default is UseCacheConfig.defaultStorageType
 * @param isShowLoading default true, if false, not show loading ui even if has showLoading function
 * @param showLoading show loading if provides
 * @param hideLoading hide loading if provides
 * @param transformDataBoxFromResponseJson  tranformer from response json from remote to DataBox<T>
 */
export interface FetchParams<T> {
    url: string,
    data?: object,
    method: "GET" | "POST" | "PUT" | "DELETE",
    attachAuthHeader?: boolean, //= true
    shortKey?: string,
    storageType?: number, // = UseCacheConfig.defaultStorageType,
    onOK: (data: T) => void,
    onNoData?: () => void,
    onKO?: (code: string, msg?: string) => void,
    onErr?: (msg: string) => void,
    onDone?: () => void,
    isShowLoading?: boolean,
    showLoading?: () => void,
    hideLoading?: () => void,
    transformDataBoxFromResponseJson?: (json: any) => DataBox<T>
}
```


Example of cachedFetch:
```typescript
 cachedFetch<any[]>({
                    method: "POST",
                    url: `${Host}/api/rule/composer/getByIds/constant`,
                    data: {data: constantQueryParams.ids},
                    shortKey: constantAsyncSelectProps.key,
                    onDone: () => { setConstantLoading(false) },
                    onOK: (data) => {
                        //...
                    }
                })
```


#### cachedFetchPromise

If need Promise somewhere, please use 
```typescript
/**
 * return Promise

 * @param url  remote reuqest url 
 * @param method "GET" | "POST" | "PUT" | "DELETE"
 * @param data search query parameters
 * @param shortKey short cache key
 * @param storageType UseCacheConfig.defaultStorageType
 * @param transformDataBoxFromResponseJson tranformer from response json from remote to DataBox<T>
 * @param transfomFromBizData tranformer from payload biz data to T if provided
 * @param attachAuthHeader add auth header into request headers
 * @param isShowLoading show loading when request if provide showLoading function
 * @param showLoading show loading function
 * @param hideLoading  hide loading function
 */
export const cachedFetchPromise = async <T>(
    url: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    data?: object,
    shortKey?: string,
    storageType: number = UseCacheConfig.defaultStorageType,
    transformDataBoxFromResponseJson?: (json: any) => DataBox<T>,
    transfomFromBizData?: (bizData: any) => T,
    attachAuthHeader?: boolean, //= true
    isShowLoading: boolean = false, //default is false
    showLoading?: () => void,
    hideLoading?: () => void,
)
```

Example code:
```typescript
function saveOne(data: any, url: string) {
    cachedFetchPromise<any>(url, 'POST', data)//undefined, StorageType.OnlySessionStorage, undefined,undefined,false
        .then((data) => {
            if (data) {
                console.log("save done")
            } else { console.log("no data return after save") }
            return new Promise((resolve) => { resolve(true) });
        }).catch((err) => {
            console.warn("exception: " + err.message)
        })
}
```

## Detail Usage
### QueryParams/Pagination

Add query fields should be in XXXQueryParams which extends BasePageQuery
```typescript
export interface XXXQueryParams extends BasePageQuery {
    label?: string
    typeId?: number
    mapKey?: string
    domainId?: number
    categoryId?: number
}
```
usecache will automatically convert pagination in BasePageQuery into string using encodeURIComponent.


Here BasePageQuery and QueryPagination defined in usecache library as following
```typescript
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
 * @field pageSize, default 10, if -1 means all data
 * @field current, Starting from 1, if greater than 0 is specified, Page Number paging is preferred over lastId. 
 * @field sKey sortKey
 * @field sKeyType:  TypeNumber  TypeString TypeObjectId, remote server use it to convert
 * @field sort 1: ASC，-1: DESC
 * @field lastId, valid if current is undefined，the lastId should be in the list which returns from useCacheList
 * @field fKey filter key, reserved
 * @field filters, reserved
 */
 export interface QueryPagination{
    pageSize?: number, //-1 means all data, not pagination
    current?: number,// if > 0, means use pageIndex and PageSize, not use lastId
    sKey?: string, //sortKey
    sKeyType?: "TypeObjectId" | "TypeString" | "TypeNumber",
    sort?: number,//1: ASC，-1: DESC
    lastId?: string,
    fKey?: string, //filter key
    filters?: string[]
}

export const encodeUmi = (umi: QueryPagination) => encodeURIComponent(JSON.stringify(umi))
```

An example which pageSize is 20:
```typescript
const initialQuery:XXXQueryParams = { domainId: searchParams["domainId"], typeId: searchParams["typeId"], pagination: { pageSize: 20 } }
```


### DataBox/transformDataBoxFromResponseJson


The footprint of every response from remote should be unified, so front end handle it with one way.

DataBox is defined in usecache and back-end library [ktorkit](https://github.com/rwsbillyang/ktorKit)

The main fields are code: 'OK' means everything is ok, 'KO' means something wrong in back end.  
If OK, data is the real payload. else msg is error message.


If your backend return different data structure, should be transformed by providing  transformDataBoxFromResponseJson when call useCache or useCacheList:

pseudo-code:
```typescript
const MyTransformDataBoxFromResponseJson  = (json: any) => DataBox<T>{
    //if OK 
    return DataBox("OK", data)
    // if ko
    return DataBox("KO", msg)
}
```

DataBox definition in usecache
```typescript
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
```

### Config UseCache
In react App init page, config UseCache

Where init Exampe 1:
```typescript
// index.ts
initConfig()

const e = document.getElementById('app')
if (e) {
  createRoot(e).render(React.createElement(App))
}else{
  console.error("not found id: document.getElementById('app')")
}


const initConfig = () => {
    console.log("initConfig...")
    UseCacheConfig.EnableLog = true
    //...
 }
```

Where init Exampe 2:
```typescript
//main.tsx
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)

//App.tsx
function App() {
  UseCacheConfig.EnableLog = true
  return useRoutes(AppRoutes);
}
export default App;

```

Init eg:
```typescript
 //UseCacheConfig.EnableLog = true

 UseCacheConfig.cacheSpace = () => "/myapp"

 UseCacheConfig.showLoading = (text) => { console.log("TODO: show loading with text: "+ text) }
 UseCacheConfig.hideLoading = () => { console.log("TODO: hide loading...") }
 UseCacheConfig.showToast = (text) => { console.log("TODO: showToast with text: "+ text)  }
```


The default config in usecahce:
```typescript
export const UseCacheConfig: IUseCacheConfig = {
    EnableLog: false,

    cacheSpace: () => "",

    /**
     * identiyKey used in Cache, uesd to find one in cached list by key when onEditOne/onDelOne etc. 
     */
    defaultIdentiyKey: "_id",

    defaultStorageType: StorageType.OnlySessionStorage,

    PageSize: 10, //后端默认为10，若需修改，需在前端提交umi数据，并设置此处的PageSize

    request: fetchRequest,
    authheaders:  () => undefined
}
```



If using [wxlogin](https://github.com/rwsbillyang/wxlogin) library：
```typescript
 //UseCacheConfig.EnableLog = true
 WxLoginConfig.AppKeyPrefix = "/kf";
 UseCacheConfig.cacheSpace = WebAppLoginHelper.getCacheSpace
 
 UseCacheConfig.showLoading = (text) => { console.log("TODO: show loading with text: "+ text) }
 UseCacheConfig.hideLoading = () => { console.log("TODO: hide loading...") }
 UseCacheConfig.showToast = (text) => { console.log("TODO: showToast with text: "+ text)  }
 UseCacheConfig.authheaders = () => WxAuthHelper.getHeaders()
```





IUseCacheConfig definition:
```typescript
interface IUseCacheConfig {
    EnableLog: boolean
    cacheSpace: () => string
    defaultIdentiyKey: string
    defaultStorageType: number
    PageSize: number
    request: IRequest,
    authheaders: () => {} | undefined
    /**
  * show loading when load data, eg: () => f7.preloader.show()
  */
    showLoading?: (text?: string) => void

    /**
     * hide loading, eg, () => f7.preloader.hide()
     */
    hideLoading?: () => void

    /**
     * show toast, eg, (msg) => f7.toast.show({ text: msg || "操作成功" }),
     */
    showToast?: (msg?: string) => void
}
```

### Customize Request

```typescript
export interface IRequest {
    get: (url: string, data?: object) => Promise<Response> 
    post: (url: string, data?: object) => Promise<Response>
    upload: (url: string, data: ArrayBuffer|Blob) => Promise<Response>
    getWithoutAuth: (url: string, data?: object, crossDomain?: boolean) => Promise<Response>
    postWithoutAuth: (url: string, data?: object, crossDomain?: boolean) => Promise<Response>
}
```

We can use customized request by using 
```typescript
UseCacheConfig.request = YourCustomizedRequest
```


The default request is based on fetch:
```typescript
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
```




### Utils

#### Cache

Cache provids many helper functions to update cache:

- findOne
- findMany
- onAddOne: add new one into list
- onAddOneInList
- onEditOne: call it when update one successully
- onEditOneInList
- onEditMany
- onEditManyInList
- onDelOneById: call it when delete one successfully
- onDelOneByIdInList
- onDelOne: call it when delete one successfully
- onDelOneInList
- onDelManyByIds
- onDelManyByIdsInList
- onDelMany: call it when batch delete manys successfully
- onDelManyInList
- evictCache: evict the given key cache with storageType
- evictAllCaches: evict all cache with storageType

#### TreeCache

support tree data, provids helper functions:

- getElementsByPathIdsInTreeFromCache
- getPathFromTree
- onAddOneInTreeCache
- onAddOneInTree
- onEditOneInTreeCache
- onEditOneInTree
- onDelOneInTreeCache
- onDelOneInTree

#### CacheStorage

provides help functions:

- getItem/saveItem
- getObject/saveObject
- remove

support StorageType
```typescript
/**
 * cache type
 */
 export const StorageType = {
    OnlySessionStorage: 1,
    OnlyLocalStorage: 2,
    BothStorage: 3,
    NONE: 0
}
```

#### DateTimeUtil

covinient util: format date/time 
```typescript
DateTimeUtil.dateFormat(new Date(), "MM-dd hh:mm")
DateTimeUtil.formatYearDateTime(e.createdAt)
DateTimeUtil.formatDateTime
DateTimeUtil.formatDate
DateTimeUtil.formatDuration
```

#### ArrayUtil

 Support array list, including contains, findOne, findMany, removeOne, removeMany

Support tree data, including:
- getArrayByPathInTree,find one by id path array in tree
- findOneFromTree: find one by id  in tree
- findAllFromTree: find many by id in tree
- trimTreeByPath: trim tree, the given path specified left data
- transformTree: transform tree data by lamada function in tree
- traverseTree: traverse similar forEach in array in tree



#### Misc utils
```typescript
/**
 * @return protocol + "//"+ host, eg: https://www.example.com
 */
export const currentHref = () => window.location.protocol + "//" + window.location.host 



/**
 * convert obj into string: key1=value1&key2=value2 ，which keys is sorted;
 * if no fields in obj，returns undefined
 * @param obj
 * @param enableEmptyLog if true, log no-value fields
 */
export const serializeObject = (obj?: object, enableEmptyLog: boolean = false) => string|undefined


/**
 * 
 * remove invalid parameters, then sort, and convert Pagination into umi string,
 * finally returns string likes: ?key1=xx&key2=yy&key3=zz 
 * if no query, returns ""
 * */
export function query2Params<Q extends BasePageQuery>(query?: Q) => string


/**
 * @param data 
 * @param ignoreDeepKeys ignore deep copy keys
 * @param hash 
 * @returns 
 */
export function deepCopy(data: object, ignoreDeepKeys?: string[], hash = new WeakMap()) => object
```




### About UI/Cache invalidate

Generally, usecache lib update cache automatically when add/edit/delete one or many in table list, and UI display the latest updated data.

But if you have special requirements, you should manually call onAddXX/OnEditXX/OnDelXXX in Cache or TreeCache after save or del one/many item(s) in table, and tell UI data updated and need refresh UI such as send event using use-bus. 