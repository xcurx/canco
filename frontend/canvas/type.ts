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
    rotation: number
    opacity: number
}

export interface LineData extends BaseShapeData {
    type: 'line'
    strokeWidth: number
}

export interface RectangleData extends BaseShapeData {
    type: 'rectangle'
    fillColor?: string
    strokeWidth: number
}

export interface CircleData extends BaseShapeData {
    type: 'circle'
    fillColor?: string
    strokeWidth: number
}

export interface TextData extends BaseShapeData {
    type: 'text'
    text: string
    fontSize: number
}

export type ShapeData = RectangleData | CircleData | LineData | TextData

export interface Operation {
    id: string
    type: 'CREATE_SHAPE' | 'UPDATE_SHAPE' | 'DELETE_SHAPE' | 'SELECT_SHAPE' | 'MULTISELECT_SHAPES' | 'DESELECT_ALL' | 'UPDATE_SHAPES' | 'CREATE_SHAPES' | 'DELETE_SHAPES'
    timestamp: number
    data: any
    inverse?: Operation
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

export interface MultiSelectOperation extends Operation {
    type: 'MULTISELECT_SHAPES'
    data: {
        id: string
    }
}

export interface DeselectAllOperation extends Operation {
    type: 'DESELECT_ALL'
    data: {}
}

export interface UpdateShapesOperation extends Operation {
    type: 'UPDATE_SHAPES'
    data: {
        updates: Array<{
            id: string,
            changes: Partial<ShapeData>
        }>    
    }
}
export interface CreateShapesOperation extends Operation {
    type: 'CREATE_SHAPES'
    data: {
        shapes: ShapeData[]
    }
}
export interface DeleteShapesOperation extends Operation {
    type: 'DELETE_SHAPES'
    data: {
        ids: string[]
    }
}

export type CanvasCoords = {x: number, y: number}

export enum CanvasState {
    IDLE = "idle",
    CREATING_SHAPE = "creating_shape", 
    MOVING_OBJECT = "moving_object",
    RESIZING_OBJECT = "resizing_object",
    PANNING = "panning",
    ROTATING_OBJECT = "rotating_object",
    SELECTING_MULTIPLE = "selecting_multiple"
}

export const SELECTION_PADDING = 5
export const HANDLE_SIZE = 4