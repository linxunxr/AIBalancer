/**
 * Base Repository Implementation
 * 提供通用的CRUD操作
 */

/**
 * Generic Repository Interface
 */
export interface IRepository<T, ID> {
  findById(id: ID): Promise<T | null>;
  findAll(filter?: Partial<T>): Promise<T[]>;
  findPaginated(offset: number, limit: number, filter?: Partial<T>): Promise<{
    data: T[];
    total: number;
    hasMore: boolean;
  }>;
  create(entity: Omit<T, 'id'>): Promise<T>;
  update(id: ID, entity: Partial<T>): Promise<T>;
  delete(id: ID): Promise<boolean>;
  count(filter?: Partial<T>): Promise<number>;
  exists(id: ID): Promise<boolean>;
  createMany(entities: Omit<T, 'id'>[]): Promise<T[]>;
  updateMany(ids: ID[], entity: Partial<T>): Promise<T[]>;
  deleteMany(ids: ID[]): Promise<number>;
}

/**
 * Repository Error Class
 */
export class RepositoryError extends Error {
  public readonly code: string;
  public readonly originalError?: any;

  constructor(
    message: string,
    code: string = 'REPOSITORY_ERROR',
    originalError?: any
  ) {
    super(message);
    this.name = 'RepositoryError';
    this.code = code;
    this.originalError = originalError;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      originalError: this.originalError?.toString?.() || String(this.originalError),
    };
  }
}

/**
 * Query Result with Pagination
 */
export interface QueryResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}

/**
 * Abstract Base Repository Class
 */
