import { RxDatabase, RxCollection, create, plugin } from 'rxdb'

plugin(require('pouchdb-adapter-idb'))

const cols = {
  categories: {
    name: 'categories',
    schema: {
      title: 'category',
      version: 0,
      type: 'object',
      properties: {
        name: {
          type: 'string'
        }
      }
    }
  },
  datasets: {
    name: 'datasets',
    schema: {
      title: 'dataset',
      version: 0,
      type: 'object',
      properties: {
        name: { type: 'string' },
        category: { ref: 'categories', type: 'string', index: true }
      }
    }
  },
  views: {
    name: 'views',
    schema: {
      title: 'view',
      version: 0,
      type: 'object',
      properties: {
        name: { type: 'string' },
        criteria: { type: 'object' },
        table: { ref: 'tables', type: 'string' }
      }
    }
  }
}

export default async ({ app }, inject) => {
  const db = await create({
    name: 'tableapp',
    adapter: 'idb'
  })

  await Promise.all(Object.keys(cols).map(col => db.collection(cols[col])))

  inject('db', db)
}
