const cache = {}
async function get_book(book) {
  if (cache[book]) return cache[book]
  res = await fetch('https://swag31415.github.io/Krishna-Compendium/data/'+book+'.json')
  if (!res.ok) throw new Error(res.statusText)
  data = await res.text()
  cache[book] = JSON.parse(data)
  return cache[book]
}

function build_toc(root, is_sub) {
  let divs = root.querySelectorAll(':scope > div.toc')
  if (divs.length == 0) return ''
  else return ejs.render(`
  <% if (is_sub) { %> <div class="collapsible-body"> <% } %>
    <ul class="collapsible collapsible-accordion">
      <% divs.forEach(div => { %>
        <li><a href="#<%- div.id %>" class="collapsible-header"><%- div.dataset.name %></a><%- build_toc(div, true) %></li>
      <% }) %>
    </ul>
  <% if (is_sub) { %> </div> <% } %>
  `, {divs: divs, is_sub: is_sub})
}

const brk = (s, acc) => (acc ? s : s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')).trim().replaceAll('\n', '</br>')
const gid = (...n) => ['v', ...n].join('-')
const get_html = async (data, options) => ejs.render(`
<% data.forEach((book, i) => { %>
  <div id="<%- gid(i) %>" class="toc" data-name="<%- brk(book.name, options.has('accent')) %>">
    <% if (options.has('name')) { %>
      <h2><a href="#<%- gid(i) %>"><%- brk(book.name, options.has('accent')) %></a></h2>
    <% } %>
    <% book.chapters.forEach((chapter, j) => { %>
      <div id="<%- gid(i,j) %>" class="toc" data-name="<%- brk(chapter.name, options.has('accent')) %>">
        <% if (options.has('title')) { %>
          <h3 class="center-align"><a href="#<%- gid(i,j) %>"><%- brk(chapter.name, options.has('accent')) %></a></h3>
        <% } %>
        <% if (options.has('desc') && chapter.desc) { %>
          <p><%- brk(chapter.desc, options.has('accent')) %></p>
        <% } %>
        <% chapter.verses.forEach((verse, k) => { %>
          <div id="<%- gid(i,j,k) %>" class="toc" data-name="<%- brk(verse.verse, options.has('accent')) %>">
            <% if (options.has('numbers')) { %>
              <h4><a href="#<%- gid(i,j,k) %>"><%- brk(verse.verse, options.has('accent')) %></a></h4>
            <% } %>
            <% if (options.has('og') && (verse.devanagari || verse.bengali)) { %>
              <p class="center-align bold"><%- brk(verse.devanagari || verse.bengali, options.has('accent')) %></p>
            <% } %>
            <% if (options.has('verse')) { %>
              <p class="center-align"><%- brk(verse['verse-text'], options.has('accent')) %></p>
            <% } %>
            <% if (options.has('synonyms')) { %>
              <% if (options.has('subhead')) { %>
                <h5 class="center-align">Synonyms</h5>
              <% } %>
              <p><%- brk(verse.synonyms, options.has('accent')) %></p>
            <% } %>
            <% if (options.has('translation')) { %>
              <% if (options.has('subhead')) { %>
                <h5 class="center-align">Translation</h5>
              <% } %>
              <p class="bold"><%- brk(verse.translation, options.has('accent')) %></p>
            <% } %>
            <% if (options.has('purport') && verse.purport) { %>
              <% if (options.has('subhead')) { %>
                <h5 class="center-align">Purport</h5>
              <% } %>
              <p><%- brk(verse.purport, options.has('accent')) %></p>
            <% } %>
          </div>
        <% }) %>
      </div>
    <% }) %>
  </div>
<% }) %>
`, {data: data, options: options})

const params = new URLSearchParams(window.location.search)
let book = params.get('book')
let options = new Set(params.getAll('option'))
if (book && options) {
  let book_select = document.querySelector(`#search select[name=book]`)
  book_select.value = book
  let option_select_options = [...document.querySelector(`#search select[name=option]`).options]
  option_select_options.forEach(option => option.selected = options.has(option.value))
  // Wait for Materialize for the most consistent looks
  m_ready.then(() => {
    M.toast({html: 'Loading Book...'})
    return get_book(book)
  }).then(data => get_html(data, options)).then(html => {
    let content_div = document.getElementById('content')
    content_div.innerHTML = html
    document.getElementById('toc').innerHTML = build_toc(content_div)
    document.getElementById('toc-trigger').style.visibility = 'visible'
    if (window.location.hash) {
      document.querySelector(window.location.hash).scrollIntoView()
    }
    // Do it again because we added stuff
    M.AutoInit()
    M.toast({html: 'All Done!', classes: 'green'})
  }).catch(err => {
    M.toast({html: 'Something went wrong', classes: 'red'})
    console.error(err)
  })
}