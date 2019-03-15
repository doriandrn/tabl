import * as rxdb from 'rxdb'
import { TSExternalModuleReference } from 'babel-types';

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

  let db

  if (process.server) {
    rxdb.plugin(require('pouchdb-adapter-leveldb'))
    rxdb.plugin(require('rxdb/plugins/server'))
  } else {
    rxdb.plugin(require('pouchdb-adapter-http'))
  }

  db = await rxdb.create({
    name: `dist/tapp`,
    adapter: process.server ? 'leveldb' : 'http',
    multiInstance: false
  })

  await Promise.all(Object.keys(cols).map(async col => {
    await db.collection(cols[col])
    if (!process.server) {
      const remote = `http://${window.location.hostname}:${PORT}${PATH}/${col}`
      db[col].sync({ remote, options: {
        live: true,
        retry: TSExternalModuleReference
      } })
    }
  }))

  // else
  inject('db', db)

  if (process.server) {
    db.server({
      path: PATH,
      port: PORT,
      cors: true
    })
  }
}