export abstract class BaseRepository<T extends { id: string }, ID extends string | number = string>
  implements IRepository<T, ID>
{
  protected abstract tableName: string;
  protected abstract toEntity(row: Record<string, any>): T;
  protected abstract fromEntity(entity: T): Record<string, any>;
  protected abstract executeQuery(sql: string, params?: any[]): Promise<any[]>;
  protected abstract executeCommand(sql: string, params?: any[]): Promise<number>;

  protected getColumnNames(): string[] {
    const sampleEntity = this.fromEntity({ id: 'sample' } as T);
    return Object.keys(sampleEntity);
  }

  protected buildWhereClause(filter: Partial<T>): {
    clause: string;
    params: any[];
  } {
    if (!filter || Object.keys(filter).length === 0) {
      return { clause: '', params: [] };
    }

    const conditions: string[] = [];
    const params: any[] = [];

    for (const [key, value] of Object.entries(filter)) {
      if (value === undefined || value === null) {
        conditions.push(`${key} IS NULL`);
      } else if (Array.isArray(value)) {
        const placeholders = value.map(() => '?').join(',');
        conditions.push(`${key} IN (${placeholders})`);
        params.push(...value);
      } else {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
    }

    return {
      clause: conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  async findById(id: ID): Promise<T | null> {
    try {
      const result = await this.executeQuery(
        `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`,
        [id]
      );
      return result.length > 0 ? this.toEntity(result[0]) : null;
    } catch (error) {
      throw new RepositoryError(
        `Failed to find ${this.tableName} by id: ${id}`,
        'FIND_BY_ID_ERROR',
        error
      );
    }
  }

  async findAll(filter?: Partial<T>): Promise<T[]> {
    try {
      const { clause, params } = this.buildWhereClause(filter || {});
      const query = `SELECT * FROM ${this.tableName}${clause}`;

      const results = await this.executeQuery(query, params);
      return results.map((row) => this.toEntity(row));
    } catch (error) {
      throw new RepositoryError(
        `Failed to find all ${this.tableName}`,
        'FIND_ALL_ERROR',
        error
      );
    }
  }

  async findPaginated(
    offset: number,
    limit: number,
    filter?: Partial<T>
  ): Promise<QueryResult<T>> {
    try {
      const { clause, params } = this.buildWhereClause(filter || {});

      const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName}${clause}`;
      const countResult = await this.executeQuery(countQuery, params);
      const total = countResult[0].total as number;

      const dataQuery = `SELECT * FROM ${this.tableName}${clause} ORDER BY id LIMIT ? OFFSET ?`;
      const dataResult = await this.executeQuery(dataQuery, [
        ...params,
        limit,
        offset,
      ]);
      const data = dataResult.map((row) => this.toEntity(row));

      return {
        data,
        total,
        hasMore: offset + limit < total,
        offset,
        limit,
      };
    } catch (error) {
      throw new RepositoryError(
        `Failed to find paginated ${this.tableName}`,
        'FIND_PAGINATED_ERROR',
        error
      );
    }
  }

  async create(entity: Omit<T, 'id'>): Promise<T> {
    try {
      const entityWithId = {
        id: crypto.randomUUID(),
        ...entity,
      } as T;

      const data = this.fromEntity(entityWithId);
      const columns = Object.keys(data);
      const placeholders = Object.keys(data).map(() => '?').join(', ');

      const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
      await this.executeCommand(sql, Object.values(data));

      return entityWithId;
    } catch (error) {
      throw new RepositoryError(
        `Failed to create ${this.tableName}`,
        'CREATE_ERROR',
        error
      );
    }
  }

  async update(id: ID, entity: Partial<T>): Promise<T> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        throw new RepositoryError(
          `${this.tableName} with id ${id} not found`,
          'NOT_FOUND_ERROR'
        );
      }

      const updated = { ...existing, ...entity } as T;
      const data = this.fromEntity(updated);
      delete data.id;

      const setClause = Object.keys(data)
        .map((key) => `${key} = ?`)
        .join(', ');

      const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
      await this.executeCommand(sql, [...Object.values(data), id]);

      return updated;
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error;
      }
      throw new RepositoryError(
        `Failed to update ${this.tableName} with id ${id}`,
        'UPDATE_ERROR',
        error
      );
    }
  }

  async delete(id: ID): Promise<boolean> {
    try {
      const result = await this.executeCommand(
        `DELETE FROM ${this.tableName} WHERE id = ?`,
        [id]
      );
      return result > 0;
    } catch (error) {
      throw new RepositoryError(
        `Failed to delete ${this.tableName} with id ${id}`,
        'DELETE_ERROR',
        error
      );
    }
  }

  async count(filter?: Partial<T>): Promise<number> {
    try {
      const { clause, params } = this.buildWhereClause(filter || {});
      const query = `SELECT COUNT(*) as total FROM ${this.tableName}${clause}`;

      const result = await this.executeQuery(query, params);
      return result[0].total as number;
    } catch (error) {
      throw new RepositoryError(
        `Failed to count ${this.tableName}`,
        'COUNT_ERROR',
        error
      );
    }
  }

  async exists(id: ID): Promise<boolean> {
    try {
      const result = await this.executeQuery(
        `SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`,
        [id]
      );
      return result.length > 0;
    } catch (error) {
      throw new RepositoryError(
        `Failed to check existence of ${this.tableName} with id ${id}`,
        'EXISTS_ERROR',
        error
      );
    }
  }

  async createMany(entities: Omit<T, 'id'>[]): Promise<T[]> {
    try {
      if (entities.length === 0) {
        return [];
      }

      const created: T[] = [];

      for (const entity of entities) {
        const createdEntity = await this.create(entity);
        created.push(createdEntity);
      }

      return created;
    } catch (error) {
      throw new RepositoryError(
        `Failed to create many ${this.tableName}`,
        'CREATE_MANY_ERROR',
        error
      );
    }
  }

  async updateMany(ids: ID[], entity: Partial<T>): Promise<T[]> {
    try {
      const updated: T[] = [];

      for (const id of ids) {
        const updatedEntity = await this.update(id, entity);
        updated.push(updatedEntity);
      }

      return updated;
    } catch (error) {
      throw new RepositoryError(
        `Failed to update many ${this.tableName}`,
        'UPDATE_MANY_ERROR',
        error
      );
    }
  }

  async deleteMany(ids: ID[]): Promise<number> {
    try {
      if (ids.length === 0) {
        return 0;
      }

      const placeholders = ids.map(() => '?').join(',');
      const sql = `DELETE FROM ${this.tableName} WHERE id IN (${placeholders})`;

      return await this.executeCommand(sql, ids);
    } catch (error) {
      throw new RepositoryError(
        `Failed to delete many ${this.tableName}`,
        'DELETE_MANY_ERROR',
        error
      );
    }
  }

  async findOne(filter: Partial<T>): Promise<T | null> {
    const results = await this.findAll(filter);
    return results.length > 0 ? results[0] : null;
  }

  async existsAny(filter: Partial<T>): Promise<boolean> {
    const count = await this.count(filter);
    return count > 0;
  }
}
