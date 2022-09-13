import { Cache } from "./Cache";
import { StorageType } from "./StorageType"
import { currentHost, UseCacheConfig } from "./UseCacheConfig"
import { CacheStorage } from "./CacheStorage";
import { IRequest } from "./IRequest";

import { CODE, DataBox, DataBoxBase, DataBoxTableList, getDataFromBox } from "./DataBox";
import { PaginationQueryBase } from "./PaginationQueryBase";
import { encodeUmi } from "./UmiListPagination";
import { UmiListPagination } from "./UmiListPagination"

import { fetchWithLoading, genericFetch, useCache } from "./useCache";
import { useCacheList } from "./useCacheList";


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
    currentHost, 
};

