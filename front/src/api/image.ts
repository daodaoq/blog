// src/api/image.ts
import type { ApiResponse } from "../utils/request"; // 导入 ApiResponse
import type { Model, PageInfo, PageResult } from "./common";
import service from "../utils/request";

// 重新导出 ApiResponse
export type { ApiResponse };

export interface Image extends Model {
    name: string;
    url: string;
    category: string;
    storage: string;
}

export interface ImageUploadResponse {
    url: string;
    ossType: string;
}

export interface ImageDeleteRequest {
    ids: number[];
}

export const imageDelete = (data: ImageDeleteRequest): Promise<ApiResponse<undefined>> => {
    return service({
        url: '/image/delete',
        method: 'delete',
        data: data,
    });
};

export interface ImageListRequest extends PageInfo {
    name: string | null;
    category: string | null;
    storage: string | null;
}

export const imageList = (data: ImageListRequest): Promise<ApiResponse<PageResult<Image>>> => {
    return service({
        url: '/image/list',
        method: 'get',
        params: data,
    });
};