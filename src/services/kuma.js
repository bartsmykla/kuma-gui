import RestClient from '@/services/restClient'

export default class Kuma {
  constructor (options) {
    const opts = options || {}

    this.options = opts
    this.client = opts.client || new RestClient(opts)

    // `workspace` is `mesh` in this context
    this.workspace = opts.workspace
  }

  buildUrl (path) {
    return this.client.buildUrl(path)
  }

  getInfo (workspace) {
    return this.client.get(`/${workspace}`)
  }

  // get a list of all meshes
  getAllMeshes () {
    return this.client.get('/meshes')
  }

  // get a single mesh
  getMesh (name, params) {
    return this.client.get(`/meshes/${name}`, { params })
  }

  // get a list of all dataplanes
  getAllDataplanes (name, params) {
    return this.client.get(`/meshes/${name}/dataplanes`, { params })
  }

  // get a single dataplane
  getDataplane (name, dataplane, params) {
    return this.client.get(`/meshes/${name}/dataplanes/${dataplane}`, { params })
  }

  //
  // NOTE: there are no endpoints yet for fetching service information
  //

  // get a list of all services
  getAllServices (name, params) {
    return this.client.get(`/meshes/${name}/services`, { params })
  }

  // get a single service
  getService (name, service, params) {
    return this.client.get(`/meshes/${name}/services/${service}`, { params })
  }
}