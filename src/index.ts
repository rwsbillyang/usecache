import { Cache } from "./Cache";
import { StorageType } from "./StorageType"
import { UseCacheConfig } from "./Config"
import { CacheStorage } from "./CacheStorage";

import { CODE, DataBox, DataBoxBase, DataBoxTableList, getDataFromBox } from "./DataBox";
import { encodeUmi, BasePageQuery, QueryPagination } from "./QueryPagination";
import {  useCache } from "./useCache";
import { query2Params, useCacheList } from "./useCacheList";
import { contains, currentHref, dateFormat, formatDate, formatDateTime, formatDuration, formatYearDateTime, serializeObject } from "./utils";
import { cachedFetch, cachedFetchPromise, cachedGet, cachedPost, defaultFetchParams, FetchParams } from "./cachedFetch";
import { BaseRecord, MongoRecord, SqlRecord } from "./Record";


export type { DataBox, DataBoxBase, DataBoxTableList, BasePageQuery, QueryPagination, FetchParams, BaseRecord, MongoRecord, SqlRecord};

//aim: app can import any one from "@rwsbillyang/usecache"
export {
    Cache,CacheStorage,
    encodeUmi, CODE, getDataFromBox,
    StorageType,UseCacheConfig,
    defaultFetchParams,cachedFetch, cachedGet, cachedPost,cachedFetchPromise,
    useCache,useCacheList,query2Params,
    currentHref, serializeObject, contains,
    dateFormat, formatYearDateTime, formatDateTime,formatDate,formatDuration,
    //isExpire,expireInfo
};

