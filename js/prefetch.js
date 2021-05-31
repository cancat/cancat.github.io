WeixinPrefetcher.config({
  shouldFetchContent(url, extInfo) {
    return true
  },
  getFetchPkgType(url, extInfo) {
    return 2
  }
})

WeixinPrefetcher.on('fetch', function({ url, userHash, extInfo }) {
  WeixinPrefetcher.setMinBizPkgVersion && WeixinPrefetcher.setMinBizPkgVersion(27023516);
  return true
})