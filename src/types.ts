interface FieldBase {
  required?: boolean
  default?: unknown
  description?: string
}

export interface StringField extends FieldBase {
  type: 'string'
  default?: string
}
export interface NumberField extends FieldBase {
  type: 'number'
  default?: number
}
export interface BooleanField extends FieldBase {
  type: 'boolean'
  default?: boolean
}
export interface DateField extends FieldBase {
  type: 'date'
  default?: Date
}
export interface FileField extends FieldBase {
  type: 'file'
  default?: string
}

export interface NestedField extends FieldBase {
  type: 'nested'
  of: Fields
  default?: Record<string, unknown>
}

interface ListFieldBase extends FieldBase {
  type: 'list'
  default?: unknown[]
}
export interface StringListField extends ListFieldBase {
  of: 'string'
  default?: string[]
}
export interface NumberListField extends ListFieldBase {
  of: 'number'
  default?: number[]
}
export interface BooleanListField extends ListFieldBase {
  of: 'boolean'
  default?: boolean[]
}
export interface DateListField extends ListFieldBase {
  of: 'date'
  default?: Date[]
}
export interface FileListField extends ListFieldBase {
  of: 'file'
  default?: string[]
}
export interface NestedListField extends ListFieldBase {
  of: Fields
  default?: Array<Record<string, unknown>>
}

export type ListField = StringListField | NumberListField | BooleanListField | DateListField | FileListField | NestedListField

export type Field = StringField | NumberField | BooleanField | DateField | FileField | NestedField | ListField

export interface Fields {
  [name: string]: Field
}

export interface Computed {
  (data: Record<string, unknown>): unknown | Promise<unknown>
}

export interface Computeds {
  [name: string]: Computed
}

export interface Schema {
  name: string
  pattern: string
  type: 'markdown' | 'yaml' | 'json'
  fields: Fields
  computeds?: Computeds
}

export interface Config {
  root: string
  output: { data: string; static: string; public: string }
  schemas: { [name: string]: Schema }
  callback?: (collections: { [name: string]: Record<string, unknown>[] }) => void | Promise<void>
  parsers?: { [type: string]: (file: string) => Promise<unknown> }
}
