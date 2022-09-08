import { UmiListPagination } from "./UmiListPagination"

/**
 * base interface for pagination
 */
 export interface PaginationQueryBase {
    pagination?: UmiListPagination
    umi?: string  //encodeUmi(pagination)
}
