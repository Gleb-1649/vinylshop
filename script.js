
const basket = {};
const rows = document.querySelector('#basket-lines');
const emptyRow = document.querySelector('#empty-basket');
const amount = document.querySelector('#basket-amount');
const counter = document.querySelector('#basket-quantity');
const openOrder = document.querySelector('#open-order');
const orderSection = document.querySelector('#order');
const deliveryForm = document.querySelector('#delivery-form');
const confirmation = document.querySelector('#confirmation');
const storageNotice = document.querySelector('#storage-notice');
const basketKey = 'vinyl-shop-basket';
const maxCopies = 20;
const basketWarning = document.querySelector('#basket-warning');
let readWarning = '';


function money(value) {
  return value.toLocaleString('ru-RU') + ' ₽';
}

function showRecords(codes) {
  const shelf = document.querySelector('.record-grid');
  const template = document.querySelector('#release-template');
  shelf.replaceChildren();
  codes.forEach(function (code) {
    const record = records[code];
    const card = template.content.firstElementChild.cloneNode(true);
    const image = card.querySelector('.record-cover');
    image.src = record.image;
    image.alt = 'Обложка альбома ' + record.album;
    card.querySelector('h3').textContent = record.album;
    card.querySelector('.artist').textContent = record.artist;
    card.querySelector('.release-info').textContent = record.genre + ' / ' + record.year;
    card.querySelector('.description').textContent = record.description;
    card.querySelector('.release-price').textContent = money(record.price);
    const button = card.querySelector('button');
    button.dataset.addRecord = code;
    button.setAttribute('aria-label', 'Добавить в корзину: ' + record.title);
    shelf.append(card);
  });
}

showRecords(Object.keys(records));

document.querySelector('.record-grid').addEventListener('click', function (event) {
  const button = event.target.closest('[data-add-record]');
  if (!button) return;
  const code = button.dataset.addRecord;
  if ((basket[code] || 0) >= maxCopies) {
    basketWarning.textContent = 'В одном заказе может быть до 20 копий релиза.';
    return;
  }
  basketWarning.textContent = '';
  basket[code] = (basket[code] || 0) + 1;
  drawBasket();
});

function addCell(row, text) {
  const cell = document.createElement('td');
  cell.textContent = text;
  row.append(cell);
  return cell;
}

function drawBasket(persist = true) {
  const focusedId = document.activeElement.id;
  rows.replaceChildren(emptyRow);
  const codes = Object.keys(basket);
  emptyRow.hidden = codes.length > 0;

  codes.forEach(function (code) {
    const record = records[code];
    const subtotal = record.price * basket[code];
    const row = document.createElement('tr');
    addCell(row, record.title);
    addCell(row, money(record.price));
    const quantityCell = addCell(row, '');
    const input = document.createElement('input');
    input.type = 'number';
    input.id = 'quantity-' + code;
    input.min = '1';
    input.max = String(maxCopies);
    input.step = '1';
    input.value = basket[code];
    input.dataset.quantity = code;
    input.setAttribute('aria-label', 'Количество: ' + record.title);
    quantityCell.append(input);
    addCell(row, money(subtotal)).dataset.subtotal = code;
    const actions = addCell(row, '');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Удалить';
    button.dataset.remove = code;
    button.id = 'remove-' + code;
    button.setAttribute('aria-label', 'Удалить: ' + record.title);
    actions.append(button);
    rows.append(row);
  });
  updateAmount();
  openOrder.disabled = codes.length === 0;
  if (codes.length === 0) orderSection.hidden = true;
  confirmation.textContent = '';
  if (persist) storeBasket();
  const focusedControl = document.getElementById(focusedId);
  if (focusedControl) {
    focusedControl.focus();
  } else if (focusedId.startsWith('remove-')) {
    const nextInput = rows.querySelector('[data-quantity]');
    (nextInput || document.querySelector('[data-add-record]')).focus();
  }
}


rows.addEventListener('keydown', function (event) {
  if (event.key === 'Enter' && event.target.matches('[data-quantity]')) {
    event.preventDefault();
    event.target.blur();
  }
});

