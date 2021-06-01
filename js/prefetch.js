function getParam(url, key) {
  if (!key) return null
  var m = url.match(new RegExp('(\\?|&)' + key + '=([^&]+)'))
  return m ? m[2].split('#')[0] : null
}

WeixinPrefetcher.config({
  shouldFetchContent(url, extInfo) {
    return true
  },
  getFetchPkgType(url, extInfo) {
    return 2
  },
  getId(url) {
    return getParam(url, 'album_id')
  }
})

WeixinPrefetcher.on('fetch', function({ url, userHash, extInfo }) {
  WeixinPrefetcher.setMinBizPkgVersion && WeixinPrefetcher.setMinBizPkgVersion(27023516);
  return true
})
