<template>
  <div class="ingress-dataplanes">
    <FrameSkeleton>
      <DataOverview
        :page-size="pageSize"
        :has-error="hasError"
        :is-loading="isLoading"
        :empty-state="empty_state"
        :display-data-table="true"
        :table-data="tableData"
        :table-data-is-empty="tableDataIsEmpty"
        table-data-function-text="View"
        table-data-row="name"
        @tableAction="tableAction"
        @reloadData="loadData"
      >
        <template slot="additionalControls">
          <KButton
            class="add-dp-button"
            appearance="primary"
            size="small"
            :to="dataplaneWizardRoute"
          >
            <span class="custom-control-icon">
              +
            </span>
            Create Dataplane Proxy
          </KButton>
          <KButton
            v-if="this.$route.query.ns"
            class="back-button"
            appearance="primary"
            size="small"
            :to="{
              name: 'ingress-dataplanes'
            }"
          >
            <span class="custom-control-icon">
              &larr;
            </span>
            View All
          </KButton>
        </template>
        <template slot="pagination">
          <Pagination
            :has-previous="previous.length > 0"
            :has-next="hasNext"
            @next="goToNextPage"
            @previous="goToPreviousPage"
          />
        </template>
      </DataOverview>
      <Tabs
        v-if="isEmpty === false"
        :has-error="hasError"
        :is-loading="isLoading"
        :tabs="tabs"
        initial-tab-override="overview"
      >
        <template slot="tabHeader">
          <div>
            <h3>{{ tabGroupTitle }}</h3>
          </div>
          <div>
            <EntityURLControl :url="shareUrl" />
          </div>
        </template>
        <template slot="overview">
          <LabelList
            :has-error="entityHasError"
            :is-loading="entityIsLoading"
            :is-empty="entityIsEmpty"
          >
            <!-- basic information -->
            <div>
              <ul>
                <li
                  v-for="(val, key) in entity.basicData"
                  :key="key"
                >
                  <h4>{{ key }}</h4>
                  <p>
                    {{ val }}
                  </p>
                </li>
              </ul>
            </div>
            <!-- tag information -->
            <div>
              <h4>Tags</h4>
              <p>
                <span
                  v-for="(val, key) in entity.tags"
                  :key="key"
                  class="tag-cols"
                >
                  <span>
                    {{ val.label }}:
                  </span>
                  <span>
                    {{ val.value }}
                  </span>
                </span>
              </p>
            </div>
          </LabelList>
        </template>
        <template slot="yaml">
          <YamlView
            :title="entityOverviewTitle"
            :has-error="entityHasError"
            :is-loading="entityIsLoading"
            :is-empty="entityIsEmpty"
            :content="rawEntity"
          />
        </template>
      </Tabs>
    </FrameSkeleton>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getSome, humanReadableDate, getOffset, stripTimes } from '@/helpers'
import { dpTags } from '@/dataplane'
import EntityURLControl from '@/components/Utils/EntityURLControl'
import sortEntities from '@/mixins/EntitySorter'
import FrameSkeleton from '@/components/Skeletons/FrameSkeleton'
import Pagination from '@/components/Pagination'
import DataOverview from '@/components/Skeletons/DataOverview'
import Tabs from '@/components/Utils/Tabs'
import YamlView from '@/components/Skeletons/YamlView'
import LabelList from '@/components/Utils/LabelList'

