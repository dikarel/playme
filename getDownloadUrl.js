/* globals phantom, $ */

var jqueryUrl = 'https://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js'
var youtubeUrl = require('system').args[1]

var page = require('webpage').create()
page.viewportSize = {
  width: 1024,
  height: 768
}

page.open('http://www.youtube-mp3.org', function () {
  page.includeJs(jqueryUrl, function () {
    page.evaluate(function (youtubeUrl) {
      $('input[type=text]').val(youtubeUrl)
      $('input[type=submit]').click()
    }, youtubeUrl)

    checkDownloadLink()
  })
})

function checkDownloadLink () {
  var downloadLink = page.evaluate(function () { return $('#dl_link a:visible').attr('href') })
  if (!downloadLink) return setTimeout(checkDownloadLink, 100)

  console.log(JSON.stringify({
    downloadLink: 'http://www.youtube-mp3.org' + downloadLink,
    cookies: combineCookies(page.cookies),
    referer: page.url
  }))

  phantom.exit()
}

function combineCookies (cookies) {
  var combinedCookies = {}

  cookies.forEach(function (cookie) {
    combinedCookies[cookie.name] = cookie.value
  })

  return combinedCookies
}
