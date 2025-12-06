export interface PaginationInfo {
    currentPage: number
    totalPages: number
    total: number
    limit: number
    hasNextPage?: boolean
    hasPrevPage?: boolean
}