export default {
  name: 'IngressDataplanes',
  metaInfo: {
    title: 'Ingress data plane proxies'
  },
  components: {
    EntityURLControl,
    FrameSkeleton,
    Pagination,
    DataOverview,
    Tabs,
    YamlView,
    LabelList
  },
  mixins: [
    sortEntities
  ],
  data () {
    return {
      isLoading: true,
      isEmpty: false,
      hasError: false,
      entityIsLoading: true,
      entityIsEmpty: false,
      entityHasError: false,
      tableDataIsEmpty: false,
      empty_state: {
        title: 'No Data',
        message: 'There are no Ingress data plane proxies present.'
      },
      tableData: {
        headers: [
          { key: 'actions', hideLabel: true },
          { label: 'Status', key: 'status' },
          { label: 'Name', key: 'name' },
          { label: 'Type', key: 'type' },
          { label: 'Tags', key: 'tags' },
          { label: 'Public address', key: 'publicAddress' },
          { label: 'Public port', key: 'publicPort' },
          { label: 'Last Connected', key: 'lastConnected' },
          { label: 'Last Updated', key: 'lastUpdated' },
          { label: 'Total Updates', key: 'totalUpdates' },
          { label: 'Kuma DP version', key: 'dpVersion' },
          { label: 'Envoy version', key: 'envoyVersion' }
        ],
        data: []
      },
      tabs: [
        {
          hash: '#overview',
          title: 'Overview'
        },
        {
          hash: '#yaml',
          title: 'YAML'
        }
      ],
      entity: [],
      rawEntity: null,
      firstEntity: null,
      pageSize: this.$pageSize,
      pageOffset: null,
      next: null,
      hasNext: false,
      previous: [],
      tabGroupTitle: null,
      entityNamespace: null,
      entityOverviewTitle: null,
      showmTLSTab: false
    }
  },
  computed: {
    ...mapGetters({
      environment: 'getEnvironment',
      queryNamespace: 'getItemQueryNamespace'
    }),
    dataplaneWizardRoute () {
      // we change the route to the Dataplane
      // wizard based on environment.
      if (this.environment === 'universal') {
        return { name: 'universal-dataplane' }
      } else {
        return { name: 'kubernetes-dataplane' }
      }
    },
    version () {
      const storedVersion = this.$store.getters.getVersion

      return (storedVersion !== null) ? storedVersion : 'latest'
    },
    shareUrl () {
      const urlRoot = `${window.location.origin}#`
      const entity = this.entity

      const shareUrl = () => {
        if (entity.basicData) {
          if (this.$route.query.ns) {
            return this.$route.fullPath
          }

          return `${urlRoot}${this.$route.fullPath}?ns=${entity.basicData.name}`
        }

        return null
      }

      return shareUrl()
    }
  },
  watch: {
    '$route' (to, from) {
      this.loadData()
    }
  },
  beforeMount () {
    this.loadData()
  },
  methods: {
    init () {
      this.loadData()
    },
    goToPreviousPage () {
      this.pageOffset = this.previous.pop()
      this.next = null

      this.loadData()
    },
    goToNextPage () {
      this.previous.push(this.pageOffset)
      this.pageOffset = this.next
      this.next = null

      this.loadData()
    },
    tableAction (ev) {
      const data = ev

      // reset back to the first tab
      this.$store.dispatch('updateSelectedTab', this.tabs[0].hash)

      // set the active table row
      this.$store.dispatch('updateSelectedTableRow', data.name)

      // load the data into the tabs
      this.getEntity(data)
    },
    loadData () {
      this.isLoading = true

      const mesh = this.$route.params.mesh || null
      const query = this.$route.query.ns || null

      // we only need the offset if there is a size added
      const params = {
        size: this.pageSize,
        offset: this.pageOffset,
        ingress: true
      }

      /**
       * determine which endpoint to use based on the mesh.
       * we are either fetching entities from one mesh, or fetching
       * all of them from all meshes and collecting them into the view.
       */
      const endpoint = () => {
        if (mesh === 'all') {
          return this.$api.getAllDataplaneOverviews(params)
        } else if ((query && query.length) && mesh !== 'all') {
          return this.$api.getDataplaneOverviewFromMesh(mesh, query)
        }

        return this.$api.getAllDataplaneOverviewsFromMesh(mesh, params)
      }

      /**
       * the function used for fetching dataplanes from a mesh
       * and then collecting them into an array.
       */
      const dpFetcher = (mesh, name, finalArr) => {
        this.$api.getDataplaneOverviewFromMesh(mesh, name)
          .then(response => {
            const placeholder = 'n/a'

            let lastConnected
            let lastUpdated
            let tags = []
            let totalUpdates = []
            let totalRejectedUpdates = []
            let status = 'Offline'
            let dpVersion = ''
            let envoyVersion = ''
            const connectTimes = []
            const updateTimes = []

            /**
             * Determine the Dataplane type
             */
            const ingress = response.dataplane.networking.ingress || null

            /**
             * The Dataplane type label
             */
            const dataplaneType = 'Ingress'

            /**
             * Handle our tag collection
             */
            tags = dpTags(response.dataplane)

            /**
             * Iterate through the subscriptions
             */
            if (response.dataplaneInsight.subscriptions && response.dataplaneInsight.subscriptions.length) {
              response.dataplaneInsight.subscriptions.forEach(item => {
                const responsesSent = item.status.total.responsesSent || 0
                const rejectedResponsesSent = item.status.total.responsesRejected || 0
                const connectTime = item.connectTime || placeholder
                const lastUpdateTime = item.status.lastUpdateTime || placeholder
                const disconnectTime = item.disconnectTime || null

                totalUpdates.push(parseInt(responsesSent))
                totalRejectedUpdates.push(parseInt(rejectedResponsesSent))
                connectTimes.push(connectTime)
                updateTimes.push(lastUpdateTime)

                if (connectTime && connectTime.length && !disconnectTime) {
                  status = 'Online'
                } else {
                  status = 'Offline'
                }

                if (item.version && item.version.kumaDp) {
                  dpVersion = item.version.kumaDp.version
                  envoyVersion = item.version.envoy.version
                }
              })

              // get the sum of total updates (with some precautions)
              totalUpdates = totalUpdates.reduce((a, b) => a + b)
              // get the sum of total rejection
              totalRejectedUpdates = totalRejectedUpdates.reduce((a, b) => a + b)
              // select the most recent LAST CONNECTED timestamp
              const selectedTime = connectTimes.reduce((a, b) => {
                if (a && b) {
                  return a.MeasureDate > b.MeasureDate ? a : b
                }

                return null
              })

              // select the most recent LAST UPDATED timestamnp
              const selectedUpdateTime = updateTimes.reduce((a, b) => {
                if (a && b) {
                  return a.MeasureDate > b.MeasureDate ? a : b
                }

                return null
              })

              // format each reduced value as a date to compare against
              const selectedTimeAsDate = new Date(selectedTime)
              const selectedUpdateTimeAsDate = new Date(selectedUpdateTime)

              /**
               * @todo refactor this to use a function instead
               */

              // formatted time for LAST CONNECTED (if there is a value present)
              if (selectedTime && !isNaN(selectedTimeAsDate)) {
                lastConnected = humanReadableDate(selectedTimeAsDate)
              } else {
                lastConnected = 'never'
              }

              // formatted time for LAST UPDATED (if there is a value present)
              if (selectedUpdateTime && !isNaN(selectedUpdateTimeAsDate)) {
                lastUpdated = humanReadableDate(selectedUpdateTimeAsDate)
              } else {
                lastUpdated = 'never'
              }
            } else {
              // if there are no subscriptions, set them all to a fallback
              lastConnected = 'never'
              lastUpdated = 'never'
              totalUpdates = 0
              totalRejectedUpdates = 0
              dpVersion = '-'
              envoyVersion = '-'
            }

            // assemble the table data
            finalArr.push({
              name: response.name,
              mesh: response.mesh,
              tags: tags,
              status: status,
              lastConnected: lastConnected,
              lastUpdated: lastUpdated,
              totalUpdates: totalUpdates,
              totalRejectedUpdates: totalRejectedUpdates,
              publicAddress: (response.dataplane.networking.ingress.publicAddress || null),
              publicPort: (response.dataplane.networking.ingress.publicPort || null),
              dpVersion: dpVersion,
              envoyVersion: envoyVersion,
              type: dataplaneType
            })

            this.sortEntities(finalArr)

            return finalArr
          })
          .catch(error => {
            console.error(error)
          })
      }

      const getDataplanes = () => {
        return endpoint()
          .then(response => {
            const items = () => {
              const r = response

              if ('total' in r) {
                if (r.total !== 0 && r.items && r.items.length > 0) {
                  return this.sortEntities(r.items)
                }

                return null
              }

              return r
            }

            if (items()) {
              // check to see if the `next` url is present
              if (response.next) {
                this.next = getOffset(response.next)
                this.hasNext = true
              } else {
                this.hasNext = false
              }

              const final = []
              const itemSelect = query
                ? items()
                : items()[0]

              // set the first item as the default for initial load
              this.firstEntity = itemSelect.name

              // load the YAML entity for the first item on page load
              this.getEntity(itemSelect)

              // set the selected table row for the first item on page load
              this.$store.dispatch('updateSelectedTableRow', this.firstEntity)

              if ((query && query.length) && (mesh && mesh.length)) {
                dpFetcher(mesh, query, final)
              } else {
                items().forEach(item => {
                  dpFetcher(item.mesh, item.name, final)
                })
              }

              this.tableData.data = final
              this.tableDataIsEmpty = false
              this.isEmpty = false
            } else {
              this.tableData.data = []
              this.tableDataIsEmpty = true
              this.isEmpty = true

              this.getEntity(null)
            }
          })
          .catch(error => {
            this.hasError = true
            this.isEmpty = true

            console.error(error)
          })
          .finally(() => {
            setTimeout(() => {
              this.isLoading = false
            }, process.env.VUE_APP_DATA_TIMEOUT)
          })
      }

      getDataplanes()
    },
    getEntity (entity) {
      this.entityIsLoading = true
      this.entityIsEmpty = false

      const mesh = this.$route.params.mesh

      if (entity && entity !== null) {
        const entityMesh = (mesh === 'all')
          ? entity.mesh
          : mesh

        return this.$api.getDataplaneFromMesh(entityMesh, entity.name)
          .then(response => {
            if (response) {
              const selected = ['type', 'name', 'mesh']

              const newEntity = async () => {
                return {
                  basicData: { ...getSome(response, selected) },
                  tags: dpTags(response),
                }
              }

              newEntity().then(i => {
                this.entity = i
                this.entityNamespace = i.basicData.name
                this.tabGroupTitle = `Mesh: ${i.basicData.name}`
                this.entityOverviewTitle = `Entity Overview for ${i.basicData.name}`
              })

              // this.rawEntity = response
              this.rawEntity = stripTimes(response)
            } else {
              this.entity = null
              this.entityIsEmpty = true
            }
          })
          .catch(error => {
            this.entityHasError = true
            console.error(error)
          })
          .finally(() => {
            setTimeout(() => {
              this.entityIsLoading = false
            }, process.env.VUE_APP_DATA_TIMEOUT)
          })
      } else {
        setTimeout(() => {
          this.entityIsEmpty = true
          this.entityIsLoading = false
        }, process.env.VUE_APP_DATA_TIMEOUT)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.add-dp-button {
  background-color: var(--logo-green) !important;
}
</style>
