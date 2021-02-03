const sumDataplanes = (curr = {}, next = {}) => {
  const currOnline = curr.online || 0
  const nextOnline = next.online || 0
  const currTotal = curr.total || 0
  const nextTotal = next.total || 0

  return {
    online: currOnline + nextOnline,
    total: currTotal + nextTotal,
  }
}

const getInitialPolicies = () => ({
  CircuitBreaker: {
    total: 0,
  },
  FaultInjection: {
    total: 0,
  },
  HealthCheck: {
    total: 0,
  },
  ProxyTemplate: {
    total: 0,
  },
  TrafficLog: {
    total: 0,
  },
  TrafficPermission: {
    total: 0,
  },
  TrafficRoute: {
    total: 0,
  },
  TrafficTrace: {
    total: 0,
  },
  Retry: {
    total: 0,
  },
})

const sumPolicies = (curr = getInitialPolicies(), next = {}) =>
  Object.entries(next).reduce((acc, [name, stat]) => {
    const currTotal = acc[name]
      ? acc[name].total
      : 0

    return {
      ...acc,
      [name]: {
        total: currTotal + stat.total,
      },
    }
  }, curr)

const sumDependencyVersion = (curr = {}, next = {}) =>
  Object.entries(next).reduce((acc, [version, stat]) => ({
    ...acc,
    [version]: sumDataplanes(acc[version], stat),
  }), curr)

const sumVersions = (curr = {}, next = {}) => ({
  kumaDp: sumDependencyVersion(curr.kumaDp, next.kumaDp),
  envoy: sumDependencyVersion(curr.envoy, next.envoy),
})

export function getEmptyInsight () {
  return {
    meshesTotal: 0,
    dataplanes: { online: 0, total: 0 },
    policies: getInitialPolicies(),
    dpVersions: { kumaDp: {}, envoy: {} }
  }
}

export function parseInsightReducer (insight = {}) {
  return mergeInsightsReducer([insight])
}

export function mergeInsightsReducer (insights = []) {
  return insights.reduce((acc, insight) => ({
    meshesTotal: insights.length,
    dataplanes: sumDataplanes(acc.dataplanes, insight.dataplanes),
    policies: sumPolicies(acc.policies, insight.policies),
    dpVersions: sumVersions(acc.dpVersions, insight.dpVersions),
  }), {})
}