const params = new URLSearchParams(window.location.search)
let book = params.get('book')
let options = new Set(params.getAll('option'))
if (book && options) {
  let book_select = document.querySelector(`#search select[name=book]`)
  book_select.value = book
  let option_select_options = [...document.querySelector(`#search select[name=option]`).options]
  option_select_options.forEach(option => option.selected = options.has(option.value))
}