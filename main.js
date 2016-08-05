#!/usr/bin/env node

const {execFileSync} = require('child_process')
const ytsearch = require('youtube-search')
const MPlayer = require('mplayer')
const mkdirp = require('mkdirp')
const needle = require('needle')
const path = require('path')
const os = require('os')
const fs = require('fs')

const title = process.argv.slice(2).join(' ')
const mp3Path = downloadedFilename(title)

// If we've already downloaded it, simply play it
// Otherwise, search YouTube for a link and download it via youtube-mp3
if (fileExists(mp3Path)) {
  play(mp3Path)
} else {
  searchYoutube(title + ' song', (err, results) => {
    if (err) return console.log(err)
    const download = downloadMp3(results[0].link)

    mkdirp.sync(path.dirname(mp3Path))
    download.pipe(fs.createWriteStream(mp3Path))
    download.on('end', () => play(mp3Path))
  })
}

function play (filepath) {
  console.log(`Playing ${filepath}...`)
  const player = new MPlayer()

  player.openFile(filepath)
  player.play()

  player.on('stop', () => {
    console.log('Done. Thanks for listening!')
    process.exit(0)
  })
}

function searchYoutube (query, done) {
  console.log(`Searching for ${query}...`)

  ytsearch(query, {
    maxResults: 10,
    key: 'AIzaSyC4_QToE-jHkz_CZ9v_HO3PUyUk4Zn57sw'
  }, (err, results) => {
    if (err) return done(err)

    // Search specifically for lyrics videos if they exist
    // Don't want any of that additional storyline stuff
    if (!results.filter(r => r.title.match(/lyric/)).length) return done(null, results)
    return searchYoutube(query + ' lyrics', done)
  })
}

function downloadMp3 (youtubeUrl) {
  console.log(`Grabbing download link for ${youtubeUrl}...`)
  const stdout = execFileSync('phantomjs', ['getDownloadUrl.js', youtubeUrl])
  const {downloadLink, cookies, referer} = JSON.parse(stdout)

  console.log(`Downloading from ${downloadLink}...`)
  return needle.get(downloadLink, {
    headers: {referer: referer},
    cookies: cookies,
    follow: 5
  })
}

function downloadedFilename (title) {
  const filename = title.replace(/\s+/g, '-').toLowerCase() + '.mp3'
  return path.join(os.homedir(), '.playme', 'music', filename)
}

function fileExists (path) {
  try {
    fs.statSync(mp3Path)
    return true
  } catch (e) {
    return false
  }
}
