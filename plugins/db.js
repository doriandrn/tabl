import { RxDatabase, RxCollection, create, plugin } from 'rxdb'

if (process.server) {
  plugin(require('rxdb/plugins/server'))
  plugin(require('pouchdb-adapter-memory'))
} else {
  console.log('client!')
  plugin(require('pouchdb-adapter-http'))
}

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
        title: { type: 'string' },
        category: { ref: 'categories', type: 'string', index: true },
        total: { type: 'number' }
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
        dataset: { ref: 'datasets', type: 'string' }
      }
    }
  }
}

export default async ({ app }, inject) => {
  const PATH = '/ttdb'
  const PORT = 51337

  const db = await create({
    name: 'tableapp4',
    adapter: 'memory',
    multiInstance: false
  })

  await Promise.all(Object.keys(cols).map(async col => {
    await db.collection(cols[col])
    if (!process.server) {
      db[col].sync({
        remote: `http://localhost:${PORT}${PATH}/${col}`
      });
    }
  }))

  if (process.server) {
    db.server({
      path: PATH,
      port: PORT,
      cors: true
    })
  } else {
    inject('db', db)
  }
}
