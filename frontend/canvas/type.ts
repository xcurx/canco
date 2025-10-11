export interface BaseShapeData {
    id: string
    type: string
    x: number
    y: number
    width: number
    height: number
    color: string
    isSelected: boolean
    zIndex: number
}

export interface LineData extends BaseShapeData {
    type: 'line'
}

export interface RectangleData extends BaseShapeData {
    type: 'rectangle'
}

export interface CircleData extends BaseShapeData {
    type: 'circle'
}

export type ShapeData = RectangleData | CircleData | LineData

export interface Operation {
    id: string
    type: 'CREATE_SHAPE' | 'UPDATE_SHAPE' | 'DELETE_SHAPE' | 'SELECT_SHAPE' | 'DESELECT_ALL'
    timestamp: number
    data: any
}

export interface CreateShapeOperation extends Operation {
    type: 'CREATE_SHAPE'
    data: {
        shape: ShapeData
    }
}


export interface UpdateShapeOperation extends Operation {
    type: 'UPDATE_SHAPE'
    data: {
        id: string
        changes: Partial<ShapeData>
    }
}

export interface DeleteShapeOperation extends Operation {
    type: 'DELETE_SHAPE'
    data: {
        id: string
    }
}

export interface SelectShapeOperation extends Operation {
    type: 'SELECT_SHAPE'
    data: {
        id: string
    }
}

export interface DeselectAllOperation extends Operation {
    type: 'DESELECT_ALL'
    data: {}
}

export type CanvasCoords = {x: number, y: number}

export enum CanvasState {
    IDLE = "idle",
    CREATING_SHAPE = "creating_shape", 
    MOVING_OBJECT = "moving_object",
    RESIZING_OBJECT = "resizing_object"
}

export const SELECTION_PADDING = 5
export const HANDLE_SIZE = 4