import { IndyStorageService } from '../IndyStorageService'
import { IndyWallet } from '../../wallet/IndyWallet'
import { AgentConfig } from '../../agent/AgentConfig'
import { getBaseConfig } from '../../__tests__/helpers'
import { RecordDuplicateError, RecordNotFoundError } from '../../error'
import { TestRecord } from './TestRecord'

describe('IndyStorageService', () => {
  let wallet: IndyWallet
  let storageService: IndyStorageService<TestRecord>

  beforeEach(async () => {
    wallet = new IndyWallet(new AgentConfig(getBaseConfig('IndyStorageServiceTest')))
    await wallet.init()
    storageService = new IndyStorageService<TestRecord>(wallet)
  })

  afterEach(async () => {
    await wallet.close()
    await wallet.delete()
  })

  const insertRecord = async ({ id, tags }: { id?: string; tags?: Record<string, string> } = {}) => {
    const props = {
      id,
      foo: 'bar',
      tags: tags ?? { myTag: 'foobar' },
    }
    const record = new TestRecord(props)
    await storageService.save(record)
    return record
  }

  describe('save()', () => {
    it('should throw RecordDuplicateError if a record with the id already exists', async () => {
      const record = await insertRecord({ id: 'test-id' })

      return expect(() => storageService.save(record)).rejects.toThrowError(RecordDuplicateError)
    })

    it('should save the record', async () => {
      const record = await insertRecord({ id: 'test-id' })
      const found = await storageService.getById(TestRecord, 'test-id')

      expect(record).toEqual(found)
    })
  })

  describe('getById()', () => {
    it('should throw RecordNotFoundError if the record does not exist', async () => {
      return expect(() => storageService.getById(TestRecord, 'does-not-exist')).rejects.toThrowError(
        RecordNotFoundError
      )
    })

    it('should return the record by id', async () => {
      const record = await insertRecord({ id: 'test-id' })
      const found = await storageService.getById(TestRecord, 'test-id')

      expect(found).toEqual(record)
    })
  })

  describe('update()', () => {
    it('should throw RecordNotFoundError if the record does not exist', async () => {
      const record = new TestRecord({
        id: 'test-id',
        foo: 'test',
        tags: { some: 'tag' },
      })

      return expect(() => storageService.update(record)).rejects.toThrowError(RecordNotFoundError)
    })

    it('should update the record', async () => {
      const record = await insertRecord({ id: 'test-id' })

      record.tags = { ...record.tags, foo: 'bar' }
      record.foo = 'foobaz'
      await storageService.update(record)

      const got = await storageService.getById(TestRecord, record.id)
      expect(got).toEqual(record)
    })
  })

  describe('delete()', () => {
    it('should throw RecordNotFoundError if the record does not exist', async () => {
      const record = new TestRecord({
        id: 'test-id',
        foo: 'test',
        tags: { some: 'tag' },
      })

      return expect(() => storageService.delete(record)).rejects.toThrowError(RecordNotFoundError)
    })

    it('should delete the record', async () => {
      const record = await insertRecord({ id: 'test-id' })
      await storageService.delete(record)

      return expect(() => storageService.getById(TestRecord, record.id)).rejects.toThrowError(RecordNotFoundError)
    })
  })

  describe('getAll()', () => {
    it('should retrieve all records', async () => {
      const createdRecords = await Promise.all(
        Array(5)
          .fill(undefined)
          .map((_, index) => insertRecord({ id: `record-${index}` }))
      )

      const records = await storageService.getAll(TestRecord)

      expect(records).toEqual(expect.arrayContaining(createdRecords))
    })
  })

  describe('findByQuery()', () => {
    it('should retrieve all records that match the query', async () => {
      const expectedRecord = await insertRecord({ tags: { myTag: 'foobar' } })
      await insertRecord({ tags: { myTag: 'notfoobar' } })

      const records = await storageService.findByQuery(TestRecord, { myTag: 'foobar' })

      expect(records.length).toBe(1)
      expect(records[0]).toEqual(expectedRecord)
    })
  })
})
