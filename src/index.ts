import { Cache } from "./Cache";
import { StorageType } from "./StorageType"
import { UseCacheConfig } from "./Config"
import { CacheStorage } from "./CacheStorage";

import { CODE, DataBox, DataBoxBase, DataBoxTableList, getDataFromBox } from "./DataBox";
import { encodeUmi, BasePageQuery, QueryPagination } from "./QueryPagination";
import {  useCache } from "./useCache";
import { useCacheList } from "./useCacheList";
import { contains, currentHref, dateFormat, formatDate, formatDateTime, formatDuration, formatYearDateTime, serializeObject } from "./utils";
import { cachedFetch, cachedGet, cachedPost, defaultFetchParams, FetchParams } from "./cachedFetch";


export type { DataBox, DataBoxBase, DataBoxTableList, BasePageQuery, QueryPagination, FetchParams};

//aim: app can import any one from "@rwsbillyang/usecache"
export {
    Cache,CacheStorage,
    encodeUmi, CODE, getDataFromBox,
    StorageType,UseCacheConfig,
    defaultFetchParams,cachedFetch, cachedGet, cachedPost,
    useCache,useCacheList,
    currentHref, serializeObject, contains,
    dateFormat, formatYearDateTime, formatDateTime,formatDate,formatDuration,
    //isExpire,expireInfo
};

