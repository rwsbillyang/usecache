import { Cache } from "./Cache";
import { StorageType } from "./StorageType"
import { UseCacheConfig } from "./Config"
import { CacheStorage } from "./CacheStorage";

import { CODE, type DataBox, type DataBoxBase, type DataBoxTableList, getDataFromBox } from "./DataBox";
import { encodeUmi, type BasePageQuery, type QueryPagination } from "./QueryPagination";
import { useCache } from "./useCache";
import { useCacheList } from "./useCacheList";
import { currentHref,  deepCopy,  getValueByKey,  query2Params, serializeObject, setValueByKey } from "./utils";
import { cachedFetch, cachedFetchPromise, cachedGet, cachedPost, defaultFetchParams, type FecthErrResson, type FetchParams } from "./cachedFetch";
import { type BaseRecord, type MongoRecord, type SqlRecord } from "./Record";
import { TreeCache } from "./TreeCache";
import { ArrayUtil } from "./ArrayUtil";
import { DateTimeUtil } from "./DateTimeUtil";


export type { DataBox, DataBoxBase, DataBoxTableList, BasePageQuery, QueryPagination, FetchParams, FecthErrResson, BaseRecord, MongoRecord, SqlRecord};

//aim: app can import any one from "@rwsbillyang/usecache"
export {
    TreeCache, Cache,  CacheStorage,
    encodeUmi, CODE, getDataFromBox,
    StorageType,UseCacheConfig,
    defaultFetchParams,cachedFetch, cachedGet, cachedPost,cachedFetchPromise,
    useCache,useCacheList,query2Params,deepCopy,
    currentHref, serializeObject, getValueByKey, setValueByKey,
    ArrayUtil, DateTimeUtil,
    //isExpire,expireInfo
};


