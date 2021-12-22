const cache = {}
async function get_book(book) {
  if (cache[book]) return cache[book]
  res = await fetch('/data/'+book+'.json')
  if (!res.ok) throw new Error(res.statusText)
  data = await res.text()
  cache[book] = JSON.parse(data)
  return cache[book]
}

const brk = s => s.trim().replaceAll('\n', '</br>')
const get_html = async (data) => ejs.render(`
<% data.forEach(book => { %>
  <h2><%- brk(book.name) %></h2>
  <% book.chapters.forEach(chapter => { %>
    <h3 class="center-align"><%- brk(chapter.name) %></h3>
    <% if (chapter.desc) { %>
      <p><%- brk(chapter.desc) %></p>
    <% } %>
    <% chapter.verses.forEach(verse => { %>
      <h4><%- brk(verse.verse) %></h4>
      <% if (verse.devanagari || verse.bengali) { %>
        <p class="center-align bold"><%- brk(verse.devanagari || verse.bengali) %></p>
      <% } %>
      <p class="center-align"><%- brk(verse['verse-text']) %></p>
      <h5 class="center-align">Synonyms</h5>
      <p><%- brk(verse.synonyms) %></p>
      <h5 class="center-align">Translation</h5>
      <p class="bold"><%- brk(verse.translation) %></p>
      <% if (verse.purport) { %>
        <h5 class="center-align">Purport</h5>
        <p><%- brk(verse.purport) %></p>
      <% } %>
    <% }) %>
  <% }) %>
<% }) %>
`, {data: data})

const params = new URLSearchParams(window.location.search)
let book = params.get('book')
let options = new Set(params.getAll('option'))
if (book && options) {
  let book_select = document.querySelector(`#search select[name=book]`)
  book_select.value = book
  let option_select_options = [...document.querySelector(`#search select[name=option]`).options]
  option_select_options.forEach(option => option.selected = options.has(option.value))
  get_book(book).then(data => get_html(data)).then(html => {
    document.getElementById('content').innerHTML = html
  }).catch(err => {
    console.error(err)
  })
}