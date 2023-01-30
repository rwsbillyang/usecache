import { Cache } from "./Cache";
import { StorageType } from "./StorageType"
import { UseCacheConfig } from "./UseCacheConfig"
import { CacheStorage } from "./CacheStorage";
import { IRequest } from "./IRequest";

import { CODE, DataBox, DataBoxBase, DataBoxTableList, getDataFromBox } from "./DataBox";
import { PaginationQueryBase } from "./PaginationQueryBase";
import { encodeUmi } from "./UmiListPagination";
import { UmiListPagination } from "./UmiListPagination"

import { fetchWithLoading, genericFetch, useCache } from "./useCache";
import { useCacheList } from "./useCacheList";
import { contains, currentHost, dateFormat, formatDate, formatDateTime, formatDuration, formatYearDateTime, serializeObject } from "./utils";


export type { DataBox, DataBoxBase, DataBoxTableList, PaginationQueryBase, UmiListPagination, IRequest};

//aim: app can import any one from "@rwsbillyang/usecache"
export {
    Cache,
    CacheStorage,
    encodeUmi, CODE, getDataFromBox,
    StorageType,
    UseCacheConfig,
    fetchWithLoading, useCache, genericFetch,
    useCacheList,
    currentHost, serializeObject, contains,
    dateFormat, formatYearDateTime, formatDateTime,formatDate,formatDuration,
    //isExpire,expireInfo
};