rows.addEventListener('change', function (event) {
  const input = event.target.closest('[data-quantity]');
  if (!input) return;
  const code = input.dataset.quantity;
  const value = Number(input.value);
  if (!Number.isInteger(value) || value < 1 || value > maxCopies) {
    input.value = basket[code];
    basketWarning.textContent = 'Введите целое количество от 1 до 20. Сохранено прежнее значение.';
    return;
  }
  basketWarning.textContent = '';
  basket[code] = value;
  // Меняем только сумму: кнопка удаления должна пережить событие change.
  input.closest('tr').querySelector('[data-subtotal]').textContent = money(value * records[code].price);
  updateAmount();
  confirmation.textContent = '';
  storeBasket();
});

function updateAmount() {
  let total = 0;
  let copies = 0;
  for (const code of Object.keys(basket)) {
    total += basket[code] * records[code].price;
    copies += basket[code];
  }
  amount.textContent = money(total);
  counter.textContent = copies;
}

rows.addEventListener('click', function (event) {
  const button = event.target.closest('[data-remove]');
  if (!button) return;
  basketWarning.textContent = '';
  delete basket[button.dataset.remove];
  drawBasket();
});

function storeBasket() {
  try {
    localStorage.setItem(basketKey, JSON.stringify(basket));
    storageNotice.textContent = readWarning;
  } catch (error) {
    console.warn('Не удалось сохранить заказ пластинок:', error);
    storageNotice.textContent = readWarning + ' Сохранение недоступно: изменения заказа могут потеряться после обновления.';
  }
}

function restoreBasket() {
  try {
    const raw = localStorage.getItem(basketKey);
    if (raw === null) return;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) {
      throw new Error('Ожидался объект с количеством пластинок');
    }
    let rejected = 0;
    Object.keys(saved).forEach(function (code) {
      const copies = saved[code];
      if (!Object.hasOwn(records, code) || !Number.isInteger(copies) || copies < 1 || copies > maxCopies) {
        rejected += 1;
      } else {
        basket[code] = copies;
      }
    });
    if (rejected > 0) readWarning = 'Пропущены некорректные позиции: ' + rejected + '.';
  } catch (error) {
    console.warn('Загрузка заказа пластинок прервана:', error);
    readWarning = 'Сохранённый заказ недоступен или повреждён. Можно собрать новый.';
  }
  storageNotice.textContent = readWarning;
}

openOrder.addEventListener('click', function () {
  if (Object.keys(basket).length === 0) return;
  orderSection.hidden = false;
  confirmation.textContent = '';
  document.querySelector('#customer-given').focus();
});

deliveryForm.addEventListener('input', function (event) {
  event.target.setCustomValidity('');
});
deliveryForm.addEventListener('submit', function (event) {
  event.preventDefault();
  if (Object.keys(basket).length === 0) return;
  const fields = deliveryForm.querySelectorAll('input, textarea');
  fields.forEach(function (field) {
    field.value = field.value.trim();
    field.setCustomValidity(field.value ? '' : 'Заполните поле.');
  });
  if (!deliveryForm.reportValidity()) return;
  Object.keys(basket).forEach(function (code) {
    delete basket[code];
  });
  drawBasket();
  deliveryForm.reset();
  confirmation.textContent = 'Заказ создан!';
  confirmation.focus();
});

restoreBasket();
drawBasket(false);

document.querySelector('#record-sort').addEventListener('change', function (event) {
  const order = event.target.value;
  const codes = Object.keys(records);
  if (order === 'cheaper') codes.sort(function (a, b) { return records[a].price - records[b].price; });
  if (order === 'newer') codes.sort(function (a, b) { return records[b].year - records[a].year; });
  if (order === 'artist') codes.sort(function (a, b) { return records[a].artist.localeCompare(records[b].artist); });
  showRecords(codes);
  document.querySelector('#sort-status').textContent = 'Порядок: ' + event.target.selectedOptions[0].textContent;
});
